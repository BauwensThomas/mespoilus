import { notFound } from 'next/navigation';
import { AGENTS, getAgent } from '@/lib/agents/config';
import { createAdminClient } from '@/lib/supabase/server';
import AgentPageComponent from '@/components/agents/AgentPage';
import type { AgentId, AgentStat, ActivityLog } from '@/types';
import type { Metadata } from 'next';
import { getPhotoForAgent, AGENT_PLACEHOLDER, type UnsplashPhoto } from '@/lib/unsplash';

export const dynamic = 'force-dynamic';

interface Props {
  params: { agent: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const agent = AGENTS[params.agent as AgentId];
  if (!agent) return { title: 'Agent introuvable' };
  return {
    title: `${agent.name} - ${agent.role}`,
    description: agent.description,
  };
}

async function getAgentData(agentId: AgentId) {
  try {
    const supabase = createAdminClient();
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [statRes, logsRes, monthlyRes] = await Promise.all([
      supabase.from('agent_stats').select('*').eq('agent_id', agentId).single(),
      supabase
        .from('activity_logs')
        .select('*')
        .eq('agent_id', agentId)
        .order('created_at', { ascending: false })
        .limit(15),
      supabase
        .from('activity_logs')
        .select('status, tokens_used')
        .eq('agent_id', agentId)
        .gte('created_at', startOfMonth.toISOString()),
    ]);

    const monthly = { tasks: 0, failed: 0, tokens: 0 };
    for (const row of (monthlyRes.data ?? [])) {
      if (row.status === 'success') monthly.tasks++;
      else if (row.status === 'error') monthly.failed++;
      monthly.tokens += row.tokens_used ?? 0;
    }

    return {
      stat: statRes.data as AgentStat | undefined,
      recentLogs: (logsRes.data as ActivityLog[]) ?? [],
      monthly,
    };
  } catch {
    return { stat: undefined, recentLogs: [], monthly: { tasks: 0, failed: 0, tokens: 0 } };
  }
}

export default async function AgentPage({ params }: Props) {
  const agentId = params.agent as AgentId;
  if (!AGENTS[agentId]) notFound();

  const agent = getAgent(agentId);

  // Fetch agent photo + DB data en parallèle
  const [{ stat, recentLogs, monthly }, agentPhoto] = await Promise.all([
    getAgentData(agentId),
    getPhotoForAgent(agentId).catch(() => null) as Promise<UnsplashPhoto | null>,
  ]);

  const photo = agentPhoto ?? null;
  const placeholderSrc = AGENT_PLACEHOLDER[agentId] ?? '/images/agents/thomas.svg';

  return (
    <AgentPageComponent
      agent={agent}
      stat={stat}
      recentLogs={recentLogs}
      photo={photo}
      placeholderSrc={placeholderSrc}
      monthly={monthly}
    />
  );
}
