import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const activities: any[] = [];

    // 1. Fetch Users
    const { data: users, error: usersErr } = await supabase
      .schema('roof_top')
      .from('users')
      .select('id, full_name, roles!inner(role_name), created_at');
      
    if (users) {
      users.forEach((u: any) => {
        activities.push({
          id: `user_${u.id}`,
          type: "user",
          title: "New User Registered",
          desc: `Account created for ${u.full_name || 'User'} (${u.roles?.role_name || 'User'}).`,
          timestamp: u.created_at,
          color: "text-indigo-500",
          bg: "bg-indigo-50",
          icon: "UserCircle"
        });
      });
    }

    // 2. Fetch Schools
    const { data: schools, error: schoolsErr } = await supabase
      .schema('roof_top')
      .from('schools')
      .select('id, kgbv_name, district, created_at');
      
    if (schools) {
      schools.forEach((s: any) => {
        activities.push({
          id: `school_${s.id}`,
          type: "school",
          title: "School Onboarded",
          desc: `Added '${s.kgbv_name}' in ${s.district}.`,
          timestamp: s.created_at,
          color: "text-amber-500",
          bg: "bg-amber-50",
          icon: "School"
        });
      });
    }

    // 3. Fetch Materials
    const { data: materials, error: matErr } = await supabase
      .schema('roof_top')
      .from('materials')
      .select('id, invoice_no, school_code, created_at');
      
    if (materials) {
      materials.forEach((m: any) => {
        activities.push({
          id: `mat_${m.id}`,
          type: "inventory",
          title: "Material Dispatched/Inward",
          desc: `Material invoice ${m.invoice_no || 'N/A'} received.`,
          timestamp: m.created_at,
          color: "text-blue-500",
          bg: "bg-blue-50",
          icon: "Package"
        });
      });
    }

    // 4. Fetch Installations
    const { data: installations, error: instErr } = await supabase
      .schema('roof_top')
      .from('school_installation')
      .select('id, installation_code, overall_status, created_at, started_at, completed_at');
      
    if (installations) {
      installations.forEach((i: any) => {
        // Created/Started
        activities.push({
          id: `inst_start_${i.id}`,
          type: "install",
          title: i.started_at ? "Installation Started" : "Installation Initialized",
          desc: `Status for ${i.installation_code}: ${i.overall_status}.`,
          timestamp: i.started_at || i.created_at,
          color: "text-emerald-500",
          bg: "bg-emerald-50",
          icon: "Wrench"
        });
        
        // Completed
        if (i.overall_status === 'Completed' && i.completed_at) {
          activities.push({
            id: `inst_end_${i.id}`,
            type: "install",
            title: "Installation Completed",
            desc: `System online for ${i.installation_code}.`,
            timestamp: i.completed_at,
            color: "text-teal-500",
            bg: "bg-teal-50",
            icon: "Zap"
          });
        }
      });
    }

    // Sort by timestamp descending
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Take top 50 recent activities
    const recentActivities = activities.slice(0, 50);

    return NextResponse.json({ success: true, data: recentActivities }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching activities:', error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
