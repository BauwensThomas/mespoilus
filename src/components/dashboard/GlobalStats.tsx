interface StatItemProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: string;
}

function StatItem({ label, value, sub, icon }: StatItemProps) {
  return (
    <div className="bg-[#262626] border border-[#484848] rounded-xl p-4 flex items-center gap-4">
      <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-xl flex-shrink-0">
        {icon}
      </div>
      <div>
        <div className="text-2xl font-bold text-white tracking-tight">{value}</div>
        <div className="text-xs text-gray-200 mt-0.5">{label}</div>
        {sub && <div className="text-[10px] text-gray-300">{sub}</div>}
      </div>
    </div>
  );
}

interface GlobalStatsProps {
  totalArticles: number;
  totalTasks: number;
  totalTokens: number;
  securityAlerts: number;
}

export default function GlobalStats({ totalArticles, totalTasks, totalTokens, securityAlerts }: GlobalStatsProps) {
  const fmt = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
    return String(n);
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatItem icon="📝" label="Articles publiés" value={totalArticles} sub="par Marie" />
      <StatItem icon="⚡" label="Tâches exécutées" value={totalTasks} sub="tous agents" />
      <StatItem icon="🧠" label="Tokens utilisés" value={fmt(totalTokens)} sub="API Anthropic" />
      <StatItem
        icon="🛡️"
        label="Alertes sécurité"
        value={securityAlerts}
        sub={securityAlerts > 0 ? 'voir Nathalie' : 'aucune menace'}
      />
    </div>
  );
}
