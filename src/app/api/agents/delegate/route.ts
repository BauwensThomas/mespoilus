import { NextRequest, NextResponse } from 'next/server';
import { executeAgentTask } from '@/lib/agents/runner';
import { createAdminClient } from '@/lib/supabase/server';
import { buildEnrichedPrompt } from '@/lib/agents/context';
import { AGENTS } from '@/lib/agents/config';

export const runtime = 'nodejs';
export const maxDuration = 120;

interface DelegationTask {
  agent: string;
  task: string;
  priority: number;
}

interface ThomasDecision {
  shouldDelegate: boolean;
  reason: string;
  tasks: DelegationTask[];
}

export async function POST(request: NextRequest) {
  let body: { agentId?: string; agentResponse?: string; originalTask?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Corps invalide' }, { status: 400 });
  }

  const { agentId, agentResponse, originalTask } = body;
  if (!agentId || !agentResponse || !originalTask) {
    return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });
  }

  // Réponse trop courte → pas de délégation
  if (agentResponse.length < 150) {
    return NextResponse.json({ thomasDecision: null, delegations: [] });
  }

  const agentName = AGENTS[agentId as keyof typeof AGENTS]?.name ?? agentId;
  const supabase = createAdminClient();

  // ── Thomas analyse et décide ─────────────────────────────────────────────
  const thomasPrompt = `Tu es Thomas, le CEO de Mes Poilus. L'agent ${agentName} vient de terminer cette tâche.

TÂCHE ORIGINALE : "${originalTask}"

RAPPORT DE ${agentName.toUpperCase()} :
${agentResponse.slice(0, 2000)}

Sur la base de ce rapport, identifie si des tâches concrètes doivent être déléguées à d'autres agents pour aller plus loin ou résoudre des problèmes identifiés.

Ne délègue QUE si c'est vraiment utile et actionnable. Évite les délégations génériques ou redondantes.

Réponds UNIQUEMENT avec ce JSON valide :
{
  "shouldDelegate": true,
  "reason": "Explication courte en 1 phrase de pourquoi tu délègues",
  "tasks": [
    { "agent": "maxime", "task": "Description précise et actionnable de la tâche", "priority": 1 }
  ]
}

Ou si rien à déléguer :
{
  "shouldDelegate": false,
  "reason": "Explication courte",
  "tasks": []
}

Agents disponibles (différents de ${agentName}) : marie, lucas, emma, maxime, lea, antoine, nathalie, sofia.
Maximum 3 délégations. Priorité 1 = le plus urgent.`;

  const thomasResult = await executeAgentTask('thomas', thomasPrompt);

  let decision: ThomasDecision = { shouldDelegate: false, reason: 'Aucune délégation nécessaire.', tasks: [] };
  try {
    const jsonMatch = thomasResult.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) decision = JSON.parse(jsonMatch[0]);
  } catch { /* garde le défaut */ }

  if (!decision.shouldDelegate || decision.tasks.length === 0) {
    return NextResponse.json({
      thomasDecision: decision.reason,
      delegations: [],
    });
  }

  // ── Exécuter les délégations en parallèle ────────────────────────────────
  const delegations = await Promise.all(
    decision.tasks.slice(0, 3).map(async (t) => {
      const enriched = await buildEnrichedPrompt(t.agent, t.task, supabase);
      const result = await executeAgentTask(t.agent as never, enriched);
      return {
        agent: t.agent,
        task: t.task,
        success: result.success,
        result: result.content.slice(0, 1000),
        priority: t.priority,
      };
    })
  );

  return NextResponse.json({
    thomasDecision: decision.reason,
    delegations,
  });
}
