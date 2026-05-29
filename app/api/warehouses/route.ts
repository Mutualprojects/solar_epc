import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const getWarehousesTable = () => supabase.schema('roof_top').from('warehouses');

export async function GET(request: Request) {
  try {
    const { data, error } = await getWarehousesTable()
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching warehouses:', error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { warehouse_name, location, phone_number, is_active } = body;

    if (!warehouse_name) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: warehouse_name' },
        { status: 400 }
      );
    }

    const { data, error } = await getWarehousesTable()
      .insert([{
        warehouse_name,
        location,
        phone_number,
        is_active: is_active !== undefined ? is_active : true
      }])
      .select();

    if (error) throw error;

    return NextResponse.json({ success: true, data: data[0] }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating warehouse:', error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, warehouse_name, location, phone_number, is_active } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: id' },
        { status: 400 }
      );
    }

    const { data, error } = await getWarehousesTable()
      .update({
        warehouse_name,
        location,
        phone_number,
        is_active: is_active !== undefined ? is_active : true
      })
      .eq('id', id)
      .select();

    if (error) throw error;

    if (data.length === 0) {
      return NextResponse.json({ success: false, error: 'Warehouse not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: data[0] }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating warehouse:', error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
