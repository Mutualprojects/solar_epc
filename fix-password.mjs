import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import bcrypt from 'bcryptjs';

const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
for (const k in envConfig) { process.env[k] = envConfig[k]; }

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  { db: { schema: 'roof_top' } }
);

async function fixPassword() {
  const email = 'superadmin@gmail.com';
  const password = 'Superadmin123';
  
  // Create a REAL hash
  const realHash = bcrypt.hashSync(password, 10);
  
  console.log("Real hash:", realHash);
  
  const { data, error } = await supabase.from('users').update({ password: realHash }).eq('email', email).select();
  
  console.log("Update Error:", error);
  console.log("Update Data:", data);
}

fixPassword();
