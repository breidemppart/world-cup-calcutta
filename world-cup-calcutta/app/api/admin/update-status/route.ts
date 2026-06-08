import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

const VALID_STATUSES = [
  'active','group_eliminated','r32_eliminated','r16_eliminated',
  'qf_eliminated','sf_eliminated','runner_up','champion',
] as const;

export async function POST(req: NextRequest) {
  try {
    const { password, teamId, status } = await req.json();

    if (password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ success: false, error: 'Invalid status.' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from('teams')
      .update({ round_status: status })
      .eq('id', teamId);

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Server error.' }, { status: 500 });
  }
}
