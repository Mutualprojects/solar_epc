import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';
import { getTokenFromRequest, verifyToken } from '@/lib/jwt';

const getUsersTable = () => supabase.schema('roof_top').from('users');

export async function GET(request: Request) {
  try {
    const token = getTokenFromRequest(request);
    const decoded = verifyToken(token || '');
    if (!decoded) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const role_id = searchParams.get('role_id');
    const email = searchParams.get('email');
    
    let query = getUsersTable().select('*, roles (role_name)');
    
    if (id) query = query.eq('id', id);
    if (role_id) query = query.eq('role_id', role_id);
    if (email) query = query.eq('email', email);
    
    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    
    // Remove passwords from response
    const safeData = data.map(u => {
      const { password, ...rest } = u;
      return rest;
    });

    return NextResponse.json({ success: true, data: safeData }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching users:', error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const token = getTokenFromRequest(request);
    const decoded: any = verifyToken(token || '');
    if (!decoded || decoded.role !== 'Super Admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized. Only Super Admin can create users.' }, { status: 401 });
    }

    const body = await request.json();
    const plainPassword = body.password || 'Welcome123';
    const hashedPassword = await bcrypt.hash(plainPassword, 10);
    
    const newUser = {
      ...body,
      password: hashedPassword
    };

    const { data, error } = await getUsersTable()
      .insert(newUser)
      .select();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ success: false, error: 'User with this email or employee_id already exists.' }, { status: 409 });
      }
      throw error;
    }

    return NextResponse.json({ success: true, data, message: 'Successfully created user' }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating user:', error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const token = getTokenFromRequest(request);
    const decoded: any = verifyToken(token || '');
    if (!decoded) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { full_name, phone, designation, district, profile_photo, password, employee_id, email, is_active } = body;

    const updates: any = {};
    if (full_name !== undefined) updates.full_name = full_name;
    if (phone !== undefined) updates.phone = phone;
    if (designation !== undefined) updates.designation = designation;
    if (district !== undefined) updates.district = district;
    if (profile_photo !== undefined) updates.profile_photo = profile_photo;
    if (employee_id !== undefined) updates.employee_id = employee_id;
    if (email !== undefined) updates.email = email;
    if (is_active !== undefined) updates.is_active = is_active;

    if (password) {
      updates.password = await bcrypt.hash(password, 10);
    }

    const { data, error } = await getUsersTable()
      .update(updates)
      .eq('id', decoded.userId)
      .select('*, roles(role_name)');

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ success: false, error: 'User with this email or employee_id already exists.' }, { status: 409 });
      }
      throw error;
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const { password: _, ...safeUser } = data[0];

    return NextResponse.json({ success: true, data: safeUser, message: 'Successfully updated profile' }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating user profile:', error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
