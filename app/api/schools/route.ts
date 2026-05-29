import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';


// Helper to use the custom schema
const getSchoolsTable = () => supabase.schema('roof_top').from('schools');

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const district = searchParams.get('district');
    const school_id = searchParams.get('school_id');
    const id = searchParams.get('id');
    
    let query = getSchoolsTable().select('*');
    
    // Optional filtering
    if (district) {
      query = query.eq('district', district);
    }
    if (school_id) {
      query = query.eq('school_id', school_id);
    }
    if (id) {
      query = query.eq('id', id);
    }
    
    // Order by latest created
    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching schools:', error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // If body is an array, we insert multiple. If it's an object, we insert one.
    const isArray = Array.isArray(body);
    const payload = isArray ? body : [body];

    // Basic validation
    for (const school of payload) {
      if (!school.school_id || !school.district || !school.kgbv_name) {
        return NextResponse.json(
          { success: false, error: 'Missing required fields: school_id, district, or kgbv_name' },
          { status: 400 }
        );
      }
    }

    const { data, error } = await getSchoolsTable()
      .insert(payload)
      .select();

    if (error) {
      // Handle unique constraint violations gracefully
      if (error.code === '23505') {
        return NextResponse.json(
          { success: false, error: 'A school with this school_id already exists.' },
          { status: 409 }
        );
      }
      throw error;
    }

    return NextResponse.json({ success: true, data, message: 'Successfully inserted school(s)' }, { status: 201 });
  } catch (error: any) {
    console.error('Error inserting school:', error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, school_id, ...updates } = body;

    // Require either id or school_id to identify which record to update
    if (!id && !school_id) {
      return NextResponse.json(
        { success: false, error: 'Must provide either id or school_id to update.' },
        { status: 400 }
      );
    }

    let query = getSchoolsTable().update(updates);
    
    // Apply where clause based on provided identifier
    if (id) {
      query = query.eq('id', id);
    } else {
      query = query.eq('school_id', school_id);
    }

    const { data, error } = await query.select();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ success: false, error: 'A school with this school_id already exists.' }, { status: 409 });
      }
      throw error;
    }
    
    if (data.length === 0) {
      return NextResponse.json({ success: false, error: 'School not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data, message: 'Successfully updated school' }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating school:', error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const school_id = searchParams.get('school_id');

    if (!id && !school_id) {
      return NextResponse.json(
        { success: false, error: 'Must provide either id or school_id as query params to delete.' },
        { status: 400 }
      );
    }

    let query = getSchoolsTable().delete();
    
    if (id) {
      query = query.eq('id', id);
    } else {
      query = query.eq('school_id', school_id);
    }

    const { data, error } = await query.select();

    if (error) throw error;
    
    if (data.length === 0) {
      return NextResponse.json({ success: false, error: 'School not found or already deleted.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data, message: 'Successfully deleted school' }, { status: 200 });
  } catch (error: any) {
    console.error('Error deleting school:', error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
