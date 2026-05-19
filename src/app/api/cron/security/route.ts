import { NextResponse } from 'next/server';
import { executeAgentTask } from '@/lib/agents/runner';
import { createAdminClient } from '@/lib/supabase/server';
import { buildEnrichedPrompt } from '@/lib/agents/context';
import { sendEmail } from '@/lib/resend';

export const runtime = 'nodejs';
export const maxDuration = 120;

async function logActivity(
  agentId: string, agentName: string, action: string,
  status: 'success' | 'error', durationMs: number,
  details: Record<string, unknown> = {},
  tokensUsed = 0
) {
  try {
    const supabase = createAdminClient();
    await supabase.from('activity_logs').insert({ agent_id: agentId, agent_name: agentName, action, status, duration_ms: durationMs, details, tokens_used: tokensUsed });
  } catch { /* non-bloquant */ }
}

function mdToHtml(md: string): string {
  return md
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/^#### (.+)$/gm, '<h4 style="color:#374151;font-size:13px;font-weight:700;margin:14px 0 4px">$1</h4>')
    .replace(/^### (.+)$/gm, '<h3 style="color:#1f2937;font-size:14px;font-weight:700;margin:18px 0 6px">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 style="color:#111827;font-size:16px;font-weight:700;margin:22px 0 8px;padding-bottom:4px;border-bottom:1px solid #e5e7eb">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 style="color:#111827;font-size:18px;font-weight:700;margin:20px 0 8px">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<li style="margin:3px 0;color:#374151">$1</li>')
    .replace(/(<li[^>]*>[\s\S]*?<\/li>\n?)+/g, (m) => `<ul style="padding-left:20px;margin:8px 0">${m}</ul>`)
    .replace(/\n\n/g, '<br><br>')
    .replace(/\n/g, '<br>');
}

function buildAuditEmail(
  date: string,
  nathalieContent: string | null,
  maximeContent: string | null,
  errors: string[]
): string {
  const nathalieSection = nathalieContent
    ? `<div style="margin-bottom:32px">
        <div style="background:#fef2f2;border-left:4px solid #dc2626;padding:12px 16px;margin-bottom:16px;border-radius:0 8px 8px 0">
          <p style="font-size:14px;font-weight:700;color:#dc2626;margin:0">Nathalie — Audit Securite</p>
        </div>
        <div style="font-size:13px;line-height:1.7;color:#374151">${mdToHtml(nathalieContent)}</div>
      </div>`
    : `<div style="margin-bottom:32px;padding:16px;background:#fef2f2;border-radius:8px;color:#dc2626;font-size:13px">
        Nathalie n'a pas pu effectuer l'audit : ${errors.find(e => e.startsWith('Nathalie')) ?? 'erreur inconnue'}
      </div>`;

  const maximeSection = maximeContent
    ? `<div style="margin-bottom:32px">
        <div style="background:#ecfdf5;border-left:4px solid #059669;padding:12px 16px;margin-bottom:16px;border-radius:0 8px 8px 0">
          <p style="font-size:14px;font-weight:700;color:#059669;margin:0">Maxime — Audit Technique</p>
        </div>
        <div style="font-size:13px;line-height:1.7;color:#374151">${mdToHtml(maximeContent)}</div>
      </div>`
    : `<div style="margin-bottom:32px;padding:16px;background:#fef2f2;border-radius:8px;color:#dc2626;font-size:13px">
        Maxime n'a pas pu effectuer l'audit : ${errors.find(e => e.startsWith('Maxime')) ?? 'erreur inconnue'}
      </div>`;

  return `
    <div style="font-family:sans-serif;max-width:720px;margin:0 auto;color:#111;background:#f9fafb;padding:24px">
      <div style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.08)">
        <div style="background:linear-gradient(135deg,#ea580c,#111827);padding:20px 24px">
          <p style="color:#fff;font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;margin:0 0 4px">Audit mensuel automatique</p>
          <h1 style="color:#fff;font-size:20px;font-weight:700;margin:0">Securite &amp; Maintenance — ${date}</h1>
        </div>
        <div style="padding:24px 28px">
          ${nathalieSection}
          ${maximeSection}
        </div>
        <div style="padding:14px 24px;border-top:1px solid #f3f4f6;text-align:center">
          <p style="font-size:11px;color:#9ca3af;margin:0">Mes Poilus — audit automatique du 1er de chaque mois</p>
        </div>
      </div>
    </div>`;
}

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const globalStart = Date.now();
  const supabase = createAdminClient();
  const errors: string[] = [];
  let nathalieContent: string | null = null;
  let maximeContent: string | null = null;

  // ── Nathalie : audit de sécurité ─────────────────────────────────────────
  try {
    const nathaliePrompt = await buildEnrichedPrompt(
      'nathalie',
      'Effectue un audit de sécurité complet de l\'application. Analyse les incidents récents, évalue le niveau de risque global et donne les 5 actions prioritaires à entreprendre.',
      supabase
    );
    const nathalieResult = await executeAgentTask('nathalie', nathaliePrompt);
    if (!nathalieResult.success) throw new Error(nathalieResult.error ?? 'Nathalie a échoué');
    nathalieContent = nathalieResult.content;
    await logActivity('thomas', 'Thomas', 'Cron sécurité : audit Nathalie terminé', 'success', nathalieResult.duration_ms ?? 0, {}, nathalieResult.tokens_used ?? 0);
    console.log('[Cron Security] Nathalie OK');
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erreur inconnue';
    errors.push(`Nathalie: ${msg}`);
    await logActivity('thomas', 'Thomas', `Cron sécurité erreur Nathalie: ${msg}`, 'error', 0);
    console.error('[Cron Security] Nathalie erreur:', msg);
  }

  // ── Maxime : audit technique ──────────────────────────────────────────────
  try {
    const maximePrompt = await buildEnrichedPrompt(
      'maxime',
      'Effectue un audit technique complet de l\'application. Analyse les erreurs dans les logs, identifie les problèmes de performance et propose les corrections prioritaires.',
      supabase
    );
    const maximeResult = await executeAgentTask('maxime', maximePrompt);
    if (!maximeResult.success) throw new Error(maximeResult.error ?? 'Maxime a échoué');
    maximeContent = maximeResult.content;
    await logActivity('thomas', 'Thomas', 'Cron sécurité : audit Maxime terminé', 'success', maximeResult.duration_ms ?? 0, {}, maximeResult.tokens_used ?? 0);
    console.log('[Cron Security] Maxime OK');
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erreur inconnue';
    errors.push(`Maxime: ${msg}`);
    await logActivity('thomas', 'Thomas', `Cron sécurité erreur Maxime: ${msg}`, 'error', 0);
    console.error('[Cron Security] Maxime erreur:', msg);
  }

  // ── Email récapitulatif ───────────────────────────────────────────────────
  const date = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  try {
    await sendEmail({
      to: 'contact@mespoilus.com',
      subject: `[Mes Poilus] Audit Securite & Maintenance — ${date}${errors.length ? ` (${errors.length} erreur${errors.length > 1 ? 's' : ''})` : ''}`,
      html: buildAuditEmail(date, nathalieContent, maximeContent, errors),
    });
    console.log('[Cron Security] Email audit envoye');
  } catch (err) {
    console.error('[Cron Security] Erreur envoi email:', err instanceof Error ? err.message : err);
  }

  const totalDuration = Date.now() - globalStart;
  console.log(`[Cron Security] Terminé en ${totalDuration}ms`);

  return NextResponse.json({
    success: errors.length === 0,
    duration_ms: totalDuration,
    ...(errors.length ? { errors } : {}),
  });
}
