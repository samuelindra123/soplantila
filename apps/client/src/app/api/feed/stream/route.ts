import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';

// Force dynamic route - prevent static caching
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * SSE Proxy Route
 * 
 * This route proxies SSE connections from browser to NestJS backend.
 * Why needed:
 * 1. Native EventSource can't send custom headers (like Authorization)
 * 2. We need to attach httpOnly cookie token server-side
 * 3. Avoid CORS issues with SSE
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    
    // Try both cookie names for compatibility
    let accessToken = cookieStore.get('access_token')?.value;
    if (!accessToken) {
      accessToken = cookieStore.get('soplantila_access_token')?.value;
    }

    console.log('[SSE Proxy] Request received, checking cookies...', {
      hasAccessToken: !!accessToken,
      cookieNames: Array.from(cookieStore.getAll().map(c => c.name)),
    });

    if (!accessToken) {
      console.error('[SSE Proxy] No access token found in cookies');
      console.error('[SSE Proxy] Available cookies:', cookieStore.getAll().map(c => ({ name: c.name, hasValue: !!c.value })));
      return new Response(
        JSON.stringify({ 
          error: 'Unauthorized', 
          message: 'No access token found in cookies',
          availableCookies: cookieStore.getAll().map(c => c.name)
        }), 
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    const sseUrl = `${backendUrl}/api/feed-events/stream`;

    console.log('[SSE Proxy] Connecting to backend SSE:', sseUrl, 'with token:', accessToken.substring(0, 20) + '...');

    // Fetch SSE stream from backend with auth
    // Backend expects Authorization: Bearer <token>, not cookies
    const response = await fetch(sseUrl, {
      method: 'GET',
      headers: {
        'Accept': 'text/event-stream',
        'Authorization': `Bearer ${accessToken}`,
      },
      // @ts-ignore - Next.js supports this
      duplex: 'half',
    });

    if (!response.ok) {
      console.error('[SSE Proxy] Backend SSE failed:', response.status, response.statusText);
      return new Response(`Backend SSE error: ${response.status}`, {
        status: response.status,
      });
    }

    if (!response.body) {
      console.error('[SSE Proxy] No response body from backend');
      return new Response('No response body', { status: 500 });
    }

    console.log('[SSE Proxy] Connected successfully, streaming to client');

    // Stream response to client
    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no', // Disable nginx buffering
      },
    });
  } catch (error) {
    console.error('[SSE Proxy] Error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
