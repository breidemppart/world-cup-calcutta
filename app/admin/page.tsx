'use client';
import { useState, useEffect } from 'react';
import { Team, Bid, PAYOUT_RATES, PAYOUT_BONUSES, ROUND_LABELS } from '@/lib/types';
import { getSupabaseClient } from '@/lib/supabase-client';

const ROUND_OPTIONS = [
  { value: 'active',           label: '✅ Active (in tournament)' },
  { value: 'group_eliminated', label: '❌ Eliminated – Group Stage' },
  { value: 'r32_eliminated',   label: '❌ Eliminated – Round of 32' },
  { value: 'r16_eliminated',   label: '❌ Eliminated – Round of 16' },
  { value: 'qf_eliminated',    label: '⚡ Quarterfinalist (5%)' },
  { value: 'sf_eliminated',    label: '🎯 Semifinalist (10%)' },
  { value: 'runner_up',        label: '🥈 Runner-Up (20% + $50)' },
  { value: 'champion',         label: '🏆 Champion (40% + $100)' },
];

export default function AdminPage() {
  const [password, setPassword]         = useState('');
  const [authed, setAuthed]             = useState(false);
  const [authError, setAuthError]       = useState('');
  const [teams, setTeams]               = useState<Team[]>([]);
  const [bids, setBids]                 = useState<Bid[]>([]);
  const [loading, setLoading]           = useState(false);
  const [msg, setMsg]                   = useState('');
  const [activeTab, setActiveTab]       = useState<'teams' | 'bids' | 'payouts' | 'earnings'>('teams');
  const [filterTeam, setFilterTeam]     = useState('');
  const [pendingStatuses, setPendingStatuses] = useState<Record<number, string>>({});

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/admin/update-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, teamId: 0, status: 'active' }),
    });
    if (res.status === 401) { setAuthError('Wrong password.'); return; }
    setAuthed(true);
  }

  useEffect(() => {
    if (!authed) return;
    fetchPublicData();

    const supabase = getSupabaseClient();
    const channel = supabase
      .channel('admin-live')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'teams' }, payload => {
        setTeams(prev => prev.map(t => t.id === payload.new.id ? { ...t, ...payload.new as Team } : t));
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

  async function fetchPublicData() {
    setLoading(true);
    try {
      const [tr, br] = await Promise.all([
        fetch('/api/teams').then(r => r.json()),
        fetch('/api/bids-list').then(r => r.json()),
      ]);
      setTeams(Array.isArray(tr) ? tr : (tr.teams ?? []));
      setBids(Array.isArray(br) ? br : (br.bids ?? []));
    } finally {
      setLoading(false);
    }
  }

  async function saveStatus(teamId: number, status: string) {
    setLoading(true);
    const res = await fetch('/api/admin/update-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, teamId, status }),
    });
    const data = await res.json();
    if (data.success) {
      setTeams(prev => prev.map(t => t.id === teamId ? { ...t, round_status: status as Team['round_status'] } : t));
      setPendingStatuses(prev => { const n = { ...prev }; delete n[teamId]; return n; });
      flash('✅ Status saved');
    } else {
      flash('❌ ' + (data.error ?? 'Failed to save'));
    }
    setLoading(false);
  }

  async function deleteBid(bid: Bid) {
    if (!confirm(`Delete bid of $${bid.amount} by ${bid.bidder_name} on ${bid.team_name}?`)) return;
    setLoading(true);
    const res = await fetch('/api/admin/delete-bid', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, bidId: bid.id, teamId: bid.team_id }),
    });
    const data = await res.json();
    if (data.success) {
      setBids(prev => prev.filter(b => b.id !== bid.id));
      setTeams(prev => prev.map(t => {
        if (t.id !== bid.team_id) return t;
        const remaining = bids.filter(b => b.id !== bid.id && b.team_id === bid.team_id);
        const top = remaining.sort((a, b) => b.amount - a.amount)[0];
        return { ...t, current_bid: top?.amount ?? 0, current_owner: top?.bidder_name ?? null };
      }));
      flash('✅ Bid deleted');
    } else {
      flash('❌ ' + (data.error ?? 'Failed to delete'));
    }
    setLoading(false);
  }

  function flash(m: string) {
    setMsg(m);
    setTimeout(() => setMsg(''), 3000);
  }

  const totalPool = teams.reduce((s, t) => s + (t.current_bid || 0), 0);

  const payouts = teams
    .filter(t => PAYOUT_RATES[t.round_status] !== undefined && t.current_owner)
    .map(t => ({
      team: t,
      owner: t.current_owner!,
      pct: (PAYOUT_RATES[t.round_status]! * 100).toFixed(0),
      amount: PAYOUT_RATES[t.round_status]! * totalPool + (PAYOUT_BONUSES[t.round_status] ?? 0),
    }));

  const earningsMap = new Map<string, { spent: number; earned: number; teams: { name: string; flag: string; bid: number; payout: number }[] }>();
  for (const team of teams) {
    if (!team.current_owner) continue;
    if (!earningsMap.has(team.current_owner)) earningsMap.set(team.current_owner, { spent: 0, earned: 0, teams: [] });
    const entry = earningsMap.get(team.current_owner)!;
    const payout = (PAYOUT_RATES[team.round_status] ?? 0) * totalPool + (PAYOUT_BONUSES[team.round_status] ?? 0);
    entry.spent += team.current_bid || 0;
    entry.earned += payout;
    entry.teams.push({ name: team.name, flag: team.flag_emoji, bid: team.current_bid || 0, payout });
  }
  const earningsList = Array.from(earningsMap.entries())
    .map(([name, d]) => ({ name, ...d, net: d.earned - d.spent }))
    .sort((a, b) => b.net - a.net);

  if (!authed) {
    return (
      <div className="min-h-screen bg-[#070b14] flex items-center justify-center p-4">
        <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 w-full max-w-sm">
          <div className="text-center mb-6">
            <div className="text-4xl mb-2">🔐</div>
            <h1 className="text-white font-black text-xl">Admin Panel</h1>
            <div className="text-gray-500 text-sm">World Cup Calcutta 2026</div>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Admin password"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500"
              autoFocus
            />
            {authError && <div className="text-red-400 text-sm text-center">{authError}</div>}
            <button type="submit" className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl">
              Enter Admin Panel
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b14] text-white">
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="font-black text-xl">⚙️ Admin Panel</h1>
          <div className="text-gray-500 text-sm">World Cup Calcutta 2026</div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchPublicData} className="text-sm bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-lg">
            {loading ? '⟳ Loading…' : '↻ Refresh'}
          </button>
          <a href="/" className="text-sm text-gray-400 hover:text-white">← Back to site</a>
        </div>
      </header>

      {msg && (
        <div className="mx-6 mt-4 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm">{msg}</div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 px-6 py-4">
        {[
          { label: 'Total Pool',  val: `$${totalPool.toFixed(2)}` },
          { label: 'Bids Placed', val: bids.length },
          { label: 'Teams Owned', val: teams.filter(t => t.current_bid > 0).length },
          { label: 'Players',     val: earningsList.length },
        ].map(s => (
          <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
            <div className="text-gray-500 text-xs uppercase tracking-wider">{s.label}</div>
            <div className="text-white font-black text-2xl mt-1">{s.val}</div>
          </div>
        ))}
      </div>

      <div className="px-6">
        <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1 w-fit mb-4 flex-wrap">
          {(['teams', 'bids', 'payouts', 'earnings'] as const).map(t => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${
                activeTab === t ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {t === 'teams' ? '⚽ Teams' : t === 'bids' ? '📋 Bids' : t === 'payouts' ? '💰 Payouts' : '🏅 Earnings'}
            </button>
          ))}
        </div>

        {activeTab === 'teams' && (
          <div className="space-y-2 pb-12">
            <p className="text-gray-500 text-sm mb-3">Change the dropdown then click <strong>Save</strong> to commit.</p>
            {['A','B','C','D','E','F','G','H','I','J','K','L'].map(group => (
              <div key={group} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <div className="px-4 py-2 bg-gray-800/50 text-xs font-bold uppercase tracking-wider text-gray-400">
                  Group {group}
                </div>
                <div className="divide-y divide-gray-800">
                  {teams.filter(t => t.group_name === group).map(team => (
                    <div key={team.id} className="flex items-center gap-3 px-4 py-3 flex-wrap">
                      <span className="text-xl">{team.flag_emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm">{team.name}</div>
                        {team.current_owner && (
                          <div className="text-gray-500 text-xs">${team.current_bid.toFixed(2)} — {team.current_owner}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={pendingStatuses[team.id] ?? team.round_status}
                          onChange={e => setPendingStatuses(prev => ({ ...prev, [team.id]: e.target.value }))}
                          className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
                        >
                          {ROUND_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                        {pendingStatuses[team.id] && pendingStatuses[team.id] !== team.round_status && (
                          <button
                            onClick={() => saveStatus(team.id, pendingStatuses[team.id])}
                            disabled={loading}
                            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg disabled:opacity-50 whitespace-nowrap"
                          >
                            Save
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'bids' && (
          <div className="pb-12">
            <div className="flex items-center gap-3 mb-3">
              <input
                type="text"
                value={filterTeam}
                onChange={e => setFilterTeam(e.target.value)}
                placeholder="Filter by team or bidder…"
                className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-gray-600 w-64"
              />
              <span className="text-gray-600 text-sm">{bids.length} total bids</span>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 text-xs uppercase tracking-wider border-b border-gray-800">
                    <th className="px-4 py-3">Team</th>
                    <th className="px-4 py-3">Bidder</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Time</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {bids
                    .filter(b => !filterTeam ||
                      b.team_name.toLowerCase().includes(filterTeam.toLowerCase()) ||
                      b.bidder_name.toLowerCase().includes(filterTeam.toLowerCase()))
                    .map(bid => (
                      <tr key={bid.id} className="hover:bg-gray-800/30">
                        <td className="px-4 py-2 text-gray-300">{bid.team_name}</td>
                        <td className="px-4 py-2 text-white font-medium">{bid.bidder_name}</td>
                        <td className="px-4 py-2 text-yellow-400 font-bold">${bid.amount.toFixed(2)}</td>
                        <td className="px-4 py-2 text-gray-500 text-xs whitespace-nowrap">
                          {new Date(bid.created_at).toLocaleString()}
                        </td>
                        <td className="px-4 py-2">
                          <button
                            onClick={() => deleteBid(bid)}
                            className="text-red-500 hover:text-red-400 text-xs px-2 py-1 rounded border border-red-800 hover:border-red-600"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'payouts' && (
          <div className="pb-12 space-y-4">
            <div className="bg-yellow-900/20 border border-yellow-800/30 rounded-xl p-4">
              <div className="text-yellow-500/70 text-xs uppercase tracking-wider mb-1">Total Prize Pool</div>
              <div className="text-yellow-400 font-black text-3xl">${totalPool.toFixed(2)}</div>
              <div className="text-gray-500 text-xs mt-1">Champion gets 40% + $100 · Runner-Up gets 20% + $50</div>
            </div>
            {payouts.length === 0 ? (
              <div className="text-gray-600 text-center py-8">No teams have reached a payout-eligible round yet.</div>
            ) : (
              <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 text-xs uppercase tracking-wider border-b border-gray-800">
                      <th className="px-4 py-3">Team</th>
                      <th className="px-4 py-3">Owner</th>
                      <th className="px-4 py-3">Round</th>
                      <th className="px-4 py-3">Pool %</th>
                      <th className="px-4 py-3 text-right">Payout</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {payouts.sort((a, b) => b.amount - a.amount).map(p => (
                      <tr key={p.team.id} className="hover:bg-gray-800/30">
                        <td className="px-4 py-3">
                          <span className="mr-2">{p.team.flag_emoji}</span>
                          <span className="font-medium">{p.team.name}</span>
                        </td>
                        <td className="px-4 py-3 text-white font-semibold">{p.owner}</td>
                        <td className="px-4 py-3 text-gray-400">{ROUND_LABELS?.[p.team.round_status] ?? p.team.round_status}</td>
                        <td className="px-4 py-3 text-gray-300">{p.pct}%</td>
                        <td className="px-4 py-3 text-green-400 font-bold text-right">${p.amount.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'earnings' && (
          <div className="pb-12 space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Prize Pool',      val: `$${totalPool.toFixed(2)}`,                                 color: 'text-white' },
                { label: 'Paid Out',        val: `$${earningsList.reduce((s,p)=>s+p.earned,0).toFixed(2)}`,  color: 'text-green-400' },
                { label: 'Players',         val: String(earningsList.length),                                 color: 'text-white' },
              ].map(s => (
                <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
                  <div className="text-gray-500 text-xs uppercase tracking-wider">{s.label}</div>
                  <div className={`${s.color} font-black text-xl mt-1`}>{s.val}</div>
                </div>
              ))}
            </div>
            {earningsList.map((person, i) => (
              <div key={person.name} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
                  <div className="flex items-center gap-3">
                    <span className="text-gray-600 font-bold text-sm">#{i + 1}</span>
                    <span className="font-black text-lg">{person.name}</span>
                  </div>
                  <div className="flex items-center gap-4 sm:gap-6 text-right">
                    <div>
                      <div className="text-gray-500 text-xs">Spent</div>
                      <div className="text-red-400 font-bold">-${person.spent.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-xs">Earned</div>
                      <div className="text-green-400 font-bold">+${person.earned.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-xs">Net</div>
                      <div className={`font-black text-lg ${person.net >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {person.net >= 0 ? '+' : ''}${person.net.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="divide-y divide-gray-800/50">
                  {person.teams.map(t => (
                    <div key={t.name} className="flex items-center justify-between px-5 py-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-300">
                        <span>{t.flag}</span>
                        <span>{t.name}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs">
                        <span className="text-gray-500">bid ${t.bid.toFixed(2)}</span>
                        <span className={t.payout > 0 ? 'text-green-400 font-semibold' : 'text-gray-600'}>
                          {t.payout > 0 ? `earns $${t.payout.toFixed(2)}` : 'eliminated'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
