import { NextRequest, NextResponse } from 'next/server';
import { executeAgentTask } from '@/lib/agents/runner';
import { checkRateLimit, getClientIP } from '@/lib/rateLimit';
import { sanitizeInput } from '@/lib/security';

export const runtime = 'nodejs';
export const maxDuration = 120;

interface OrchestrationPlan {
  strategy: string;
  tasks: Array<{ agent: string; task: string; priority: number }>;
}

export async function POST(request: NextRequest) {
  const ip = getClientIP(request);
  const { allowed } = checkRateLimit(`orchestrate:${ip}`, 60_000, 3);

  if (!allowed) {
    return NextResponse.json(
      { error: 'Trop de requêtes d\'orchestration. Maximum 3 par minute.' },
      { status: 429 }
    );
  }

  let body: { objective?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Corps de requête invalide' }, { status: 400 });
  }

  const rawObjective = body.objective ?? '';
  if (!rawObjective.trim()) {
    return NextResponse.json({ error: 'L\'objectif ne peut pas être vide' }, { status: 400 });
  }

  const objective = sanitizeInput(rawObjective);

  try {
    // Étape 1 : Thomas crée le plan
    const planResult = await executeAgentTask(
      'thomas',
      `Objectif reçu : "${objective}"

Tu dois créer un plan d'orchestration structuré. Réponds UNIQUEMENT avec un JSON valide dans ce format :
{
  "strategy": "Description de la stratégie globale",
  "tasks": [
    { "agent": "marie", "task": "Tâche précise pour Marie", "priority": 1 },
    { "agent": "lucas", "task": "Tâche précise pour Lucas", "priority": 2 }
  ]
}

Agents disponibles : marie, lucas, emma, maxime, lea, antoine, nathalie.
Maximum 4 agents par orchestration. Priorité 1 = le plus urgent.`
    );

    let plan: OrchestrationPlan;
    try {
      const jsonMatch = planResult.content.match(/\{[\s\S]*\}/);
      plan = jsonMatch ? JSON.parse(jsonMatch[0]) : { strategy: planResult.content, tasks: [] };
    } catch {
      plan = { strategy: planResult.content, tasks: [] };
    }

    // Étape 2 : Exécuter les tâches en parallèle (max 4)
    const taskPromises = plan.tasks.slice(0, 4).map(async (t) => {
      try {
        const result = await executeAgentTask(t.agent as never, t.task);
        return { agent: t.agent, success: result.success, content: result.content, priority: t.priority };
      } catch {
        return { agent: t.agent, success: false, content: 'Erreur d\'exécution', priority: t.priority };
      }
    });

    const results = await Promise.all(taskPromises);

    // Étape 3 : Thomas synthétise
    const synthesis = await executeAgentTask(
      'thomas',
      `L'orchestration est terminée. Voici les résultats de chaque agent :\n\n${
        results.map((r) => `**${r.agent}** (priorité ${r.priority}) :\n${r.content.slice(0, 500)}...`).join('\n\n')
      }\n\nObjectif initial : "${objective}"\n\nFais une synthèse exécutive de 200 mots maximum.`
    );

    return NextResponse.json({
      success: true,
      strategy: plan.strategy,
      results: results.map((r) => ({
        agent: r.agent,
        success: r.success,
        preview: r.content.slice(0, 300),
      })),
      synthesis: synthesis.content,
      tokensUsed: planResult.tokens_used + results.reduce((s, _) => s, 0) + synthesis.tokens_used,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur interne';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
