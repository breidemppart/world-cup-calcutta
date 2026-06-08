import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { BID_CLOSE_TIME, MIN_OPENING_BID } from '@/lib/constants';

export async function POST(req: NextRequest) {
  try {
    const { teamId, bidderName, amount } = await req.json();

    // Server-side time check (protects against client-side manipulation)
    if (Date.now() >= BID_CLOSE_TIME.getTime()) {
      return NextResponse.json({ success: false, error: 'Bidding is closed.' }, { status: 400 });
    }

    if (!teamId || !bidderName?.trim()) {
      return NextResponse.json({ success: false, error: 'Missing required fields.' }, { status: 400 });
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < MIN_OPENING_BID) {
      return NextResponse.json({ success: false, error: `Minimum bid is $${MIN_OPENING_BID}.` }, { status: 400 });
    }

    // Use atomic RPC to prevent race conditions
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.rpc('place_bid', {
      p_team_id: teamId,
      p_bidder_name: bidderName.trim(),
      p_amount: numAmount,
    });

    if (error) {
      console.error('place_bid RPC error:', error);
      return NextResponse.json({ success: false, error: 'Database error. Please try again.' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error('POST /api/bids error:', err);
    return NextResponse.json({ success: false, error: 'Server error.' }, { status: 500 });
  }
}
