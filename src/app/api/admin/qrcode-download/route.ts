import { NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

// Doit toujours pointer vers la même route que /src/app/carte/route.ts
const TARGET_URL = 'https://mespoilus.com/carte';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  // Modules noirs, fond transparent (alpha 0 sur la couleur claire)
  const svg = await QRCode.toString(TARGET_URL, {
    type: 'svg',
    color: { dark: '#000000ff', light: '#0000' },
    margin: 1,
    width: 1000,
  });

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Content-Disposition': 'attachment; filename="qrcode-carte-mespoilus.svg"',
    },
  });
}
