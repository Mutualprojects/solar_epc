import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabaseAdmin';
import path from 'path';

// Helper to attempt to pre-create buckets (fails gracefully if RLS blocks it)
async function ensureBucketsExist() {
  try {
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    if (listError) {
      console.warn('Could not list storage buckets (likely due to RLS policies):', listError.message);
      return;
    }
    
    const required = ['solar_modules', 'solar_module'];
    for (const name of required) {
      const exists = buckets.some(b => b.name === name);
      if (!exists) {
        const { error: createError } = await supabase.storage.createBucket(name, {
          public: true,
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
          fileSizeLimit: 10485760 // 10MB
        });
        if (createError) {
          console.warn(`Attempted to auto-create bucket '${name}' but was blocked by RLS policies: ${createError.message}. Ensure it is created manually in Supabase Studio.`);
        } else {
          console.log(`Auto-created bucket '${name}' successfully with public access.`);
        }
      }
    }
  } catch (err: any) {
    console.warn('Gracefully ignored exception in ensureBucketsExist:', err.message);
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const schoolId = formData.get('schoolId') as string || 'unknown';
    const section = formData.get('section') as string || 'unknown';

    if (!files || files.length === 0) {
      return NextResponse.json({ success: false, error: 'No files provided' }, { status: 400 });
    }

    // Call pre-creation checklist (fails gracefully if RLS is strict)
    await ensureBucketsExist();

    const fileUrls: string[] = [];

    for (const file of files) {
      if (!file.name) continue;
      
      const buffer = Buffer.from(await file.arrayBuffer());
      const fileExt = path.extname(file.name);
      const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}${fileExt}`;
      
      // Construct exact required path: installations/{schoolId}/{stageName}/fileName
      const storagePath = `installations/${schoolId}/${section}/${uniqueName}`;

      // 1. Try uploading to 'solar_modules' (plural) first as it is the default database bucket
      let uploadResult = await supabase
        .storage
        .from('solar_modules')
        .upload(storagePath, buffer, {
          contentType: file.type || 'image/jpeg',
          cacheControl: '3600',
          upsert: false
        });

      let activeBucket = 'solar_modules';

      // 2. Fallback to 'solar_module' (singular) if plural bucket does not exist
      if (uploadResult.error && (
        uploadResult.error.message.includes('Bucket not found') || 
        uploadResult.error.message.toLowerCase().includes('not found')
      )) {
        console.warn('solar_modules bucket not found, trying fallback singular solar_module bucket...');
        uploadResult = await supabase
          .storage
          .from('solar_module')
          .upload(storagePath, buffer, {
            contentType: file.type || 'image/jpeg',
            cacheControl: '3600',
            upsert: false
          });
        activeBucket = 'solar_module';
      }

      if (uploadResult.error) {
        console.error(`Supabase storage upload error on bucket '${activeBucket}':`, uploadResult.error.message);
        throw new Error(`Failed to upload to storage: ${uploadResult.error.message}`);
      }

      // Retrieve public URL for database insertion
      const { data } = supabase
        .storage
        .from(activeBucket)
        .getPublicUrl(storagePath);

      if (data && data.publicUrl) {
        fileUrls.push(data.publicUrl);
      }
    }

    return NextResponse.json({ success: true, urls: fileUrls }, { status: 200 });
  } catch (error: any) {
    console.error('Upload error:', error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
