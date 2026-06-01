import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');

    if (!imageUrl) {
      return new NextResponse('Missing url parameter', { status: 400 });
    }

    // Security: Only allow proxying images from our Supabase instance or related hosts to avoid SSRF
    const isAllowedHost = 
      imageUrl.includes('183.82.117.36') || 
      imageUrl.includes('172.30.0.186') ||
      imageUrl.includes('supabase') ||
      imageUrl.includes('/storage/v1/object/public');

    if (!isAllowedHost) {
      return new NextResponse('Unauthorized image host', { status: 403 });
    }

    let targetUrl = imageUrl;
    // Replace public IP with internal private IP so the server can fetch it successfully without hairpin NAT issues
    if (targetUrl.includes('183.82.117.36')) {
      targetUrl = targetUrl.replace('183.82.117.36', '172.30.0.186');
    }

    // Fetch the image from the source URL server-side
    const response = await fetch(targetUrl, {
      headers: {
        'Accept': 'image/*'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const buffer = await response.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (err: any) {
    console.error('Image proxy failed:', err.message);
    return new NextResponse(`Image proxy failed: ${err.message}`, { status: 500 });
  }
}
