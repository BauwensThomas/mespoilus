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

async function getDashboardData() {
  try {
    const supabase = createAdminClient();

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [statsRes, logsRes, articlesRes, securityRes, monthlyRes, monthlySecurityRes] = await Promise.all([
      supabase.from('agent_stats').select('*'),
      supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(20),
      supabase.from('articles').select('id', { count: 'exact' }).eq('status', 'published'),
      supabase.from('security_logs').select('id', { count: 'exact' }).in('threat_level', ['high', 'critical']),
      supabase.from('activity_logs')
        .select('agent_id, status, tokens_used')
        .gte('created_at', startOfMonth.toISOString()),
      supabase.from('security_logs')
        .select('id', { count: 'exact' })
        .in('threat_level', ['high', 'critical'])
        .gte('created_at', startOfMonth.toISOString()),
    ]);

    const stats: AgentStat[] = statsRes.data ?? [];
    const logs: ActivityLog[] = logsRes.data ?? [];
    const totalArticles = articlesRes.count ?? 0;
    const securityAlerts = securityRes.count ?? 0;
    const totalTasks = stats.reduce((sum, s) => sum + (s.tasks_completed ?? 0), 0);
    const totalTokens = stats.reduce((sum, s) => sum + (s.total_tokens_used ?? 0), 0);

    // Stats mensuelles par agent
    const monthlyByAgent: Record<string, MonthlyAgentStat> = {};
    let monthlyTasks = 0;
    let monthlyTokens = 0;
    for (const row of (monthlyRes.data ?? [])) {
      if (!monthlyByAgent[row.agent_id]) monthlyByAgent[row.agent_id] = { tasks: 0, tokens: 0 };
      if (row.status === 'success') { monthlyByAgent[row.agent_id].tasks++; monthlyTasks++; }
      monthlyByAgent[row.agent_id].tokens += row.tokens_used ?? 0;
      monthlyTokens += row.tokens_used ?? 0;
    }

    // Articles publiés ce mois
    const monthlyArticlesRes = await supabase
      .from('articles')
      .select('id', { count: 'exact' })
      .eq('status', 'published')
      .gte('published_at', startOfMonth.toISOString());
    const monthlyArticles = monthlyArticlesRes.count ?? 0;

    const monthlySecurityAlerts = monthlySecurityRes.count ?? 0;

    return { stats, logs, totalArticles, totalTasks, totalTokens, securityAlerts, monthlyByAgent, monthlyTasks, monthlyTokens, monthlyArticles, monthlySecurityAlerts };
  } catch {
    return { stats: [], logs: [], totalArticles: 0, totalTasks: 0, totalTokens: 0, securityAlerts: 0, monthlyByAgent: {}, monthlyTasks: 0, monthlyTokens: 0, monthlyArticles: 0, monthlySecurityAlerts: 0 };
  }
}

export default async function DashboardPage() {
  const { stats, logs, totalArticles, totalTasks, totalTokens, securityAlerts, monthlyByAgent, monthlyTasks, monthlyTokens, monthlyArticles, monthlySecurityAlerts } = await getDashboardData();
  const agents = getAllAgents();

  const statByAgent = Object.fromEntries(stats.map((s) => [s.agent_id, s]));

  return (
    <div className="px-8 py-8 space-y-8 animate-fade-in">
      <AutoRefresh intervalMs={30000} />
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Tableau de bord</h1>
          <p className="text-gray-300 text-sm mt-1">
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
      />

      {/* Feed d'activité horizontal */}
      <ActivityFeed logs={logs} />

      {/* Grille agents */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-white">Équipe d'agents</h2>
          <span className="text-xs text-gray-500">{agents.length} membres</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {agents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              stat={statByAgent[agent.id]}
              monthly={monthlyByAgent[agent.id]}
            />
          ))}
        </div>
      </div>

    </div>
  );
}
