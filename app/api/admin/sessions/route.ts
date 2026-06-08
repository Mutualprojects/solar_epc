import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { data: sessions, error } = await supabase
      .schema('roof_top')
      .from('user_sessions')
      .select('*, users(full_name, email, roles(role_name))')
      .order('last_active_time', { ascending: false })
      .limit(30);

    if (error) throw error;

    return NextResponse.json({ success: true, data: sessions });
  } catch (error: any) {
    console.error('Error fetching sessions:', error.message || error);
    return NextResponse.json({ success: false, error: error.message || String(error) }, { status: 500 });
  }
}
