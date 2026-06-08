import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { sessionId } = await request.json();
    if (!sessionId) {
      return NextResponse.json({ success: false, error: 'Session ID is required' }, { status: 400 });
    }

    // Get current session
    const { data: session, error: getErr } = await supabase
      .schema('roof_top')
      .from('user_sessions')
      .select('login_time')
      .eq('id', sessionId)
      .single();

    if (getErr || !session) {
      return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 });
    }

    const now = new Date();
    const loginTime = new Date(session.login_time);
    const durationSeconds = Math.max(0, Math.floor((now.getTime() - loginTime.getTime()) / 1000));

    // Update last active time and calculated duration
    const { error: updateErr } = await supabase
      .schema('roof_top')
      .from('user_sessions')
      .update({
        last_active_time: now.toISOString(),
        duration_seconds: durationSeconds
      })
      .eq('id', sessionId);

    if (updateErr) throw updateErr;

    return NextResponse.json({ success: true, durationSeconds });
  } catch (error: any) {
    console.error('Heartbeat error:', error.message || error);
    return NextResponse.json({ success: false, error: error.message || String(error) }, { status: 500 });
  }
}
