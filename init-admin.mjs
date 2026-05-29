import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import bcrypt from 'bcryptjs';

// Load env
const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
for (const k in envConfig) { process.env[k] = envConfig[k]; }

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  { db: { schema: 'roof_top' } }
);

async function initAdmin() {
  console.log('Fetching Super Admin role...');
  let { data: roles, error: roleError } = await supabase.from('roles').select('*').eq('role_name', 'Super Admin');
  
  if (!roles || roles.length === 0) {
    console.log('Roles table is empty! Inserting default roles...');
    const defaultRoles = [
      { role_name: 'Super Admin', description: 'Full access to all modules' },
      { role_name: 'Project Manager', description: 'Handles project coordination' },
      { role_name: 'Warehouse Manager', description: 'Handles stock and dispatch' },
      { role_name: 'Survey Engineer', description: 'Handles site surveys' },
      { role_name: 'Installation Engineer', description: 'Handles installations' },
      { role_name: 'Technician', description: 'Field installation work' },
      { role_name: 'QC Engineer', description: 'Quality checking' },
      { role_name: 'Accounts', description: 'Finance and billing' },
      { role_name: 'Viewer', description: 'Read only access' }
    ];
    await supabase.from('roles').insert(defaultRoles);
    console.log('Inserted default roles.');
    
    // Re-fetch
    const result = await supabase.from('roles').select('*').eq('role_name', 'Super Admin');
    roles = result.data;
  }

  const roleId = roles[0].id;
  const email = 'superadmin@gmail.com';
  const password = 'Superadmin123';
  const hashedPassword = bcrypt.hashSync(password, 10);

  console.log('Inserting super admin user...');
  const { data, error } = await supabase.from('users').insert({
    full_name: 'Super Admin',
    email: email,
    password: hashedPassword,
    role_id: roleId,
    employee_id: 'SA-001',
    designation: 'System Administrator'
  }).select();

  if (error) {
    if (error.code === '23505') {
       console.log('Super Admin already exists.');
       await supabase.from('users').update({ password: hashedPassword }).eq('email', email);
    } else {
       console.error('Error inserting admin:', error);
    }
  } else {
    console.log('✅ Super Admin created successfully!');
  }
}

initAdmin();
