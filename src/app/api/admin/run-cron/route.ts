import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

const CRON_PATHS: Record<string, string> = {
  blog:                 '/api/cron/blog',
  social:               '/api/cron/social',
  finance:              '/api/cron/finance',
  security:             '/api/cron/security',
  newsletter:           '/api/cron/newsletter',
  'awin-sync':          '/api/cron/awin-sync',
  prenoms:              '/api/cron/prenoms',
  'awin-sync-chiens':   '/api/cron/awin-sync/chiens',
  'awin-sync-chats':    '/api/cron/awin-sync/chats',
  'awin-sync-oiseaux':  '/api/cron/awin-sync/oiseaux',
  'awin-sync-rongeurs': '/api/cron/awin-sync/rongeurs',
  'awin-sync-reptiles': '/api/cron/awin-sync/reptiles',
  'awin-sync-livres':   '/api/cron/awin-sync/livres',
  'awin-sync-general':  '/api/cron/awin-sync/general',
  'cj-sync-canada-pet-care': '/api/cron/cj-sync/canada-pet-care',
};

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const { step, animal, type, auto, target, bypass } = await req.json() as {
    step: string;
    animal?: string;
    type?: string;
    auto?: string;
    target?: string;
    bypass?: string;
  };

  // ─── Lecture progression Awin (pas d'appel cron, lecture directe Supabase) ──
  if (step === 'awin-progress') {
    const adminSupabase = createAdminClient();
    const { data, error } = await adminSupabase
      .from('awin_sync_progress')
      .select('category, status, synced, current_feed, error, started_at, updated_at, finished_at');
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const progress = Object.fromEntries((data ?? []).map(r => [r.category, r]));
    return NextResponse.json({ progress });
  }

  const cronPath = CRON_PATHS[step];
  if (!cronPath) return NextResponse.json({ error: 'Étape inconnue' }, { status: 400 });

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.startsWith('http://localhost'))
    ? process.env.NEXT_PUBLIC_APP_URL
    : process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';

  const VALID_ANIMALS = ['chiens', 'chats', 'oiseaux', 'rongeurs', 'reptiles'];
  const VALID_TYPES = ['trending', 'affiliation', 'pratique'];
  const params = new URLSearchParams();
  if (step === 'blog' && auto === 'true') params.set('auto', 'true');
  else if (step === 'blog' && animal && VALID_ANIMALS.includes(animal)) params.set('animal', animal);
  if (step === 'blog' && type && VALID_TYPES.includes(type)) params.set('type', type);
  if (step === 'newsletter' && bypass === 'true') params.set('bypass', 'true');
  if (step === 'newsletter' && target) params.set('target', target);
  const queryParams = params.toString() ? `?${params.toString()}` : '';

  try {
    const r = await fetch(`${appUrl}${cronPath}${queryParams}`, {
      headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
    });
    const data = await r.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erreur inconnue' }, { status: 500 });
  }
}