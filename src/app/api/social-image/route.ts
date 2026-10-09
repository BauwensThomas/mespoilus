import { NextRequest, NextResponse } from 'next/server';
import { cropForInstagram } from '@/lib/social-image';

export const dynamic = 'force-dynamic';

// Proxy de recadrage au ratio Instagram (voir src/lib/social-image.ts). Les envois Make passent
// désormais par prepareSocialImage (URL statique Supabase) ; ce proxy reste le repli.

export async function GET(req: NextRequest) {
  const src = new URL(req.url).searchParams.get('src');
  if (!src) return new NextResponse('Missing src', { status: 400 });

  let buf: Buffer;
  try {
    const res = await fetch(src, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return new NextResponse('Fetch failed', { status: 502 });
    buf = Buffer.from(await res.arrayBuffer());
  } catch {
    return new NextResponse('Fetch failed', { status: 502 });
  }

  const jpeg = await cropForInstagram(buf);

  return new Response(new Uint8Array(jpeg), {
    headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=86400' },
  });
}
