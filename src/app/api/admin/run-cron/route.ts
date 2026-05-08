import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type CronStep = 'blog' | 'social' | 'finance' | 'security' | 'newsletter';

const CRON_PATHS: Record<CronStep, string> = {
  blog:       '/api/cron/blog',
  social:     '/api/cron/social',
  finance:    '/api/cron/finance',
  security:   '/api/cron/security',
  newsletter: '/api/cron/newsletter',
};

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const { step, animal } = await req.json() as { step: CronStep; animal?: string };
  const cronPath = CRON_PATHS[step];
  if (!cronPath) return NextResponse.json({ error: 'Étape inconnue' }, { status: 400 });

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.startsWith('http://localhost'))
    ? process.env.NEXT_PUBLIC_APP_URL
    : process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';

  const VALID_ANIMALS = ['chiens', 'chats', 'oiseaux', 'rongeurs', 'reptiles'];
  const queryParams = (step === 'blog' && animal && VALID_ANIMALS.includes(animal))
    ? `?animal=${animal}`
    : '';

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
