import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const FRAPPE_BASE_URL = 'https://brihaspathi.m.frappe.cloud';
const FRAPPE_AUTH_HEADER = 'token 7f74aa368aaa8be:8e501bc8bdfb1ca';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const doctype = searchParams.get('doctype');
    const name = searchParams.get('name');

    if (!doctype || !name) {
      return NextResponse.json({ success: false, error: 'Missing doctype or name parameters' }, { status: 400 });
    }

    const url = `${FRAPPE_BASE_URL}/api/resource/${encodeURIComponent(doctype)}/${encodeURIComponent(name)}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': FRAPPE_AUTH_HEADER,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Frappe API Error for ${doctype} ${name}: ${response.status} - ${text}`);
    }

    const json = await response.json();
    return NextResponse.json({
      success: true,
      data: json.data
    });
  } catch (error: any) {
    console.error('Error fetching ERP document details:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
