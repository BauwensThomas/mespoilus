import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import sharp from 'sharp';

export const dynamic = 'force-dynamic';

// Cache mémoire de l'image source redimensionnée (évite de re-télécharger Supabase à chaque requête)
const baseCache = new Map<string, Buffer>();
// Cache de l'image composée finale (clé = id:nbRévélés:format:terminé). Les pixels ne font
// que s'ajouter → le nombre de pixels révélés identifie l'état courant de façon fiable.
const composedCache = new Map<string, Buffer>();

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // Instagram/Facebook exigent du JPEG → ?fmt=jpg ; sinon WebP (plus léger, pour le site)
  const isJpg = new URL(req.url).searchParams.get('fmt') === 'jpg';
  const supabase = createAdminClient();

  const { data: grille } = await supabase
    .from('pixel_grilles')
    .select('image_path, grille_taille, gagnant_devinette_id, statut')
    .eq('id', id)
    .single();

  if (!grille) return new NextResponse('Not found', { status: 404 });

  const { data: achats } = await supabase
    .from('pixel_achats')
    .select('positions')
    .eq('grille_id', id)
    .not('confirmed_at', 'is', null);

  const revealedSet = new Set<number>();
  achats?.forEach(a => (a.positions as number[]).forEach(p => revealedSet.add(p)));

  const displaySize = 750;
  const gridSize: number = grille.grille_taille;
  const done = !!grille.gagnant_devinette_id || grille.statut === 'completed';
  const fmt = isJpg ? 'jpg' : 'webp';
  const ct = isJpg ? 'image/jpeg' : 'image/webp';
  // Grille terminée → image figée, cacheable longtemps (réduit l'egress sur les
  // grilles passées encore partagées/crawlées). En live, cache court (60s) : on
  // tolère un masque jusqu'à 60s périmé pour éviter de re-servir l'image à chaque
  // affichage/refresh (gros poste d'egress quand la page a du trafic).
  const cacheControl = done ? 'public, max-age=86400, immutable' : 'public, max-age=60';

  // Sert depuis le cache composé si disponible
  const composedKey = `${id}:${revealedSet.size}:${fmt}:${done ? 'done' : 'live'}`;
  const cachedComposed = composedCache.get(composedKey);
  if (cachedComposed) {
    return new Response(new Uint8Array(cachedComposed), {
      headers: { 'Content-Type': ct, 'Cache-Control': cacheControl },
    });
  }

  // Récupère l'image source redimensionnée depuis le cache, sinon télécharge une fois
  const cacheKey = grille.image_path;
  let baseBuffer = baseCache.get(cacheKey);
  if (!baseBuffer) {
    const { data: blob } = await supabase.storage
      .from('pixel-grilles')
      .download(grille.image_path);
    if (!blob) return new NextResponse('Image not found', { status: 404 });
    baseBuffer = await sharp(Buffer.from(await blob.arrayBuffer()))
      .resize(displaySize, displaySize, { fit: 'fill' })
      .png()
      .toBuffer();
    baseCache.set(cacheKey, baseBuffer);
  }

  // Si la race est trouvée OU la grille terminée → image complète sans overlay
  if (done) {
    const s = sharp(baseBuffer);
    const composed = isJpg ? await s.jpeg({ quality: 85 }).toBuffer() : await s.webp({ quality: 85 }).toBuffer();
    composedCache.set(composedKey, composed);
    return new Response(new Uint8Array(composed), {
      headers: { 'Content-Type': ct, 'Cache-Control': cacheControl },
    });
  }

  // Masque brut à la résolution de la grille (75×75) : caché = sombre opaque, révélé = transparent
  const totalTiles = gridSize * gridSize;
  const mask = Buffer.alloc(totalTiles * 4);
  for (let i = 0; i < totalTiles; i++) {
    const o = i * 4;
    if (revealedSet.has(i)) {
      mask[o] = 0; mask[o + 1] = 0; mask[o + 2] = 0; mask[o + 3] = 0; // transparent
    } else {
      mask[o] = 17; mask[o + 1] = 24; mask[o + 2] = 39; mask[o + 3] = 255; // #111827 opaque
    }
  }

  // Agrandit le masque 75×75 → 750×750 sans lissage (nearest), bien plus rapide qu'un SVG
  const overlay = await sharp(mask, { raw: { width: gridSize, height: gridSize, channels: 4 } })
    .resize(displaySize, displaySize, { kernel: 'nearest' })
    .png()
    .toBuffer();

  const withOverlay = sharp(baseBuffer).composite([{ input: overlay, top: 0, left: 0 }]);
  const composed = isJpg
    ? await withOverlay.jpeg({ quality: 85 }).toBuffer()
    : await withOverlay.webp({ quality: 85 }).toBuffer();

  composedCache.set(composedKey, composed);
  return new Response(new Uint8Array(composed), {
    headers: { 'Content-Type': ct, 'Cache-Control': cacheControl },
  });
}
