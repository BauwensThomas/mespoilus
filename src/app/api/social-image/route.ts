import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

export const dynamic = 'force-dynamic';

// Instagram refuse les photos hors du ratio 4:5 (0.8) - 1.91:1 (erreur 36003 "aspect ratio
// not supported") ; les images d'articles (Pexels) et les photos d'annonces adoption (upload
// utilisateur) ont un ratio arbitraire. On recadre au centre vers le ratio autorisé le plus
// proche avant d'envoyer l'URL au webhook Make -> Facebook/Instagram.
const IG_MIN_RATIO = 0.8;
const IG_MAX_RATIO = 1.91;

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

  const meta = await sharp(buf).metadata();
  const w = meta.width ?? 1080;
  const h = meta.height ?? 1080;
  const ratio = w / h;
  const targetRatio = Math.min(IG_MAX_RATIO, Math.max(IG_MIN_RATIO, ratio));

  const outW = targetRatio <= ratio ? Math.round(h * targetRatio) : w;
  const outH = targetRatio <= ratio ? h : Math.round(w / targetRatio);

  const jpeg = await sharp(buf)
    .resize(outW, outH, { fit: 'cover', position: 'centre' })
    .jpeg({ quality: 85 })
    .toBuffer();

  return new Response(new Uint8Array(jpeg), {
    headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=86400' },
  });
}
