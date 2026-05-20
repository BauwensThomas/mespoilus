import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/resend';
import { emailWrapper } from '@/lib/cron-email';

export const maxDuration = 60;

const EXPIRY_DAYS = 60;
const BASE_URL = 'https://www.mespoilus.com';

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();

  const expiryDate = new Date(Date.now() - EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { data: posts, error } = await supabase
    .from('adoption_posts')
    .select('id, poster_name, email, animal_type, region')
    .eq('status', 'approved')
    .lte('created_at', expiryDate);

  if (error) {
    console.error('[adoption-cleanup] query error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let deleted = 0;
  let failed = 0;

  for (const post of posts ?? []) {
    try {
      await sendEmail({
        to: post.email,
        subject: `Votre annonce d'adoption a expiré - Mes Poilus`,
        html: emailWrapper("Votre annonce d'adoption a expire", `
          <p>Bonjour <strong>${post.poster_name}</strong>,</p>
          <p>Votre annonce d'adoption pour votre <strong>${post.animal_type}</strong> (${post.region}) a ete automatiquement supprimee apres <strong>${EXPIRY_DAYS} jours</strong> en ligne.</p>
          <p>Si votre animal n'a toujours pas trouve de foyer, vous pouvez deposer une nouvelle annonce gratuitement :</p>
          <div style="text-align:center;margin:24px 0">
            <a href="${BASE_URL}/adoption/deposer" style="display:inline-block;background:#ea580c;color:#fff;font-weight:600;font-size:14px;padding:11px 24px;border-radius:10px;text-decoration:none">Deposer une nouvelle annonce</a>
          </div>
          <p style="font-size:13px;color:#6b7280">Merci d'utiliser Mes Poilus pour aider vos animaux a trouver un foyer aimant.</p>
        `),
      });
    } catch (mailErr) {
      console.error(`[adoption-cleanup] mail error for ${post.id}:`, mailErr);
    }

    const { error: delErr } = await supabase
      .from('adoption_posts')
      .update({
        status:         'deleted',
        deleted_at:     new Date().toISOString(),
        deleted_by:     'cron',
        deleted_reason: 'auto_expired',
        poster_name:    'Anonymisé',
        email:          'supprime@mespoilus.com',
        contact_info:   null,
      })
      .eq('id', post.id);

    if (delErr) {
      console.error(`[adoption-cleanup] delete error for ${post.id}:`, delErr);
      failed++;
    } else {
      deleted++;
    }
  }

  await supabase.from('activity_logs').insert({
    agent_id: 'thomas', agent_name: 'Thomas',
    action: deleted > 0
      ? `[Adoption cleanup] ${deleted} annonce${deleted > 1 ? 's' : ''} expirée${deleted > 1 ? 's' : ''} supprimee${deleted > 1 ? 's' : ''} apres ${EXPIRY_DAYS}j`
      : `[Adoption cleanup] Aucune annonce expiree (seuil ${EXPIRY_DAYS}j)`,
    details: { deleted, failed, total: posts?.length ?? 0 },
    status: 'success',
  });

  // Supprimer les alertes adoption non confirmées depuis plus de 7 jours
  const alertExpiry = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { count: alertsDeleted } = await supabase
    .from('adoption_alerts')
    .delete({ count: 'exact' })
    .eq('confirmed', false)
    .lte('created_at', alertExpiry);

  if (alertsDeleted && alertsDeleted > 0) {
    console.log(`[adoption-cleanup] ${alertsDeleted} alerte(s) non confirmée(s) supprimée(s)`);
  }

  return NextResponse.json({ success: true, deleted, failed, total: posts?.length ?? 0, expiry_days: EXPIRY_DAYS, alerts_cleaned: alertsDeleted ?? 0 });
}
