import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { executeAgentTask } from '@/lib/agents/runner';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const { instructions, imageUrl } = await req.json() as { instructions: string; imageUrl?: string };
  if (!instructions?.trim()) return NextResponse.json({ error: 'Instructions manquantes' }, { status: 400 });

  const prompt = imageUrl
    ? `${instructions}\n\nUne photo a été fournie pour illustrer ce post. Image : ${imageUrl}`
    : instructions;

  const result = await executeAgentTask('emma', prompt, undefined, imageUrl);
  if (!result.success) return NextResponse.json({ error: result.error }, { status: 500 });

  return NextResponse.json({ success: true, content: result.content });
}
