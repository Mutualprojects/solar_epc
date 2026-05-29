import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const getRolesTable = () => supabase.schema('roof_top').from('roles');

export async function GET() {
  try {
    // Fetch all active roles, ordered alphabetically
    const { data, error } = await getRolesTable()
      .select('*')
      .eq('is_active', true)
      .order('role_name', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching roles:', error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
