import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createAdminClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/resend';
import { cronEmailWrapper, statsRow, errorBlock } from '@/lib/cron-email';

export const runtime = 'nodejs';
export const maxDuration = 300;

const ANIMALS = ['chien', 'chat', 'lapin', 'oiseau', 'rongeur'] as const;
const STYLES = ['Mignon', 'Classique', 'Nature', 'Rigolo'] as const;

const ANIMAL_LABELS: Record<string, string> = {
  chien: 'chien',
  chat: 'chat',
  lapin: 'lapin',
  oiseau: 'oiseau (perruche, perroquet, canari...)',
  rongeur: 'rongeur (hamster, cochon d\'Inde, gerbille...)',
};

async function logActivity(
  status: 'success' | 'error',
  durationMs: number,
  details: Record<string, unknown>,
  tokensUsed: number
) {
  try {
    const supabase = createAdminClient();
    await supabase.from('activity_logs').insert({
      agent_id: 'thomas',
      agent_name: 'Thomas',
      action: 'Cron prénoms : génération mensuelle',
      status,
      duration_ms: durationMs,
      details,
      tokens_used: tokensUsed,
    });
  } catch { /* non-bloquant */ }
}

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const globalStart = Date.now();
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const supabase = createAdminClient();
  const results: Record<string, number> = {};
  let totalTokens = 0;
  const errors: string[] = [];

  for (const animal of ANIMALS) {
    try {
      const response = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1500,
        messages: [{
          role: 'user',
          content: `Génère exactement 50 prénoms originaux et tendance pour un ${ANIMAL_LABELS[animal]} domestique, répartis en 4 styles (environ 12-13 par style) :
- Mignon : prénoms doux, tendres, kawaii
- Classique : prénoms courants et intemporels
- Nature : inspirés de la nature, éléments, saisons, astres
- Rigolo : originaux, drôles, décalés

Règles : prénoms courts (1-2 mots max), variés, en français principalement, sans doublons entre styles.

Retourne UNIQUEMENT ce JSON valide, sans markdown ni explication :
{"Mignon":["nom1","nom2",...],"Classique":[...],"Nature":[...],"Rigolo":[...]}`,
        }],
      });

      totalTokens += response.usage.input_tokens + response.usage.output_tokens;

      const raw = response.content[0].type === 'text' ? response.content[0].text.trim() : '';
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error(`JSON introuvable dans la réponse pour ${animal}`);

      const parsed: Record<string, string[]> = JSON.parse(jsonMatch[0]);

      const rows = STYLES.map(style => ({
        animal,
        style,
        names: (parsed[style] ?? []).slice(0, 50),
        generated_at: new Date().toISOString(),
      }));

      // Supprimer les anciens prénoms de cet animal puis réinsérer
      const { error: delError } = await supabase.from('prenoms').delete().eq('animal', animal);
      if (delError) throw delError;

      const { error } = await supabase.from('prenoms').insert(rows);
      if (error) throw error;

      results[animal] = rows.reduce((acc, r) => acc + r.names.length, 0);
      console.log(`[Cron Prénoms] ${animal} : ${results[animal]} prénoms sauvegardés`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`${animal}: ${msg}`);
      console.error(`[Cron Prénoms] Erreur ${animal}:`, msg);
    }
  }

  const duration = Date.now() - globalStart;
  const status = errors.length === 0 ? 'success' : 'error';

  await logActivity(status, duration, { results, errors }, totalTokens);

  try {
    const date = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    const totalNames = Object.values(results).reduce((s, n) => s + n, 0);
    const resultsHtml = Object.entries(results)
      .map(([animal, count]) => `<p style="margin:3px 0;font-size:13px">• <strong>${animal}</strong> : ${count} prenoms</p>`)
      .join('');
    const body = statsRow([
      { label: 'Prenoms total', value: totalNames, color: '#8b5cf6' },
      { label: 'Animaux', value: Object.keys(results).length },
      { label: 'Tokens', value: totalTokens.toLocaleString('fr-FR'), color: '#6b7280' },
    ]) +
    `<div style="margin-bottom:16px">${resultsHtml}</div>` +
    errorBlock(errors);

    await sendEmail({
      to: 'contact@mespoilus.com',
      subject: `[Mes Poilus] Prenoms generes - ${totalNames} prenoms`,
      html: cronEmailWrapper(`Prenoms animaux - ${date}`, 'Pipeline Prenoms Thomas', body),
    });
    console.log('[Cron Prenoms] Email notification envoyee');
  } catch (emailErr) {
    console.error('[Cron Prenoms] Email erreur:', emailErr instanceof Error ? emailErr.message : emailErr);
  }

  return NextResponse.json({ success: status === 'success', duration_ms: duration, results, errors, tokens_used: totalTokens });
}
