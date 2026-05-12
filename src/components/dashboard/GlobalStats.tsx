import { BookOpen, Zap, Brain, Shield } from 'lucide-react';

interface StatItemProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  monthly?: string | number;
}

function StatItem({ label, value, sub, icon, monthly }: StatItemProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1">
        <div className="text-2xl font-bold text-gray-900 tracking-tight">{value}</div>
        <div className="text-sm text-gray-600 mt-0.5">{label}</div>
        {sub && <div className="text-xs text-gray-500">{sub}</div>}
        {monthly !== undefined && (
          <div className="text-xs text-gray-400 mt-1 pt-1 border-t border-gray-200">
            <span className="text-amber-600 font-medium">{monthly}</span> ce mois
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
  totalProducts: number;
  lastAwinSync?: string | null;
}

export default function GlobalStats({
  totalArticles, totalTasks, totalTokens, securityAlerts,
  monthlyArticles, monthlyTasks, monthlyTokens, monthlySecurityAlerts,
  totalProducts, lastAwinSync,
}: GlobalStatsProps) {
  const fmt = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
    return String(n);
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      <StatItem icon={<BookOpen size={22} strokeWidth={1.5} className="text-purple-600" />} label="Articles publiés" value={totalArticles} sub="par Marie" monthly={monthlyArticles} />
      <StatItem icon={<Zap size={22} strokeWidth={1.5} className="text-amber-600" />} label="Tâches exécutées" value={totalTasks} sub="tous agents" monthly={monthlyTasks} />
      <StatItem icon={<Brain size={22} strokeWidth={1.5} className="text-cyan-600" />} label="Tokens utilisés" value={fmt(totalTokens)} sub="API Anthropic" monthly={fmt(monthlyTokens)} />
      <StatItem
        icon={<Shield size={22} strokeWidth={1.5} className="text-red-500" />}
        label="Alertes sécurité"
        value={securityAlerts}
        sub={securityAlerts > 0 ? 'voir Nathalie' : 'aucune menace'}
        monthly={monthlySecurityAlerts}
      />
      <StatItem
        icon={<span className="text-green-600 text-xl">🛒</span>}
        label="Articles boutique"
        value={totalProducts}
        sub={
          <>
            <span>produits en stock</span>
            {lastAwinSync && (
              <div className="text-xs text-gray-400 mt-1 pt-1 border-t border-gray-200">
                Dernier sync : {new Date(lastAwinSync).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
              </div>
            )}
          </>
        }
      />
    </div>
  );
}
