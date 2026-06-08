'use client';

import { useState, useEffect, useCallback } from 'react';
import { Team, Bid } from '@/lib/types';
import { getSupabaseClient } from '@/lib/supabase-client';
import { BID_CLOSE_TIME } from '@/lib/constants';
import Countdown from './Countdown';
import PrizePoolBanner from './PrizePoolBanner';
import GroupGrid from './GroupGrid';
import BidModal from './BidModal';
import BidHistory from './BidHistory';
import Leaderboard from './Leaderboard';

type Tab = 'teams' | 'leaderboard' | 'history';

interface Props {
  initialTeams: Team[];
  initialBids: Bid[];
}

export default function MainClient({ initialTeams, initialBids }: Props) {
  const [teams, setTeams]           = useState<Team[]>(initialTeams);
  const [bids, setBids]             = useState<Bid[]>(initialBids);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [activeTab, setActiveTab]   = useState<Tab>('teams');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast]           = useState<string | null>(null);

  const supabase = getSupabaseClient();

  const refresh = useCallback(async () => {
    setRefreshing(true);
    const [teamsRes, bidsRes] = await Promise.all([
      supabase.from('teams').select('*').order('group_name').order('name'),
      supabase.from('bids').select('*').order('created_at', { ascending: false }).limit(200),
    ]);
    if (teamsRes.data) setTeams(teamsRes.data);
    if (bidsRes.data)  setBids(bidsRes.data);
    setRefreshing(false);
  }, []);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('calcutta-live')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'teams' }, payload => {
        setTeams(prev => prev.map(t => t.id === payload.new.id ? payload.new as Team : t));
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bids' }, payload => {
        setBids(prev => [payload.new as Bid, ...prev].slice(0, 200));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // Update selectedTeam when teams update (so modal shows fresh data)
  useEffect(() => {
    if (selectedTeam) {
      const updated = teams.find(t => t.id === selectedTeam.id);
      if (updated) setSelectedTeam(updated);
    }
  }, [teams]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }

  const biddingOpen = Date.now() < BID_CLOSE_TIME.getTime();

  const TABS: { id: Tab; label: string }[] = [
    { id: 'teams',      label: '⚽ All Teams' },
    { id: 'leaderboard', label: '🏆 Leaderboard' },
    { id: 'history',    label: '📋 Bid History' },
  ];

  return (
    <div className="min-h-screen bg-[#070b14]">
      {/* ── Header ─────────────────────────────────── */}
      <header className="border-b border-gray-800/60 bg-[#07091300] backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <span className="text-3xl">⚽</span>
            <div>
              <h1 className="text-white font-black text-lg leading-tight tracking-tight">
                World Cup Calcutta
              </h1>
              <div className="text-gray-500 text-xs">
                FIFA World Cup 2026 · {biddingOpen ? 'Bidding Open' : 'Bidding Closed'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Countdown />
            <button
              onClick={refresh}
              disabled={refreshing}
              title="Refresh data"
              className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
            >
              <svg className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-5">
        {/* Prize pool */}
        <PrizePoolBanner teams={teams} />

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1 w-fit">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-white/10 text-white'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search (teams tab only) */}
        {activeTab === 'teams' && (
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search teams or owners…"
              className="w-full sm:w-72 bg-gray-900 border border-gray-800 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-gray-600"
            />
          </div>
        )}

        {/* Tab content */}
        {activeTab === 'teams' && (
          <GroupGrid teams={teams} onBid={setSelectedTeam} searchQuery={searchQuery} />
        )}
        {activeTab === 'leaderboard' && (
          <Leaderboard teams={teams} />
        )}
        {activeTab === 'history' && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="text-white font-bold mb-4">All Bids — Most Recent First</h2>
            <BidHistory bids={bids} />
          </div>
        )}
      </main>

      {/* Bid modal */}
      <BidModal
        team={selectedTeam}
        onClose={() => setSelectedTeam(null)}
        onSuccess={() => showToast(`Bid placed! Refreshing…`)}
      />

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-green-700 text-white px-5 py-3 rounded-xl shadow-xl text-sm font-semibold animate-fade-in z-50">
          ✅ {toast}
        </div>
      )}
    </div>
  );
}
