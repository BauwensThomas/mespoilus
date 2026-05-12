import { createAdminClient } from '@/lib/supabase/server';
import { getAllAgents } from '@/lib/agents/config';
import AgentCard from '@/components/dashboard/AgentCard';
import ActivityFeed from '@/components/dashboard/ActivityFeed';
import GlobalStats from '@/components/dashboard/GlobalStats';
import CronLauncher from '@/components/dashboard/CronLauncher';
import AutoRefresh from '@/components/dashboard/AutoRefresh';
import { AgentStat, ActivityLog } from '@/types';

export const revalidate = 30;

export type MonthlyAgentStat = { tasks: number; tokens: number };
export type TotalAgentStat = { tasks: number; tokens: number; failed: number };

async function getDashboardData() {
  try {
    const supabase = createAdminClient();

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [statsRes, logsRes, articlesRes, securityRes, allActivityRes, monthlySecurityRes, monthlyArticlesRes, productsRes, lastAwinSyncRes] = await Promise.all([
      supabase.from('agent_stats').select('*'),
      supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(20),
      supabase.from('articles').select('id', { count: 'exact' }).eq('status', 'published'),
      supabase.from('security_logs').select('id', { count: 'exact' }).in('threat_level', ['high', 'critical']),
      supabase.from('activity_logs').select('agent_id, status, tokens_used, created_at'),
      supabase.from('security_logs').select('id', { count: 'exact' }).in('threat_level', ['high', 'critical']).gte('created_at', startOfMonth.toISOString()),
      supabase.from('articles').select('id', { count: 'exact' }).eq('status', 'published').gte('published_at', startOfMonth.toISOString()),
      supabase.from('products').select('id', { count: 'exact' }).eq('in_stock', true),
      supabase.from('activity_logs')
        .select('created_at')
        .ilike('action', '[Awin sync]%')
        .order('created_at', { ascending: false })
        .limit(1),
    ]);

    const stats: AgentStat[] = statsRes.data ?? [];
    const logs: ActivityLog[] = logsRes.data ?? [];
    const totalArticles = articlesRes.count ?? 0;
    const securityAlerts = securityRes.count ?? 0;
    const monthlyArticles = monthlyArticlesRes.count ?? 0;
    const monthlySecurityAlerts = monthlySecurityRes.count ?? 0;
    const totalProducts = productsRes.count ?? 0;
    let lastAwinSync: string | null = null;
    if (lastAwinSyncRes.data && lastAwinSyncRes.data.length > 0) {
      lastAwinSync = lastAwinSyncRes.data[0].created_at;
    }

    // Calcul totaux + mensuels depuis activity_logs (source unique)
    const totalByAgent: Record<string, TotalAgentStat> = {};
    const monthlyByAgent: Record<string, MonthlyAgentStat> = {};
    let totalTasks = 0, totalTokens = 0, monthlyTasks = 0, monthlyTokens = 0;

    for (const row of (allActivityRes.data ?? [])) {
      if (!totalByAgent[row.agent_id]) totalByAgent[row.agent_id] = { tasks: 0, tokens: 0, failed: 0 };
      if (!monthlyByAgent[row.agent_id]) monthlyByAgent[row.agent_id] = { tasks: 0, tokens: 0 };

      const isThisMonth = new Date(row.created_at) >= startOfMonth;
      const tokens = row.tokens_used ?? 0;

      if (row.status === 'success') {
        totalByAgent[row.agent_id].tasks++;
        totalTasks++;
        if (isThisMonth) { monthlyByAgent[row.agent_id].tasks++; monthlyTasks++; }
      } else if (row.status === 'error') {
        totalByAgent[row.agent_id].failed++;
      }
      totalByAgent[row.agent_id].tokens += tokens;
      totalTokens += tokens;
      if (isThisMonth) { monthlyByAgent[row.agent_id].tokens += tokens; monthlyTokens += tokens; }
    }

    return { stats, logs, totalArticles, totalTasks, totalTokens, securityAlerts, totalByAgent, monthlyByAgent, monthlyTasks, monthlyTokens, monthlyArticles, monthlySecurityAlerts, totalProducts, lastAwinSync };
  } catch {
    return {
      stats: [],
      logs: [],
      totalArticles: 0,
      totalTasks: 0,
      totalTokens: 0,
      securityAlerts: 0,
      totalByAgent: {} as Record<string, TotalAgentStat>,
      monthlyByAgent: {} as Record<string, MonthlyAgentStat>,
      monthlyTasks: 0,
      monthlyTokens: 0,
      monthlyArticles: 0,
      monthlySecurityAlerts: 0,
      totalProducts: 0,
      lastAwinSync: null
    };
  }
}

export default async function DashboardPage() {
  const { stats, logs, totalArticles, totalTasks, totalTokens, securityAlerts, totalByAgent, monthlyByAgent, monthlyTasks, monthlyTokens, monthlyArticles, monthlySecurityAlerts, totalProducts, lastAwinSync } = await getDashboardData();
  const agents = getAllAgents();

  const statByAgent = Object.fromEntries(stats.map((s) => [s.agent_id, s]));

  return (
    <div className="px-8 py-8 space-y-8 animate-fade-in">
      <AutoRefresh intervalMs={30000} />
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Tableau de bord</h1>
          <p className="text-gray-600 text-base mt-1">
            Système multi-agents Mes Poilus
          </p>
        </div>
        <CronLauncher />
      </div>

      {/* Stats globales */}
      <GlobalStats
        totalArticles={totalArticles}
        totalTasks={totalTasks}
        totalTokens={totalTokens}
        securityAlerts={securityAlerts}
        monthlyArticles={monthlyArticles}
        monthlyTasks={monthlyTasks}
        monthlyTokens={monthlyTokens}
        monthlySecurityAlerts={monthlySecurityAlerts}
        totalProducts={totalProducts ?? 0}
        lastAwinSync={lastAwinSync}
      />

      {/* Feed d'activité horizontal */}
      <ActivityFeed logs={logs} />

      {/* Grille agents */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">Équipe d'agents</h2>
          <span className="text-sm text-gray-400">{agents.length} membres</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {agents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              stat={statByAgent[agent.id]}
              monthly={monthlyByAgent[agent.id]}
              total={totalByAgent[agent.id]}
            />
          ))}
        </div>
      </div>

    </div>
  );
}
