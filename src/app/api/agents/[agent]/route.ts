import { NextRequest, NextResponse } from 'next/server';
import { AGENTS } from '@/lib/agents/config';
import { streamAgentTask } from '@/lib/agents/runner';
import { checkRateLimit, getClientIP } from '@/lib/rateLimit';
import { sanitizeInput, logSecurityEvent, isIPBlocked, analyzeThreat } from '@/lib/security';
import { createAdminClient } from '@/lib/supabase/server';
import type { AgentId } from '@/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ agent: string }> }
) {
  const ip = getClientIP(request);
  const userAgent = request.headers.get('user-agent') ?? '';
  const { agent } = await params;
  const agentId = agent as AgentId;

  // Vérifier que l'agent existe
  if (!AGENTS[agentId]) {
    return NextResponse.json({ error: 'Agent introuvable' }, { status: 404 });
  }

  // Vérifier si l'IP est bloquée
  const blocked = await isIPBlocked(ip);
  if (blocked) {
    await logSecurityEvent({
      ip, userAgent, endpoint: `/api/agents/${agentId}`, method: 'POST',
      threatLevel: 'high', threatType: 'Blocked IP',
      actionTaken: 'Request denied', blocked: true, details: {},
    });
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }

  // Rate limiting strict sur les API agents (10 req/min)
  const { allowed, remaining, resetAt } = await checkRateLimit(`agent:${ip}`, 60_000, 10);
  if (!allowed) {
    return NextResponse.json(
      { error: 'Limite de requêtes atteinte. Réessayez dans 60 secondes.' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Remaining': '0',
          'Retry-After': String(Math.ceil((resetAt - Date.now()) / 1000)),
        },
      }
    );
  }

  // Parser le body
  let body: { task?: string; imageUrl?: string; context?: Record<string, unknown> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Corps de requête invalide' }, { status: 400 });
  }

  const rawTask = body.task ?? '';
  if (!rawTask.trim()) {
    return NextResponse.json({ error: 'La tâche ne peut pas être vide' }, { status: 400 });
  }

  // Analyser les menaces dans la tâche
  const threat = analyzeThreat(rawTask);
  if (threat.isThreat && (threat.threatLevel === 'high' || threat.threatLevel === 'critical')) {
    await logSecurityEvent({
      ip, userAgent, endpoint: `/api/agents/${agentId}`, method: 'POST',
      threatLevel: threat.threatLevel, threatType: threat.threatType,
      actionTaken: 'Request blocked', blocked: true, details: { task_preview: rawTask.slice(0, 100) },
    });
    return NextResponse.json({ error: 'Requête bloquée par le système de sécurité' }, { status: 403 });
  }

  let task = sanitizeInput(rawTask);
  const imageUrl = typeof body.imageUrl === 'string' && body.imageUrl.startsWith('https://') ? body.imageUrl : undefined;

  // Emma n'a pas accès à la base : si la tâche vise "le dernier article publié",
  // on récupère le vrai article et on construit le prompt exact (évite que le LLM hallucine et publie n'importe quoi)
  if (agentId === 'emma' && /derni[eè]re?\s+article|dernier\s+article|article\s+publi/i.test(task)) {
    try {
      const supabase = createAdminClient();
      const { data } = await supabase
        .from('articles')
        .select('title, slug, excerpt')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data?.slug) {
        task = `Crée un post Facebook et Instagram pour cet article de conseils :\nTitre : ${data.title}\nRésumé : ${data.excerpt || data.title}\nLe post doit donner envie de lire l'article complet.\nIMPORTANT : tu dois inclure ce lien EXACT à la fin du post, sans le modifier ni le raccourcir :\nhttps://www.mespoilus.com/blog/${data.slug}`;
      }
    } catch { /* fallback : garde la tâche brute */ }
  }

  // Stream la réponse
  try {
    const stream = await streamAgentTask(agentId, task, imageUrl);

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'X-RateLimit-Remaining': String(remaining),
        'Cache-Control': 'no-cache, no-store',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur interne';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// GET pour récupérer les infos de l'agent
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ agent: string }> }
) {
  const { agent: agentSlug } = await params;
  const agentId = agentSlug as AgentId;
  const agent = AGENTS[agentId];

  if (!agent) {
    return NextResponse.json({ error: 'Agent introuvable' }, { status: 404 });
  }

  return NextResponse.json({
    id: agent.id,
    name: agent.name,
    role: agent.role,
    description: agent.description,
    icon: agent.icon,
    model: agent.model,
  });
}
