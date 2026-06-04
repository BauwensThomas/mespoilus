import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createAdminClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/resend';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) return new NextResponse('Signature manquante', { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return new NextResponse('Signature invalide', { status: 400 });
  }

  if (event.type !== 'checkout.session.completed') {
    return new NextResponse('OK', { status: 200 });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  // Sécurité paiement : ne fulfill que si réellement payé. Pour les cartes,
  // 'completed' = payé ; ce garde-fou protège si un moyen de paiement asynchrone
  // (SEPA, virement…) est activé un jour ('completed' pouvant précéder le paiement).
  if (session.payment_status !== 'paid') {
    return new NextResponse('OK', { status: 200 });
  }

  const { grille_id, prenom, email, nb_pixels, newsletter } = session.metadata ?? {};

  if (!grille_id || !prenom || !email || !nb_pixels) {
    return new NextResponse('Metadata manquante', { status: 400 });
  }

  const nbPixels = parseInt(nb_pixels, 10);
  const supabase = createAdminClient();

  // Idempotence - si cet achat existe déjà, on ignore
  const { data: existing } = await supabase
    .from('pixel_achats')
    .select('id')
    .eq('stripe_session_id', session.id)
    .single();

  if (existing) return new NextResponse('OK', { status: 200 });

  const { data: grille } = await supabase
    .from('pixel_grilles')
    .select('id')
    .eq('id', grille_id)
    .single();

  if (!grille) return new NextResponse('Grille introuvable', { status: 404 });

  // Fonction PostgreSQL atomique - évite les race conditions sur les positions.
  // Retourne le nombre de pixels RÉELLEMENT assignés (peut être < payé si la grille
  // s'est remplie entre le checkout et le webhook).
  const { data: assignedRaw, error: rpcError } = await supabase.rpc('assign_pixel_positions', {
    p_grille_id: grille_id,
    p_nb_pixels: nbPixels,
    p_prenom: prenom,
    p_email: email,
    p_montant_cents: nbPixels * 100,
    p_stripe_session_id: session.id,
  });
  if (rpcError) {
    console.error('[grille webhook] assign_pixel_positions échoué:', rpcError.message);
    return new NextResponse('RPC error', { status: 500 }); // Stripe retentera
  }

  // Remboursement partiel si moins de pixels assignés que payés (anti-surfacturation).
  // idempotencyKey basé sur la session → pas de double remboursement si Stripe retente.
  const assigned = typeof assignedRaw === 'number' ? assignedRaw : nbPixels;
  const overpaidPixels = nbPixels - assigned;
  if (overpaidPixels > 0 && session.payment_intent) {
    try {
      await stripe.refunds.create(
        { payment_intent: session.payment_intent as string, amount: overpaidPixels * 100 },
        { idempotencyKey: `grille_refund_${session.id}` }
      );
      console.log(`[grille webhook] ${overpaidPixels} pixel(s) surpayé(s) remboursé(s)`);
    } catch (e) {
      console.error('[grille webhook] remboursement échoué:', e instanceof Error ? e.message : e);
    }
  }

  // Démarre le compte à rebours (90 jours) au PREMIER achat : ne s'applique
  // que si ends_at est encore NULL (condition atomique → un seul déclenchement).
  const startsAt = new Date();
  const endsAt = new Date(startsAt.getTime() + 90 * 86400000);
  await supabase
    .from('pixel_grilles')
    .update({ starts_at: startsAt.toISOString(), ends_at: endsAt.toISOString() })
    .eq('id', grille_id)
    .is('ends_at', null);

  // ── Notification de palier (25/50/75/90 %) à l'admin ───────────────────────
  try {
    const { data: g } = await supabase
      .from('pixel_grilles')
      .select('grille_taille, animal, milestone_notifie')
      .eq('id', grille_id)
      .single();
    if (g) {
      const { data: confs } = await supabase
        .from('pixel_achats')
        .select('positions')
        .eq('grille_id', grille_id)
        .not('confirmed_at', 'is', null);
      const total = g.grille_taille * g.grille_taille;
      const vendus = (confs ?? []).reduce((s, a) => s + (a.positions as number[]).length, 0);
      const pct = (vendus / total) * 100;
      const palier = [90, 75, 50, 25].find(m => pct >= m) ?? 0;
      if (palier > (g.milestone_notifie ?? 0)) {
        // Marque le palier AVANT toute action → anti-doublon même si Stripe retente
        await supabase.from('pixel_grilles').update({ milestone_notifie: palier }).eq('id', grille_id);
        // Email admin
        await sendEmail({
          to: process.env.ADMIN_EMAIL ?? 'contact@mespoilus.com',
          subject: `[Grille] Palier ${palier}% atteint - ${g.animal}`,
          html: `<p>La grille <strong>${g.animal}</strong> vient d'atteindre <strong>${palier}%</strong> de pixels révélés (${vendus}/${total}).</p>`,
        }).catch(() => {});
        // Post automatique sur les réseaux (image actuelle + texte sans indice)
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.mespoilus.com';
        await fetch(`${baseUrl}/api/cron/grille-social`, {
          headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
          cache: 'no-store',
        }).catch(() => {});
      }
    }
  } catch { /* non-bloquant */ }

  // Inscription newsletter si l'acheteur a coché la case (consentement RGPD)
  if (newsletter === 'true') {
    const normalizedEmail = email.toLowerCase().trim();
    const { data: existingSub } = await supabase
      .from('newsletter_subscribers')
      .select('id, status')
      .eq('email', normalizedEmail)
      .single();
    if (!existingSub) {
      await supabase.from('newsletter_subscribers').insert({
        email: normalizedEmail, first_name: prenom, source: 'grille',
      });
    } else if (existingSub.status !== 'active') {
      await supabase.from('newsletter_subscribers')
        .update({ status: 'active', unsubscribed_at: null, updated_at: new Date().toISOString() })
        .eq('id', existingSub.id);
    }
  }

  return new NextResponse('OK', { status: 200 });
}
