import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createAdminClient } from '@/lib/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  const { grilleId, prenom, email, nbPixels, newsletter } = await req.json();

  if (!grilleId || !prenom || !email || !nbPixels || nbPixels < 5) {
    return NextResponse.json({ error: 'Paramètres invalides' }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: grille } = await supabase
    .from('pixel_grilles')
    .select('id, statut, grille_taille')
    .eq('id', grilleId)
    .eq('statut', 'active')
    .single();

  if (!grille) {
    return NextResponse.json({ error: 'Grille introuvable ou inactive' }, { status: 404 });
  }

  const totalPixels = grille.grille_taille * grille.grille_taille;
  const { count } = await supabase
    .from('pixel_achats')
    .select('id', { count: 'exact', head: true })
    .eq('grille_id', grilleId)
    .not('confirmed_at', 'is', null);

  const pixelsRestants = totalPixels - (count ?? 0);
  const pixelsAcheter = Math.min(nbPixels, pixelsRestants);

  if (pixelsAcheter <= 0) {
    return NextResponse.json({ error: 'Grille complète' }, { status: 400 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: 'eur',
          unit_amount: pixelsAcheter * 100,
          product_data: {
            name: `${pixelsAcheter} pixels - Grille Mystère`,
            description: 'Révèle des pixels et tente de deviner la race cachée.',
          },
        },
        quantity: 1,
      },
    ],
    customer_email: email,
    metadata: {
      grille_id: grilleId,
      prenom,
      email,
      nb_pixels: String(pixelsAcheter),
      newsletter: newsletter ? 'true' : 'false',
    },
    success_url: `${baseUrl}/grille/confirmation?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/grille`,
    locale: 'fr',
  });

  return NextResponse.json({ url: session.url });
}
