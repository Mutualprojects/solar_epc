import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const FRAPPE_BASE_URL = 'https://brihaspathi.m.frappe.cloud';
const FRAPPE_AUTH_HEADER = 'token 7f74aa368aaa8be:8e501bc8bdfb1ca';

async function fetchFromFrappe(resource: string, filters: any[]) {
  const url = new URL(`${FRAPPE_BASE_URL}/api/resource/${resource}`);
  url.searchParams.append('fields', '["*"]');
  url.searchParams.append('filters', JSON.stringify(filters));
  url.searchParams.append('limit_page_length', '100');

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Authorization': FRAPPE_AUTH_HEADER,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Frappe API Error for ${resource}: ${response.status} - ${text}`);
  }

  const json = await response.json();
  return json.data || [];
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const project = searchParams.get('project') || 'PROJ-0021';

    // Fetch all resources in parallel
    const [
      purchaseOrders,
      purchaseInvoices,
      expenseClaims,
      salesOrders,
      salesInvoices,
      timesheets
    ] = await Promise.all([
      fetchFromFrappe('Purchase Order', [['project', '=', project]]),
      fetchFromFrappe('Purchase Invoice', [['project', '=', project]]),
      fetchFromFrappe('Expense Claim', [['project', '=', project]]),
      fetchFromFrappe('Sales Order', [['project', '=', project]]),
      fetchFromFrappe('Sales Invoice', [['project', '=', project]]),
      fetchFromFrappe('Timesheet', [['parent_project', '=', project]]),
    ]);

    return NextResponse.json({
      success: true,
      project,
      data: {
        purchaseOrders,
        purchaseInvoices,
        expenseClaims,
        salesOrders,
        salesInvoices,
        timesheets
      }
    });
  } catch (error: any) {
    console.error('Error fetching ERP data:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
