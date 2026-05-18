import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/resend';

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
        subject: `Votre annonce d'adoption a expiré — Mes Poilus`,
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#111">
            <h2 style="color:#6b7280">Annonce expirée</h2>
            <p>Bonjour <strong>${post.poster_name}</strong>,</p>
            <p>Votre annonce d'adoption pour votre <strong>${post.animal_type}</strong> (${post.region}) a été automatiquement supprimée après <strong>${EXPIRY_DAYS} jours</strong> en ligne.</p>
            <p>Si votre animal n'a toujours pas trouvé de foyer, vous pouvez déposer une nouvelle annonce gratuitement :</p>
            <div style="text-align:center;margin:24px 0">
              <a href="${BASE_URL}/adoption/deposer" style="display:inline-block;background:#f97316;color:#fff;font-weight:600;font-size:14px;padding:11px 24px;border-radius:10px;text-decoration:none">
                Déposer une nouvelle annonce
              </a>
            </div>
            <p style="font-size:13px;color:#6b7280">Merci d'utiliser Mes Poilus pour aider vos animaux à trouver un foyer aimant. 🐾</p>
            <p>-L'équipe Mes Poilus</p>
          </div>
        `,
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

  if (deleted > 0) {
    await supabase.from('activity_logs').insert({
      agent_id: 'thomas', agent_name: 'Thomas',
      action: `[Adoption cleanup] ${deleted} annonce${deleted > 1 ? 's' : ''} expirée${deleted > 1 ? 's' : ''} supprimée${deleted > 1 ? 's' : ''} (${EXPIRY_DAYS}j)`,
      details: failed > 0 ? { failed } : {},
      status: 'success',
    });
  }

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
