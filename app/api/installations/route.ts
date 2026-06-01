import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';


// Helper to use the custom schema
const getInstallationsTable = () => supabase.schema('roof_top').from('school_installation');

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const school_id = searchParams.get('school_id');
    const overall_status = searchParams.get('overall_status');
    const search = searchParams.get('search');
    
    // 1. Fetch all schools in custom schema
    const { data: allSchools, error: schoolsError } = await supabase
      .schema('roof_top')
      .from('schools')
      .select('*')
      .order('kgbv_name', { ascending: true });

    if (schoolsError) throw schoolsError;

    // 2. Fetch all materials
    const { data: allMaterials, error: materialsError } = await supabase
      .schema('roof_top')
      .from('materials')
      .select('*');

    if (materialsError) throw materialsError;

    // 3. Fetch real installation records
    const { data: realInstallations, error: instError } = await supabase
      .schema('roof_top')
      .from('school_installation')
      .select('*');

    if (instError) throw instError;

    // 4. Merge all schools into installations list
    const installationsList = (allSchools || []).map((school: any) => {
      // Find real installation
      const realInst = realInstallations?.find((inst: any) => inst.school_id === school.id);
      
      // Find matching material
      const matchingMat = allMaterials?.find((mat: any) => mat.school_code === school.id);
      
      const nestedSchool = {
        id: school.id,
        school_id: school.school_id,
        kgbv_name: school.kgbv_name,
        district: school.district,
        pincode: school.pin_code,
        principal_name: school.principal_name,
        contact_number: school.contact_number,
        address: school.address,
        no_of_systems: school.no_of_systems
      };

      const nestedMaterial = matchingMat ? {
        id: matchingMat.id,
        material_code: matchingMat.id.substring(0, 8).toUpperCase(),
        capacity: matchingMat.capacity || `${matchingMat.tank || 0}L / ${matchingMat.mms || 0}kW`,
        invoice_no: matchingMat.invoice_no || "INV-DISPATCHED",
        invoice_date: matchingMat.invoice_date || matchingMat.created_at,
        tank: matchingMat.tank || 0,
        mms: matchingMat.mms || 0,
        collectors: matchingMat.collectors || 0,
        plumbing: matchingMat.plumbing || 0
      } : {
        id: "",
        material_code: "NOT DISPATCHED",
        capacity: "N/A",
        invoice_no: "N/A",
        invoice_date: null,
        tank: 0,
        mms: 0,
        collectors: 0,
        plumbing: 0
      };

      if (realInst) {
        const matchingInstMaterial = allMaterials?.find((m: any) => m.id === realInst.material_id);
        const finalMaterial = matchingInstMaterial ? {
          id: realInst.material_id,
          material_code: matchingInstMaterial.id.substring(0, 8).toUpperCase(),
          capacity: matchingInstMaterial.capacity || `${matchingInstMaterial.tank || 0}L / ${matchingInstMaterial.mms || 0}kW`,
          invoice_no: matchingInstMaterial.invoice_no || "INV-DISPATCHED",
          invoice_date: matchingInstMaterial.invoice_date,
          tank: matchingInstMaterial.tank || 0,
          mms: matchingInstMaterial.mms || 0,
          collectors: matchingInstMaterial.collectors || 0,
          plumbing: matchingInstMaterial.plumbing || 0
        } : nestedMaterial;

        return {
          ...realInst,
          schools: nestedSchool,
          materials: finalMaterial
        };
      }

      // Generate virtual installation
      return {
        id: `virtual_inst_${school.id}`,
        created_at: school.created_at || new Date().toISOString(),
        school_id: school.id,
        material_id: matchingMat?.id || null,
        installation_code: `INST-PENDING-${school.school_id || school.id.substring(0, 8)}`,
        started_at: null,
        completed_at: null,
        tank_status: 'Pending',
        tank_percentage: 0,
        tank_remarks: '',
        tank_images: [],
        tank_updated_at: null,
        mms_status: 'Pending',
        mms_percentage: 0,
        mms_remarks: '',
        mms_images: [],
        mms_updated_at: null,
        collectors_status: 'Pending',
        collectors_percentage: 0,
        collectors_remarks: '',
        collectors_images: [],
        collectors_updated_at: null,
        plumbing_status: 'Pending',
        plumbing_percentage: 0,
        plumbing_remarks: '',
        plumbing_images: [],
        plumbing_updated_at: null,
        overall_percentage: 0,
        overall_status: 'Pending',
        remarks: 'Auto-initialized pending record',
        completion_certificate: null,
        is_virtual: true,
        schools: nestedSchool,
        materials: nestedMaterial
      };
    });

    // 5. Apply filters
    let filteredData = installationsList;

    if (id) {
      filteredData = filteredData.filter((item: any) => item.id === id);
    }
    if (school_id) {
      filteredData = filteredData.filter((item: any) => item.school_id === school_id);
    }
    if (overall_status) {
      filteredData = filteredData.filter((item: any) => item.overall_status?.toLowerCase() === overall_status.toLowerCase());
    }
    if (search) {
      const term = search.toLowerCase();
      filteredData = filteredData.filter((item: any) => {
        const codeMatch = item.installation_code?.toLowerCase().includes(term);
        const schoolMatch = item.schools?.kgbv_name?.toLowerCase().includes(term);
        const districtMatch = item.schools?.district?.toLowerCase().includes(term);
        const materialMatch = item.materials?.material_code?.toLowerCase().includes(term);
        return codeMatch || schoolMatch || districtMatch || materialMatch;
      });
    }

    return NextResponse.json({ success: true, data: filteredData }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching installations:', error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Basic validation
    if (!body.school_id || !body.material_id || !body.installation_code) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: school_id, material_id, or installation_code' },
        { status: 400 }
      );
    }

    const { data, error } = await getInstallationsTable()
      .insert([body])
      .select();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { success: false, error: 'An installation with this code already exists.' },
          { status: 409 }
        );
      }
      throw error;
    }

    return NextResponse.json({ success: true, data: data?.[0], message: 'Successfully created installation record' }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating installation:', error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Must provide installation record id to update.' },
        { status: 400 }
      );
    }

    const allowedKeys = [
      'school_id',
      'material_id',
      'installation_code',
      'started_at',
      'completed_at',
      'tank_status',
      'tank_percentage',
      'tank_remarks',
      'tank_images',
      'tank_updated_at',
      'mms_status',
      'mms_percentage',
      'mms_remarks',
      'mms_images',
      'mms_updated_at',
      'collectors_status',
      'collectors_percentage',
      'collectors_remarks',
      'collectors_images',
      'collectors_updated_at',
      'plumbing_status',
      'plumbing_percentage',
      'plumbing_remarks',
      'plumbing_images',
      'plumbing_updated_at',
      'overall_percentage',
      'overall_status',
      'remarks',
      'completion_certificate'
    ];

    const cleanUpdates: any = {};
    for (const key of allowedKeys) {
      if (updates[key] !== undefined) {
        cleanUpdates[key] = updates[key];
      }
    }

    // Otherwise standard update on real installation record
    // Ensure all JSON arrays are properly formatted array objects before writing to jsonb column
    const formatJsonField = (field: any) => {
      if (Array.isArray(field)) return field;
      if (typeof field === 'string') {
        try {
          const parsed = JSON.parse(field);
          if (Array.isArray(parsed)) return parsed;
        } catch (_) {}
      }
      return [];
    };

    if (cleanUpdates.tank_images !== undefined) cleanUpdates.tank_images = formatJsonField(cleanUpdates.tank_images);
    if (cleanUpdates.mms_images !== undefined) cleanUpdates.mms_images = formatJsonField(cleanUpdates.mms_images);
    if (cleanUpdates.collectors_images !== undefined) cleanUpdates.collectors_images = formatJsonField(cleanUpdates.collectors_images);
    if (cleanUpdates.plumbing_images !== undefined) cleanUpdates.plumbing_images = formatJsonField(cleanUpdates.plumbing_images);

    // Auto-create real database entry if row is virtual
    if (id.startsWith('virtual_inst_')) {
      const realSchoolId = id.replace('virtual_inst_', '');
      
      // Look up material ID if not explicitly specified
      let finalMaterialId = cleanUpdates.material_id || null;
      if (!finalMaterialId) {
        const { data: matchedMat } = await supabase
          .schema('roof_top')
          .from('materials')
          .select('id')
          .eq('school_code', realSchoolId)
          .maybeSingle();
        if (matchedMat) {
          finalMaterialId = matchedMat.id;
        }
      }

      // Default backup material ID if none found
      if (!finalMaterialId) {
        const { data: firstMat } = await supabase
          .schema('roof_top')
          .from('materials')
          .select('id')
          .limit(1);
        if (firstMat && firstMat.length > 0) {
          finalMaterialId = firstMat[0].id;
        }
      }

      // If still no material exists in database, return 400
      if (!finalMaterialId) {
        return NextResponse.json(
          { success: false, error: 'Please enter dispatch items in Inventory before starting installations.' },
          { status: 400 }
        );
      }

      const insertPayload = {
        school_id: realSchoolId,
        material_id: finalMaterialId,
        installation_code: `INST-${realSchoolId.substring(0, 8).toUpperCase()}`,
        
        tank_status: cleanUpdates.tank_status || 'Pending',
        tank_percentage: cleanUpdates.tank_percentage || 0,
        tank_remarks: cleanUpdates.tank_remarks || '',
        tank_images: cleanUpdates.tank_images || [],
        tank_updated_at: new Date().toISOString(),
        
        mms_status: cleanUpdates.mms_status || 'Pending',
        mms_percentage: cleanUpdates.mms_percentage || 0,
        mms_remarks: cleanUpdates.mms_remarks || '',
        mms_images: cleanUpdates.mms_images || [],
        mms_updated_at: new Date().toISOString(),

        collectors_status: cleanUpdates.collectors_status || 'Pending',
        collectors_percentage: cleanUpdates.collectors_percentage || 0,
        collectors_remarks: cleanUpdates.collectors_remarks || '',
        collectors_images: cleanUpdates.collectors_images || [],
        collectors_updated_at: new Date().toISOString(),

        plumbing_status: cleanUpdates.plumbing_status || 'Pending',
        plumbing_percentage: cleanUpdates.plumbing_percentage || 0,
        plumbing_remarks: cleanUpdates.plumbing_remarks || '',
        plumbing_images: cleanUpdates.plumbing_images || [],
        plumbing_updated_at: new Date().toISOString(),

        overall_percentage: cleanUpdates.overall_percentage || 0,
        overall_status: cleanUpdates.overall_status || 'Pending',
        remarks: cleanUpdates.remarks || 'Activated from Pending dashboard',
        started_at: cleanUpdates.overall_percentage > 0 ? new Date().toISOString() : null,
        completed_at: cleanUpdates.overall_percentage === 100 ? new Date().toISOString() : null,
        completion_certificate: cleanUpdates.completion_certificate || null
      };

      const { data, error } = await getInstallationsTable()
        .insert([insertPayload])
        .select();

      if (error) {
        console.error('Error inserting virtual installation:', error.message);
        throw error;
      }
      return NextResponse.json({ success: true, data: data[0], message: 'Initialized and saved real installation record successfully' }, { status: 200 });
    }

    const { data, error } = await getInstallationsTable()
      .update(cleanUpdates)
      .eq('id', id)
      .select();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { success: false, error: 'Unique constraint violation occurred.' },
          { status: 409 }
        );
      }
      throw error;
    }
    
    if (!data || data.length === 0) {
      return NextResponse.json({ success: false, error: 'Installation record not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: data[0], message: 'Successfully updated installation record' }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating installation:', error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
