import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  try {
    const { password, bidId, teamId } = await req.json();

    if (password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();

    // Delete the bid
    const { error: delError } = await supabase.from('bids').delete().eq('id', bidId);
    if (delError) return NextResponse.json({ success: false, error: delError.message }, { status: 500 });

    // Recalculate the team's current winning bid
    const { data: topBid } = await supabase
      .from('bids')
      .select('amount, bidder_name')
      .eq('team_id', teamId)
      .order('amount', { ascending: false })
      .limit(1)
      .single();

    await supabase
      .from('teams')
      .update({
        current_bid:   topBid?.amount   ?? 0,
        current_owner: topBid?.bidder_name ?? null,
      })
      .eq('id', teamId);

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Server error.' }, { status: 500 });
  }
}
