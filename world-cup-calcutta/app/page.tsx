import { getSupabaseAdmin } from '@/lib/supabase-server';
import MainClient from '@/components/MainClient';
import type { Team, Bid } from '@/lib/types';

export const revalidate = 0; // always fresh on server render

export default async function Home() {
  const supabase = getSupabaseAdmin();

  const [teamsRes, bidsRes] = await Promise.all([
    supabase.from('teams').select('*').order('group_name').order('name'),
    supabase.from('bids').select('*').order('created_at', { ascending: false }).limit(200),
  ]);

  const teams: Team[] = teamsRes.data ?? [];
  const bids: Bid[]   = bidsRes.data  ?? [];

  return <MainClient initialTeams={teams} initialBids={bids} />;
}
