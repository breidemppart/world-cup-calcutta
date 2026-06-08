import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

export async function GET() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .order('group_name')
    .order('name');

  if (error) return NextResponse.json({ teams: [] }, { status: 500 });
  return NextResponse.json({ teams: data });
}
