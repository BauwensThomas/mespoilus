import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { executeAgentTask } from '@/lib/agents/runner';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const { instructions, imageUrl } = await req.json() as { instructions: string; imageUrl?: string };
  if (!instructions?.trim()) return NextResponse.json({ error: 'Instructions manquantes' }, { status: 400 });

  const prompt = imageUrl
    ? `${instructions}\n\nUne photo a été fournie pour illustrer ce post. Image : ${imageUrl}`
    : instructions;

  const result = await executeAgentTask('emma', prompt);
  if (!result.success) return NextResponse.json({ error: result.error }, { status: 500 });

  // Envoyer au webhook Make avec l'image uploadée (prioritaire sur la logique auto)
  const makeUrl = process.env.MAKE_WEBHOOK_URL;
  if (makeUrl) {
    const hashtags = (result.content.match(/#[\wÀ-ɏ]+/g) ?? []).join(' ');
    const body: Record<string, string> = {
      content: result.content.replace(/#[\wÀ-ɏ]+/g, '').replace(/\n{3,}/g, '\n\n').trim(),
      hashtags,
    };
    if (imageUrl) body.image_url = imageUrl;
    try {
      await fetch(makeUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(5000),
      });
    } catch { /* non-bloquant */ }
  }

  return NextResponse.json({ success: true, content: result.content });
}
