import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
// Variante Edge (pur fetch, sans `process`) — le middleware tourne sur l'Edge Runtime.
// Les API routes (rateLimit.ts / security.ts) restent sur '@upstash/redis' (Node).
import { Redis } from '@upstash/redis/cloudflare';

// ─── Rate limiting + IP blocking (Edge-safe) ─────────────────────────────────

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Cache mémoire par instance (évite un appel Redis sur chaque requête)
// blocked: ip -> expiry ts | clean: ip -> expiry ts (vérifié non-bloqué)
const BLOCKED_IPS_CACHE = new Map<string, number>();
const CLEAN_IPS_CACHE   = new Map<string, number>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 min

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
  const entry = RATE_LIMIT_MAP.get(ip);
  if (!entry || now > entry.resetAt) {
    RATE_LIMIT_MAP.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= 60) return false;
  entry.count++;
  return true;
}

function detectThreat(url: string): boolean {
  const decoded = (() => { try { return decodeURIComponent(url); } catch { return url; } })();
  return (
    /(\bunion\b|\bselect\b|\bdrop\b|\binsert\b|\bdelete\b)/i.test(decoded) ||
    /<script|javascript:|onerror=|onload=/i.test(decoded) ||
    /\.\.\//g.test(url) ||
    /\.(env|git|sql|bak|config)$/i.test(url)
  );
}

// ─── Admin routes ─────────────────────────────────────────────────────────────

const ADMIN_PAGE_PREFIXES = [
  '/dashboard', '/agents', '/orchestrate', '/guides-admin', '/races-admin',
  '/blog-admin', '/adoption-admin', '/produits-admin',
  '/boutique-v2-admin', '/partenaires-admin', '/outreach-admin', '/grille-admin', '/abonnes-admin',
];
const ADMIN_API_PREFIXES = [
  '/api/agents', '/api/orchestrate', '/api/stats', '/api/security', '/api/admin',
];

// ─── Middleware ───────────────────────────────────────────────────────────────

export async function middleware(request: NextRequest) {
  const ip = getIP(request);
  const { pathname, searchParams } = request.nextUrl;

  // 0. Redirection 301 pour les query params du blog vers les routes de catégorie
  if (pathname === '/blog' && searchParams.has('category')) {
    const category = searchParams.get('category');
    const newUrl = new URL(`/blog/${category}${searchParams.has('q') ? `?q=${searchParams.get('q')}` : ''}`, request.url);
    return NextResponse.redirect(newUrl, { status: 301 });
  }

  // 1. Headers de sécurité sur toutes les réponses
  const response = NextResponse.next({ request });
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=()');

  // 2. IP bloquée - cache mémoire (rapide) + Redis (persistant cross-instances)
  const now = Date.now();
  const blockedUntil = BLOCKED_IPS_CACHE.get(ip);
  if (blockedUntil && now < blockedUntil) {
    return new NextResponse('Acces refuse', { status: 403 });
  }
  const cleanUntil = CLEAN_IPS_CACHE.get(ip);
  if (!cleanUntil || now > cleanUntil) {
    try {
      const redisBlocked = await Promise.race([
        redis.get(`blocked_ip:${ip}`),
        new Promise<null>(resolve => setTimeout(() => resolve(null), 300)),
      ]);
      if (redisBlocked) {
        BLOCKED_IPS_CACHE.set(ip, now + CACHE_TTL_MS);
        return new NextResponse('Acces refuse', { status: 403 });
      }
      CLEAN_IPS_CACHE.set(ip, now + CACHE_TTL_MS);
    } catch { /* Redis indisponible, fail open */ }
  }

  // 3. Détection de menaces + rate limiting sur les routes API
  if (pathname.startsWith('/api/')) {
    const url = request.nextUrl.search; // query params only, pas le pathname
    if (detectThreat(url)) {
      BLOCKED_IPS_CACHE.set(ip, Date.now() + 60 * 60 * 1000);
      return NextResponse.json(
        { error: 'Requete bloquee par le systeme de securite' },
        { status: 403 }
      );
    }
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Trop de requetes. Reessayez dans 60 secondes.' },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }
  }

  // 4. Auth Supabase sur les pages et APIs admin
  const isAdminPage = ADMIN_PAGE_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  );
  const isAdminApi = ADMIN_API_PREFIXES.some((p) => pathname.startsWith(p));

  if (!isAdminPage && !isAdminApi) {
    return response;
  }

  let adminResponse = NextResponse.next({ request });
  adminResponse.headers.set('X-Frame-Options', 'SAMEORIGIN');
  adminResponse.headers.set('X-Content-Type-Options', 'nosniff');
  adminResponse.headers.set('X-XSS-Protection', '1; mode=block');
  adminResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  adminResponse.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          adminResponse = NextResponse.next({ request });
          adminResponse.headers.set('X-Frame-Options', 'SAMEORIGIN');
          adminResponse.headers.set('X-Content-Type-Options', 'nosniff');
          adminResponse.headers.set('X-XSS-Protection', '1; mode=block');
          adminResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
          adminResponse.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
          cookiesToSet.forEach(({ name, value, options }) =>
            adminResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    if (isAdminApi) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return adminResponse;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)',],
};
