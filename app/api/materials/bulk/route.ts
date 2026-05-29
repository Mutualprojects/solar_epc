import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const getMaterialsTable = () => supabase.schema('roof_top').from('materials');
const getMaterialImagesTable = () => supabase.schema('roof_top').from('material_images');

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rows = Array.isArray(body) ? body : [body];

    if (rows.length === 0) {
      return NextResponse.json({ success: false, error: 'No rows provided' }, { status: 400 });
    }

    // 1. Fetch all schools to map school_id or school_name to id (UUID)
    const { data: schools, error: schoolsError } = await supabase
      .schema('roof_top')
      .from('schools')
      .select('id, school_id, kgbv_name');

    if (schoolsError) throw schoolsError;

    // Create lookup map: school_id or kgbv_name (lowercase, trimmed) -> UUID id
    const schoolMap = new Map<string, string>();
    schools?.forEach((s) => {
      if (s.school_id) {
        schoolMap.set(s.school_id.trim().toLowerCase(), s.id);
      }
      if (s.kgbv_name) {
        schoolMap.set(s.kgbv_name.trim().toLowerCase(), s.id);
      }
    });

    const successes: any[] = [];
    const failures: any[] = [];

    // 2. Process each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 1;
      const schoolIdRaw = row.school_id ? String(row.school_id).trim() : '';
      const schoolUuid = schoolMap.get(schoolIdRaw.toLowerCase());

      if (!schoolIdRaw) {
        failures.push({
          row: rowNum,
          school_id: 'N/A',
          error: 'School ID is empty'
        });
        continue;
      }

      if (!schoolUuid) {
        failures.push({
          row: rowNum,
          school_id: schoolIdRaw,
          error: 'School not found'
        });
        continue;
      }

      const tank = row.tank !== undefined && row.tank !== '' ? Number(row.tank) : 0;
      const mms = row.mms !== undefined && row.mms !== '' ? Number(row.mms) : 0;
      const collectors = row.collectors !== undefined && row.collectors !== '' ? Number(row.collectors) : 0;
      const plumbing = row.plumbing !== undefined && row.plumbing !== '' ? Number(row.plumbing) : 0;

      if (isNaN(tank) || isNaN(mms) || isNaN(collectors) || isNaN(plumbing)) {
        failures.push({
          row: rowNum,
          school_id: schoolIdRaw,
          error: 'Material counts must be numeric values'
        });
        continue;
      }

      // Insert materials and empty material_images
      const { data: materialData, error: materialError } = await getMaterialsTable()
        .insert({
          school_code: schoolUuid,
          tank,
          mms,
          collectors,
          plumbing
        })
        .select()
        .single();

      if (materialError) {
        failures.push({
          row: rowNum,
          school_id: schoolIdRaw,
          error: materialError.message
        });
        continue;
      }

      // Insert matching empty images record
      const { error: imageError } = await getMaterialImagesTable()
        .insert({
          school_code: schoolUuid,
          material_code: materialData.id,
          material_images: []
        });

      if (imageError) {
        // Rollback materials entry to maintain integrity
        await getMaterialsTable().delete().eq('id', materialData.id);
        failures.push({
          row: rowNum,
          school_id: schoolIdRaw,
          error: `Failed to initialize image record: ${imageError.message}`
        });
        continue;
      }

      successes.push({
        row: rowNum,
        school_id: schoolIdRaw,
        material: materialData
      });
    }

    return NextResponse.json({
      success: true,
      insertedCount: successes.length,
      failedCount: failures.length,
      failures
    }, { status: 200 });

  } catch (error: any) {
    console.error('Bulk upload error:', error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
