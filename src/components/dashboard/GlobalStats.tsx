interface StatItemProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: string;
  monthly?: string | number;
}

function StatItem({ label, value, sub, icon, monthly }: StatItemProps) {
  return (
    <div className="bg-[#1e2a3a] border border-[#2a3a4a] rounded-xl p-4 flex items-center gap-4">
      <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-xl flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1">
        <div className="text-2xl font-bold text-white tracking-tight">{value}</div>
        <div className="text-xs text-gray-200 mt-0.5">{label}</div>
        {sub && <div className="text-[10px] text-gray-300">{sub}</div>}
        {monthly !== undefined && (
          <div className="text-[10px] text-gray-500 mt-1 pt-1 border-t border-[#2a3a4a]">
            <span className="text-amber-400 font-medium">{monthly}</span> ce mois
          </div>
        )}
      </div>
    </div>
  );
}

interface GlobalStatsProps {
  totalArticles: number;
  totalTasks: number;
  totalTokens: number;
  securityAlerts: number;
  monthlyArticles: number;
  monthlyTasks: number;
  monthlyTokens: number;
  monthlySecurityAlerts: number;
}

export default function GlobalStats({
  totalArticles, totalTasks, totalTokens, securityAlerts,
  monthlyArticles, monthlyTasks, monthlyTokens, monthlySecurityAlerts,
}: GlobalStatsProps) {
  const fmt = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
    return String(n);
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatItem icon="📝" label="Articles publiés" value={totalArticles} sub="par Marie" monthly={monthlyArticles} />
      <StatItem icon="⚡" label="Tâches exécutées" value={totalTasks} sub="tous agents" monthly={monthlyTasks} />
      <StatItem icon="🧠" label="Tokens utilisés" value={fmt(totalTokens)} sub="API Anthropic" monthly={fmt(monthlyTokens)} />
      <StatItem
        icon="🛡️"
        label="Alertes sécurité"
        value={securityAlerts}
        sub={securityAlerts > 0 ? 'voir Nathalie' : 'aucune menace'}
        monthly={monthlySecurityAlerts}
      />
    </div>
  );
}
