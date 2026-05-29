import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';


// Helper to access table queries in custom schema
const getMaterialsTable = () => supabase.schema('roof_top').from('materials');
const getMaterialImagesTable = () => supabase.schema('roof_top').from('material_images');

/**
 * GET: Retrieve all materials with their corresponding relational images
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const school_code = searchParams.get('school_code');

    let query = getMaterialsTable().select('*, schools(*), warehouses:warehouse_id(*), material_images(*)');

    if (id) {
      query = query.eq('id', id);
    }
    if (school_code) {
      query = query.eq('school_code', school_code);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching materials:', error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * POST: Create a materials entry and relate it with material_images in a single logical insert
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      school_code, tank, mms, collectors, plumbing, material_images,
      warehouse_id, dc_number, driver_name, driver_phone, vehicle_number, outward_images, remarks 
    } = body;

    // 1. Basic validation
    if (!school_code) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: school_code' },
        { status: 400 }
      );
    }

    // 2. Validate that the school actually exists
    const { data: school, error: schoolCheckError } = await supabase
      .schema('roof_top')
      .from('schools')
      .select('id')
      .eq('id', school_code)
      .maybeSingle();

    if (schoolCheckError) throw schoolCheckError;
    if (!school) {
      return NextResponse.json(
        { success: false, error: `School with code ${school_code} does not exist.` },
        { status: 404 }
      );
    }

    // 3. Insert parent record into materials table
    const { data: materialData, error: materialError } = await getMaterialsTable()
      .insert({
        school_code,
        tank: tank !== undefined ? Number(tank) : 0,
        mms: mms !== undefined ? Number(mms) : 0,
        collectors: collectors !== undefined ? Number(collectors) : 0,
        plumbing: plumbing !== undefined ? Number(plumbing) : 0,
        warehouse_id: warehouse_id || null,
        dc_number: dc_number || null,
        driver_name: driver_name || null,
        driver_phone: driver_phone || null,
        vehicle_number: vehicle_number || null,
        outward_images: outward_images || [],
        remarks: remarks || null
      })
      .select()
      .single();

    if (materialError) throw materialError;

    // 4. Insert child record into material_images if images are provided
    let imageRecord = null;
    const imagesArray = Array.isArray(material_images) ? material_images : [];

    const { data: imgData, error: imageError } = await getMaterialImagesTable()
      .insert({
        school_code,
        material_code: materialData.id,
        material_images: imagesArray
      })
      .select()
      .single();

    if (imageError) {
      // Rollback the inserted material record to maintain transactional integrity
      await getMaterialsTable().delete().eq('id', materialData.id);
      throw imageError;
    }

    imageRecord = imgData;

    return NextResponse.json({
      success: true,
      message: 'Successfully inserted material and associated images',
      data: {
        material: materialData,
        images: imageRecord
      }
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error inserting material:', error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * PATCH: Update outward / dispatch material logs
 */
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { 
      id, school_code, tank, mms, collectors, plumbing, 
      warehouse_id, dc_number, driver_name, driver_phone, vehicle_number, outward_images, remarks 
    } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: id' },
        { status: 400 }
      );
    }

    const updates: any = {};
    if (school_code !== undefined) updates.school_code = school_code;
    if (tank !== undefined) updates.tank = Number(tank);
    if (mms !== undefined) updates.mms = Number(mms);
    if (collectors !== undefined) updates.collectors = Number(collectors);
    if (plumbing !== undefined) updates.plumbing = Number(plumbing);
    if (warehouse_id !== undefined) updates.warehouse_id = warehouse_id || null;
    if (dc_number !== undefined) updates.dc_number = dc_number || null;
    if (driver_name !== undefined) updates.driver_name = driver_name || null;
    if (driver_phone !== undefined) updates.driver_phone = driver_phone || null;
    if (vehicle_number !== undefined) updates.vehicle_number = vehicle_number || null;
    if (outward_images !== undefined) updates.outward_images = outward_images || [];
    if (remarks !== undefined) updates.remarks = remarks || null;

    const { data, error } = await getMaterialsTable()
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating material/outward:', error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
