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
  const [password, setPassword]     = useState('');
  const [authed, setAuthed]         = useState(false);
  const [authError, setAuthError]   = useState('');
  const [teams, setTeams]           = useState<Team[]>([]);
  const [bids, setBids]             = useState<Bid[]>([]);
  const [loading, setLoading]       = useState(false);
  const [msg, setMsg]               = useState('');
  const [activeTab, setActiveTab]   = useState<'teams' | 'bids' | 'payouts'>('teams');
  const [filterTeam, setFilterTeam] = useState('');

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

  async function fetchPublicData() {
    setLoading(true);
    try {
      const [tr, br] = await Promise.all([
        fetch('/api/teams').then(r => r.json()),
        fetch('/api/bids-list').then(r => r.json()),
      ]);
      if (tr.teams) setTeams(tr.teams);
      if (br.bids)  setBids(br.bids);
    } finally {
      setLoading(false);
    }
  }

  async function
