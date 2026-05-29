import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';
import { signToken } from '@/lib/jwt';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ success: false, error: 'Email and password are required' }, { status: 400 });
    }

    // Find the user
    const { data: users, error } = await supabase
      .schema('roof_top')
      .from('users')
      .select('*, roles(role_name)')
      .eq('email', email)
      .limit(1);

    if (error) throw error;
    
    const user = users && users.length > 0 ? users[0] : null;

    if (!user) {
      return NextResponse.json({ success: false, error: 'Invalid email or password' }, { status: 401 });
    }

    if (!user.is_active) {
      return NextResponse.json({ success: false, error: 'Account is inactive. Please contact admin.' }, { status: 403 });
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return NextResponse.json({ success: false, error: 'Invalid email or password' }, { status: 401 });
    }

    // Update last login
    await supabase.schema('roof_top').from('users').update({ last_login: new Date().toISOString() }).eq('id', user.id);

    // Generate JWT token
    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.roles?.role_name,
      roleId: user.role_id
    });

    // Don't send password hash back
    delete user.password;

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      token,
      user
    }, { status: 200 });

  } catch (error: any) {
    console.error('Login error:', error.message);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
