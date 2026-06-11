'use client';

import { useState, useEffect } from 'react';
import { Team, Bid, PAYOUT_RATES, PAYOUT_BONUSES, RoundStatus } from '@/lib/types';
import { getSupabaseClient } from '@/lib/supabase-client';

const ROUND_OPTIONS: { value: RoundStatus; label: string }[] = [
  { value: 'group', label: 'Group Stage' },
  { value: 'round_of_16', label: 'Round of 16' },
  { value: 'quarter_final', label: 'Quarter Final' },
  { value: 'semi_final', label: 'Semi Final' },
  { value: 'runner_up', label: 'Runner Up' },
  { value: 'champion', label: 'Champion' },
  { value: 'eliminated', label: 'Eliminated' },
];

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [bids, setBids] = useState<Bid[]>([]);
  const [tab, setTab] = useState<'teams' | 'bids' | 'payouts'>('teams');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchPublicData = async () => {
    const [tr, br] = await Promise.all([
      fetch('/api/teams'),
      fetch('/api/bids-list'),
    ]);
    const teamsData = await tr.json();
    const bidsData = await br.json();
    setTeams(teamsData);
    setBids(bidsData);
  };

  useEffect(() => {
    if (!authed) return;
    fetchPublicData();

    const supabase = getSupabaseClient();
    const channel = supabase
      .channel('admin-live')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'teams' }, payload => {
        setTeams(prev => prev.map(t => t.id === payload.new.id ? payload.new as Team : t));
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bids' }, payload => {
        setBids(prev => [payload.new as Bid, ...prev]);
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'bids' }, payload => {
        setBids(prev => prev.filter(b => b.id !== (payload.old as Bid).id));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple client-side check — real auth happens server-side on each action
    if (password.trim()) setAuthed(true);
  };

  const updateStatus = async (teamId: number, status: RoundStatus) => {
    setLoading(true);
    const res = await fetch('/api/admin/update-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, teamId, status }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error || 'Error updating status');
    } else {
      setMsg(`Updated!`);
    }
    setLoading(false);
    setTimeout(() => setMsg(''), 2000);
  };

  const deleteBid = async (bidId: number) => {
    if (!confirm('Delete this bid?')) return;
    setLoading(true);
    const res = await fetch('/api/admin/delete-bid', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, bidId }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error || 'Error deleting bid');
    } else {
      setMsg('Bid deleted');
    }
    setLoading(false);
    setTimeout(() => setMsg(''), 2000);
  };

  if (!authed) {
    return (
      <div className="min-h-screen bg-pitch flex items-center justify-center">
        <form onSubmit={handleLogin} className="bg-pitch-light p-8 rounded-xl border border-gold/20 w-full max-w-sm">
          <h1 className="text-2xl font-bold text-gold mb-6 text-center">Admin Login</h1>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full bg-pitch border border-gold/30 text-white rounded-lg px-4 py-3 mb-4 focus:outline-none focus:border-gold"
          />
          <button type="submit" className="w-full bg-gold text-pitch font-bold py-3 rounded-lg hover:bg-gold/80 transition-colors">
            Enter
          </button>
        </form>
      </div>
    );
  }

  const totalPool = teams.reduce((s, t) => s + (t.current_bid || 0), 0);

  return (
    <div className="min-h-screen bg-pitch text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gold">Admin Panel</h1>
          <div className="flex items-center gap-4">
            {msg && <span className="text-green-400 text-sm">{msg}</span>}
            <span className="text-white/50 text-sm">Prize Pool: ${totalPool}</span>
            <a href="/" className="text-gold/70 hover:text-gold text-sm">← Back to Site</a>
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          {(['teams', 'bids', 'payouts'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-lg font-semibold capitalize transition-colors ${
                tab === t ? 'bg-gold text-pitch' : 'bg-pitch-light text-white/70 hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === 'teams' && (
          <div className="space-y-2">
            <p className="text-white/50 text-sm mb-4">Update team status as the tournament progresses. Changes reflect immediately on the leaderboard.</p>
            {teams.map(team => (
              <div key={team.id} className="bg-pitch-light rounded-lg p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-2xl">{team.flag}</span>
                  <div>
                    <div className="font-semibold">{team.name}</div>
                    <div className="text-white/50 text-xs">
                      {team.current_bidder ? `$${team.current_bid} — ${team.current_bidder}` : 'No bids'}
                    </div>
                  </div>
                </div>
                <select
                  value={team.round_status}
                  onChange={e => updateStatus(team.id, e.target.value as RoundStatus)}
                  disabled={loading}
                  className="bg-pitch border border-gold/30 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold disabled:opacity-50"
                >
                  {ROUND_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        )}

        {tab === 'bids' && (
          <div>
            <p className="text-white/50 text-sm mb-4">{bids.length} total bids. Delete erroneous bids — the team's top bid will be recalculated automatically.</p>
            <div className="space-y-1">
              {bids.map(bid => (
                <div key={bid.id} className="bg-pitch-light rounded-lg px-4 py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <span className="text-gold font-bold">${bid.amount}</span>
                    <span className="text-white">{bid.bidder_name}</span>
                    <span className="text-white/50 text-sm">{bid.team_name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-white/40 text-xs">{new Date(bid.created_at).toLocaleString()}</span>
                    <button
                      onClick={() => deleteBid(bid.id)}
                      disabled={loading}
                      className="text-red-400 hover:text-red-300 text-sm disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'payouts' && (
          <div>
            <p className="text-white/50 text-sm mb-4">Projected payouts based on current team statuses. Total pool: ${totalPool}</p>
            {(() => {
              const ownerMap: Record<string, { teams: Team[]; payout: number }> = {};
              teams.forEach(t => {
                if (!t.current_bidder) return;
                if (!ownerMap[t.current_bidder]) ownerMap[t.current_bidder] = { teams: [], payout: 0 };
                ownerMap[t.current_bidder].teams.push(t);
                const rate = PAYOUT_RATES[t.round_status] ?? 0;
                const bonus = PAYOUT_BONUSES[t.round_status] ?? 0;
                ownerMap[t.current_bidder].payout += rate * totalPool + bonus;
              });
              const sorted = Object.entries(ownerMap).sort((a, b) => b[1].payout - a[1].payout);
              return (
                <div className="space-y-3">
                  {sorted.map(([name, { teams: ownedTeams, payout }]) => {
                    const spent = ownedTeams.reduce((s, t) => s + (t.current_bid || 0), 0);
                    return (
                      <div key={name} className="bg-pitch-light rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-lg">{name}</span>
                          <div className="text-right">
                            <div className="text-gold font-bold">${payout.toFixed(0)} projected</div>
                            <div className="text-white/50 text-xs">Spent: ${spent} | Net: ${(payout - spent).toFixed(0)}</div>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {ownedTeams.map(t => (
                            <span key={t.id} className="bg-pitch text-white/70 text-xs px-2 py-1 rounded">
                              {t.flag} {t.name} — ${t.current_bid}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
