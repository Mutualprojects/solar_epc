import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const getMaterialInwardTable = () => supabase.schema('roof_top').from('material_inward');

export async function GET(request: Request) {
  try {
    // Select material inward entries and join with warehouse details if available
    const { data, error } = await getMaterialInwardTable()
      .select('*, warehouses:warehouse_id ( warehouse_name )')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching material inward logs:', error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { warehouse_id, vendor_name, remarks, invoice_id, inward_images } = body;

    if (!warehouse_id) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: warehouse_id' },
        { status: 400 }
      );
    }

    // Default invoice_id if not provided, constraint is not null
    const generatedInvoiceId = invoice_id || `INV-${Math.floor(1000 + Math.random() * 9000)}-${Date.now().toString().slice(-4)}`;

    const { data, error } = await getMaterialInwardTable()
      .insert([{
        warehouse_id,
        invoice_id: generatedInvoiceId,
        vendor_name: vendor_name || '',
        remarks: remarks || '',
        inward_images: inward_images || []
      }])
      .select();

    if (error) throw error;

    return NextResponse.json({ success: true, data: data[0] }, { status: 201 });
  } catch (error: any) {
    console.error('Error inserting inward material log:', error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, warehouse_id, invoice_id, vendor_name, remarks, inward_images } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: id' },
        { status: 400 }
      );
    }

    const updates: any = {};
    if (warehouse_id !== undefined) updates.warehouse_id = warehouse_id;
    if (invoice_id !== undefined) updates.invoice_id = invoice_id;
    if (vendor_name !== undefined) updates.vendor_name = vendor_name;
    if (remarks !== undefined) updates.remarks = remarks;
    if (inward_images !== undefined) updates.inward_images = inward_images;

    const { data, error } = await getMaterialInwardTable()
      .update(updates)
      .eq('id', id)
      .select();

    if (error) throw error;

    if (data.length === 0) {
      return NextResponse.json({ success: false, error: 'Inward record not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: data[0] }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating inward material log:', error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
