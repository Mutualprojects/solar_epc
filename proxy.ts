import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js Proxy to restrict application access to a specific whitelisted IP.
 */
export function proxy(request: NextRequest) {
  // 1. Resolve client IP address using modern forwarding headers or next request properties
  const xForwardedFor = request.headers.get('x-forwarded-for');
  let clientIp = '';
  
  if (xForwardedFor) {
    clientIp = xForwardedFor.split(',')[0].trim();
  } else {
    clientIp = request.headers.get('x-real-ip') || '';
  }

  // 2. Allowed IP address configuration
  const allowedIp = '172.21.5.249';

  // 3. Keep local loopback environments whitelisted for local DX and building safety
  const isLocalhost = 
    clientIp === '127.0.0.1' || 
    clientIp === '::1' || 
    clientIp === 'localhost' || 
    clientIp === '' ||
    request.nextUrl.hostname === 'localhost' ||
    request.nextUrl.hostname === '127.0.0.1';

  if (clientIp === allowedIp || isLocalhost) {
    return NextResponse.next();
  }

  // 4. Return standard 403 Forbidden error response for unauthorized requests
  return new NextResponse(
    `Access Denied: Your IP address (${clientIp || 'unknown'}) is not authorized to access this website.`,
    {
      status: 403,
      headers: {
        'content-type': 'text/plain',
      },
    }
  );
}

export const config = {
  matcher: [
    /*
     * Intercept all requests except:
     * - _next/static (static build files)
     * - _next/image (next image optimizations)
     * - favicon.ico, sitemap.xml, robots.txt (search crawler metadata)
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
