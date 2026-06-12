import { NextResponse } from 'next/server';

export const maxDuration = 30;

/**
 * Keep-alive Historyvoice.
 *
 * Supabase (plan gratuit) met un projet en pause après ~7 jours sans
 * activité sur la base. Ce cron envoie une vraie requête à la base toutes
 * les 48 h pour éviter la mise en pause.
 *
 * Variables d'env (à définir dans Vercel) :
 *   - HISTORYVOICE_SUPABASE_URL        ex: https://dqxaxgvncoxgwfzumvfg.supabase.co
 *   - HISTORYVOICE_SUPABASE_ANON_KEY   clé "anon" (Settings → API)
 *   - HISTORYVOICE_PING_TABLE          nom d'une table existante (défaut: "health")
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = process.env.HISTORYVOICE_SUPABASE_URL;
  const key = process.env.HISTORYVOICE_SUPABASE_ANON_KEY;
  const table = process.env.HISTORYVOICE_PING_TABLE || 'health';

  if (!url || !key) {
    return NextResponse.json(
      { ok: false, error: 'HISTORYVOICE_SUPABASE_URL/ANON_KEY manquants' },
      { status: 500 },
    );
  }

  try {
    const res = await fetch(
      `${url}/rest/v1/${table}?select=*&limit=1`,
      {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
        cache: 'no-store',
      },
    );
    return NextResponse.json({
      ok: res.ok,
      status: res.status,
      pingedAt: new Date().toISOString(),
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : String(e) },
      { status: 502 },
    );
  }
}
