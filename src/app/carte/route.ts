import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

// createAdminClient (@supabase/supabase-js) utilise des API Node non supportées sur Edge Runtime
export const runtime = 'nodejs';

const REDIRECT_URL = 'https://mespoilus.com/?utm_source=carte_visite&utm_medium=qr&utm_campaign=presentoir_2026';

export async function GET(req: NextRequest) {
  // Le tracking ne doit jamais empêcher la redirection : toute erreur ici est avalée.
  try {
    const supabase = createAdminClient();

    // Ville/pays/région fournis par Vercel côté edge (déduits de l'IP, jamais stockés nous-mêmes)
    const city = req.headers.get('x-vercel-ip-city');

    await supabase.from('qr_scans').insert({
      user_agent: req.headers.get('user-agent'),
      city: city ? decodeURIComponent(city) : null,
      country: req.headers.get('x-vercel-ip-country'),
      region: req.headers.get('x-vercel-ip-country-region'),
      language: req.headers.get('accept-language')?.split(',')[0] ?? null,
    });
  } catch (err) {
    console.error('[carte] échec insertion qr_scans:', err);
  }

  return NextResponse.redirect(REDIRECT_URL);
}
