import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const BLOCKED_IPS_CACHE = new Map<string, number>();
const RATE_LIMIT_MAP = new Map<string, { count: number; resetAt: number }>();

function getIP(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    request.headers.get('x-real-ip') ??
    '127.0.0.1'
  );
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60_000;
  const maxRequests = 60;

  const entry = RATE_LIMIT_MAP.get(ip);
  if (!entry || now > entry.resetAt) {
    RATE_LIMIT_MAP.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= maxRequests) return false;
  entry.count++;
  return true;
}

function detectThreat(request: NextRequest): { isThreat: boolean; type: string } {
  const url = request.nextUrl.pathname + request.nextUrl.search;

  const sqlInjection = /(\bunion\b|\bselect\b|\bdrop\b|\binsert\b|\bdelete\b)/i.test(url);
  const xss = /<script|javascript:|onerror=|onload=/i.test(decodeURIComponent(url));
  const pathTraversal = /\.\.\//g.test(url);
  const sensitiveFiles = /\.(env|git|sql|bak|config)$/i.test(url);

  if (sqlInjection) return { isThreat: true, type: 'SQL Injection' };
  if (xss) return { isThreat: true, type: 'XSS' };
  if (pathTraversal) return { isThreat: true, type: 'Path Traversal' };
  if (sensitiveFiles) return { isThreat: true, type: 'Sensitive File Access' };

  return { isThreat: false, type: '' };
}

export function middleware(request: NextRequest) {
  const ip = getIP(request);
  const response = NextResponse.next();

  // Security headers
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // Check cached blocked IPs
  const blockedUntil = BLOCKED_IPS_CACHE.get(ip);
  if (blockedUntil && Date.now() < blockedUntil) {
    return new NextResponse('Accès refusé', {
      status: 403,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  // Threat detection on API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const threat = detectThreat(request);
    if (threat.isThreat) {
      // Block IP for 1 hour
      BLOCKED_IPS_CACHE.set(ip, Date.now() + 60 * 60 * 1000);
      return new NextResponse(
        JSON.stringify({ error: 'Requête bloquée par le système de sécurité' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Rate limiting on API
    if (!checkRateLimit(ip)) {
      return new NextResponse(
        JSON.stringify({ error: 'Trop de requêtes. Réessayez dans 60 secondes.' }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '60',
          },
        }
      );
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
