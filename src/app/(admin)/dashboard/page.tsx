import { createAdminClient } from '@/lib/supabase/server';
import { getAllAgents } from '@/lib/agents/config';
import AgentCard from '@/components/dashboard/AgentCard';
import ActivityFeed from '@/components/dashboard/ActivityFeed';
import GlobalStats from '@/components/dashboard/GlobalStats';
import AutoRefresh from '@/components/dashboard/AutoRefresh';
import { AgentStat, ActivityLog } from '@/types';

export const dynamic = 'force-dynamic';

export type MonthlyAgentStat = { tasks: number; tokens: number };
export type TotalAgentStat = { tasks: number; tokens: number; failed: number };

async function getDashboardData() {
  try {
    const supabase = createAdminClient();

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [statsRes, logsRes, articlesRes, securityRes, statsRpcRes, monthlySecurityRes, monthlyArticlesRes, productsRes, lastCatalogSyncRes] = await Promise.all([
      supabase.from('agent_stats').select('*'),
      supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(500),
      supabase.from('articles').select('id', { count: 'exact' }).eq('status', 'published'),
      supabase.from('security_logs').select('id', { count: 'exact' }).in('threat_level', ['high', 'critical']),
      supabase.rpc('get_agent_stats_aggregated', { start_of_month: startOfMonth.toISOString() }),
      supabase.from('security_logs').select('id', { count: 'exact' }).in('threat_level', ['high', 'critical']).gte('created_at', startOfMonth.toISOString()),
      supabase.from('articles').select('id', { count: 'exact' }).eq('status', 'published').gte('published_at', startOfMonth.toISOString()),
      supabase.from('products_catalog').select('id', { count: 'exact' }).eq('status', 'active'),
      supabase.from('activity_logs')
        .select('created_at')
        .ilike('action', '[Catalog sync%')
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
    let lastCatalogSync: string | null = null;
    if (lastCatalogSyncRes.data && lastCatalogSyncRes.data.length > 0) {
      lastCatalogSync = lastCatalogSyncRes.data[0].created_at;
    }

    // Agrégation cote DB via RPC (evite la limite Supabase 1000 lignes)
    const rpc = (statsRpcRes.data ?? {}) as {
      total_by_agent?: Record<string, TotalAgentStat>;
      monthly_by_agent?: Record<string, MonthlyAgentStat>;
      global_total_tasks?: number;
      global_total_tokens?: number;
      global_monthly_tasks?: number;
      global_monthly_tokens?: number;
    };
    const totalByAgent: Record<string, TotalAgentStat> = rpc.total_by_agent ?? {};
    const monthlyByAgent: Record<string, MonthlyAgentStat> = rpc.monthly_by_agent ?? {};
    const totalTasks = Number(rpc.global_total_tasks ?? 0);
    const totalTokens = Number(rpc.global_total_tokens ?? 0);
    const monthlyTasks = Number(rpc.global_monthly_tasks ?? 0);
    const monthlyTokens = Number(rpc.global_monthly_tokens ?? 0);

    return { stats, logs, totalArticles, totalTasks, totalTokens, securityAlerts, totalByAgent, monthlyByAgent, monthlyTasks, monthlyTokens, monthlyArticles, monthlySecurityAlerts, totalProducts, lastCatalogSync };
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
      lastCatalogSync: null
    };
  }
}

export default async function DashboardPage() {
  const { stats, logs, totalArticles, totalTasks, totalTokens, securityAlerts, totalByAgent, monthlyByAgent, monthlyTasks, monthlyTokens, monthlyArticles, monthlySecurityAlerts, totalProducts, lastCatalogSync } = await getDashboardData();
  const agents = getAllAgents();

  const statByAgent = Object.fromEntries(stats.map((s) => [s.agent_id, s]));

  return (
    <div className="px-8 py-8 space-y-8 animate-fade-in">
      <AutoRefresh intervalMs={30000} />
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Tableau de bord</h1>
        <p className="text-gray-600 text-base mt-1">
          Système multi-agents Mes Poilus
        </p>
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
        lastCatalogSync={lastCatalogSync}
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
