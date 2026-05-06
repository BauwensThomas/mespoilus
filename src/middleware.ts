import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ADMIN_PAGE_PREFIXES = ['/dashboard', '/agents', '/orchestrate'];
const ADMIN_API_PREFIXES = ['/api/agents', '/api/orchestrate', '/api/stats', '/api/security'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminPage = ADMIN_PAGE_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  );
  const isAdminApi = ADMIN_API_PREFIXES.some((p) => pathname.startsWith(p));

  if (!isAdminPage && !isAdminApi) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    if (isAdminApi) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/agents/:path*',
    '/orchestrate/:path*',
    '/api/agents/:path*',
    '/api/orchestrate/:path*',
    '/api/stats/:path*',
    '/api/security/:path*',
  ],
};
