import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { executeAgentTask } from '@/lib/agents/runner';
import { checkRateLimit, getClientIP } from '@/lib/rateLimit';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const ip = getClientIP(request);
  const { allowed } = await checkRateLimit(`security:${ip}`, 60_000, 2);

  if (!allowed) {
    return NextResponse.json({ error: 'Trop de requêtes' }, { status: 429 });
  }

  try {
    const supabase = createAdminClient();

    // Récupérer les derniers logs de sécurité
    const { data: logs } = await supabase
      .from('security_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    const { data: blockedIPs } = await supabase
      .from('blocked_ips')
      .select('*')
      .order('blocked_at', { ascending: false })
      .limit(20);

    // Nathalie analyse les logs
    const logsummary = logs
      ? logs
          .map(
            (l) =>
              `- IP: ${l.ip_address ?? 'inconnue'} | Endpoint: ${l.endpoint ?? '?'} | Niveau: ${l.threat_level} | Type: ${l.threat_type ?? 'N/A'} | Bloqué: ${l.blocked}`
          )
          .join('\n')
      : 'Aucun log disponible';

    const task = `Analyse ces logs de sécurité récents de Mes Poilus :

LOGS SÉCURITÉ (50 derniers) :
${logsummary}

IPs BLOQUÉES ACTUELLEMENT : ${blockedIPs?.length ?? 0}
${blockedIPs?.map((b) => `- ${b.ip_address}: ${b.reason ?? 'Raison inconnue'}`).join('\n') ?? ''}

Génère un rapport de sécurité complet avec :
1. Score de sécurité global (sur 100)
2. Analyse des menaces détectées
3. Statistiques (par type d'attaque, par niveau)
4. Recommandations prioritaires
5. État du blocage des IPs`;

    const result = await executeAgentTask('nathalie', task);

    return NextResponse.json({
      success: result.success,
      report: result.content,
      stats: {
        total_logs: logs?.length ?? 0,
        blocked_ips: blockedIPs?.length ?? 0,
        high_threats: logs?.filter((l) => ['high', 'critical'].includes(l.threat_level)).length ?? 0,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur interne';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
