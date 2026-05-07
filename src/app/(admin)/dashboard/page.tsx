import { createAdminClient } from '@/lib/supabase/server';
import { getAllAgents } from '@/lib/agents/config';
import AgentCard from '@/components/dashboard/AgentCard';
import ActivityFeed from '@/components/dashboard/ActivityFeed';
import GlobalStats from '@/components/dashboard/GlobalStats';
import CronLauncher from '@/components/dashboard/CronLauncher';
import { AgentStat, ActivityLog } from '@/types';

export const revalidate = 30;

async function getDashboardData() {
  try {
    const supabase = createAdminClient();

    const [statsRes, logsRes, articlesRes, securityRes] = await Promise.all([
      supabase.from('agent_stats').select('*'),
      supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(20),
      supabase.from('articles').select('id', { count: 'exact' }).eq('status', 'published'),
      supabase.from('security_logs').select('id', { count: 'exact' }).in('threat_level', ['high', 'critical']),
    ]);

    const stats: AgentStat[] = statsRes.data ?? [];
    const logs: ActivityLog[] = logsRes.data ?? [];
    const totalArticles = articlesRes.count ?? 0;
    const securityAlerts = securityRes.count ?? 0;
    const totalTasks = stats.reduce((sum, s) => sum + (s.tasks_completed ?? 0), 0);
    const totalTokens = stats.reduce((sum, s) => sum + (s.total_tokens_used ?? 0), 0);

    return { stats, logs, totalArticles, totalTasks, totalTokens, securityAlerts };
  } catch {
    return { stats: [], logs: [], totalArticles: 0, totalTasks: 0, totalTokens: 0, securityAlerts: 0 };
  }
}

export default async function DashboardPage() {
  const { stats, logs, totalArticles, totalTasks, totalTokens, securityAlerts } = await getDashboardData();
  const agents = getAllAgents();

  const statByAgent = Object.fromEntries(stats.map((s) => [s.agent_id, s]));

  return (
    <div className="px-8 py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Tableau de bord</h1>
          <p className="text-gray-500 text-sm mt-1">
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
      />

      {/* Feed d'activité horizontal */}
      <ActivityFeed logs={logs} horizontal />

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
            />
          ))}
        </div>
      </div>

    </div>
  );
}
