import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/resend';

export const maxDuration = 60;

const BASE_URL = 'https://www.mespoilus.com';

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const sixDaysAgo   = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString();

  // Annonces approuvées depuis +7 jours, jamais relancées OU relancées il y a +6 jours
  const { data: posts, error } = await supabase
    .from('adoption_posts')
    .select('id, poster_name, email, animal_type, region, delete_token')
    .eq('status', 'approved')
    .lte('created_at', sevenDaysAgo)
    .or(`followup_sent_at.is.null,followup_sent_at.lte.${sixDaysAgo}`);

  if (error) {
    console.error('[adoption-followup] query error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let sent = 0;
  let failed = 0;

  for (const post of posts ?? []) {
    if (!post.delete_token) continue;

    const deleteUrl = `${BASE_URL}/adoption/supprimer?id=${post.id}&token=${post.delete_token}`;

    try {
      await sendEmail({
        to: post.email,
        subject: `Votre ${post.animal_type} a-t-il trouvé un foyer ? 🐾`,
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#111">
            <h2 style="color:#f97316">Bonne nouvelle ?</h2>
            <p>Bonjour <strong>${post.poster_name}</strong>,</p>
            <p>Votre annonce d'adoption pour votre <strong>${post.animal_type}</strong> (${post.region}) est en ligne depuis plus d'une semaine.</p>
            <p>Votre animal a-t-il trouvé un foyer ? Si c'est le cas, pensez à supprimer votre annonce !</p>
            <div style="text-align:center;margin:28px 0">
              <a href="${deleteUrl}" style="display:inline-block;background:#ef4444;color:#fff;font-weight:600;font-size:15px;padding:12px 28px;border-radius:10px;text-decoration:none">
                ✓ Oui, supprimer mon annonce
              </a>
            </div>
            <p style="font-size:13px;color:#6b7280">Si votre animal n'a pas encore trouvé de famille, ne faites rien — votre annonce reste visible.</p>
            <p>-L'équipe Mes Poilus 🐾</p>
          </div>
        `,
      });

      await supabase
        .from('adoption_posts')
        .update({ followup_sent_at: new Date().toISOString() })
        .eq('id', post.id);

      sent++;
    } catch (mailErr) {
      console.error(`[adoption-followup] mail error for ${post.id}:`, mailErr);
      failed++;
    }
  }

  await supabase.from('activity_logs').insert({
    agent_id: 'thomas', agent_name: 'Thomas',
    action: sent > 0
      ? `[Adoption followup] ${sent} email${sent > 1 ? 's' : ''} de relance envoye${sent > 1 ? 's' : ''} (annonces +7j)`
      : `[Adoption followup] Aucune annonce a relancer`,
    details: { sent, failed, total: posts?.length ?? 0 },
    status: 'success',
  });

  return NextResponse.json({ success: true, sent, failed, total: posts?.length ?? 0 });
}
