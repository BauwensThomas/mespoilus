import { createAdminClient } from './supabase/server';

// Patterns de menaces connus
const THREAT_PATTERNS = [
  { pattern: /(\bUNION\b|\bSELECT\b|\bDROP\b|\bINSERT\b|\bDELETE\b|\bUPDATE\b)/i, type: 'SQL Injection', level: 'high' as const },
  { pattern: /<script[\s\S]*?>[\s\S]*?<\/script>/i, type: 'XSS', level: 'high' as const },
  { pattern: /\.\.\//g, type: 'Path Traversal', level: 'medium' as const },
  { pattern: /etc\/passwd|etc\/shadow/i, type: 'LFI', level: 'critical' as const },
  { pattern: /eval\s*\(|exec\s*\(/i, type: 'Code Injection', level: 'critical' as const },
  { pattern: /curl\s+|wget\s+/i, type: 'SSRF Attempt', level: 'medium' as const },
  { pattern: /\bphpinfo\b|\bshell_exec\b/i, type: 'PHP Injection', level: 'high' as const },
];

export interface ThreatAnalysis {
  isThreat: boolean;
  threatType: string | null;
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  details: string;
}

export function analyzeThreat(input: string): ThreatAnalysis {
  for (const { pattern, type, level } of THREAT_PATTERNS) {
    if (pattern.test(input)) {
      return {
        isThreat: true,
        threatType: type,
        threatLevel: level,
        details: `Pattern détecté: ${type}`,
      };
    }
  }
  return { isThreat: false, threatType: null, threatLevel: 'low', details: 'Aucune menace détectée' };
}

export async function logSecurityEvent(event: {
  ip: string;
  userAgent: string;
  endpoint: string;
  method: string;
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  threatType: string | null;
  actionTaken: string;
  blocked: boolean;
  details: Record<string, unknown>;
}) {
  try {
    const supabase = createAdminClient();
    await supabase.from('security_logs').insert({
      ip_address: event.ip,
      user_agent: event.userAgent,
      endpoint: event.endpoint,
      method: event.method,
      threat_level: event.threatLevel,
      threat_type: event.threatType,
      action_taken: event.actionTaken,
      blocked: event.blocked,
      details: event.details,
    });
  } catch {
    // Silently fail to avoid breaking the main request flow
  }
}

export async function isIPBlocked(ip: string): Promise<boolean> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from('blocked_ips')
      .select('id, expires_at, is_permanent')
      .eq('ip_address', ip)
      .single();

    if (!data) return false;
    if (data.is_permanent) return true;
    if (data.expires_at && new Date(data.expires_at) > new Date()) return true;

    return false;
  } catch {
    return false;
  }
}

export async function blockIP(ip: string, reason: string, permanent = false) {
  try {
    const supabase = createAdminClient();
    const expiresAt = permanent ? null : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    await supabase.from('blocked_ips').upsert({
      ip_address: ip,
      reason,
      blocked_by: 'nathalie',
      blocked_at: new Date().toISOString(),
      expires_at: expiresAt,
      is_permanent: permanent,
    });
  } catch {
    // Silently fail
  }
}

export function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim()
    .slice(0, 10000);
}
