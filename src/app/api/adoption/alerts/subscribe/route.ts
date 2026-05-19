import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/resend';
import { checkRateLimit, getClientIP } from '@/lib/rateLimit';

const ANIMAL_LABELS: Record<string, string> = {
  tous:    'Tous les animaux',
  chien:   'Chiens',
  chat:    'Chats',
  oiseau:  'Oiseaux',
  rongeur: 'Rongeurs',
  reptile: 'Reptiles',
};

export async function POST(req: NextRequest) {
  const ip = getClientIP(req);
  const { allowed } = await checkRateLimit(`alert-sub:${ip}`, 3_600_000, 5);
  if (!allowed) return NextResponse.json({ error: 'Trop de tentatives, réessayez dans 1h.' }, { status: 429 });

  const { email, animal = 'tous', country = 'tous' } = await req.json();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return NextResponse.json({ error: 'Email invalide.' }, { status: 400 });

  const normalizedEmail = email.toLowerCase().trim();
  const supabase = createAdminClient();

  // Si déjà confirmé pour ces mêmes critères → ne pas écraser
  const { data: existing } = await supabase
    .from('adoption_alerts')
    .select('confirmed')
    .eq('email', normalizedEmail)
    .eq('animal', animal)
    .eq('country', country)
    .single();

  if (existing?.confirmed) {
    return NextResponse.json({ success: true, already: true });
  }

  // Nouveau ou en attente de confirmation → upsert + nouvel email
  const confirm_token = crypto.randomUUID();
  const { error } = await supabase.from('adoption_alerts').upsert({
    email: normalizedEmail,
    animal,
    country,
    confirmed: false,
    confirm_token,
  }, { onConflict: 'email,animal,country' });

  if (error) return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://mespoilus.com';
  const confirmUrl    = `${appUrl}/api/adoption/alerts/confirm?token=${confirm_token}`;
  const unsubscribeUrl = `${appUrl}/api/adoption/alerts/unsubscribe?token=${confirm_token}`;
  const animalLabel = ANIMAL_LABELS[animal] ?? animal;
  const countryLabel = country === 'tous' ? 'Tous les pays' : country;

  try {
    await sendEmail({
      to: normalizedEmail,
      subject: 'Confirmez votre alerte adoption - Mes Poilus',
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#111827">
          <h2 style="color:#f97316;margin-bottom:8px">Confirmez votre alerte adoption</h2>
          <p>Vous avez demandé a etre alerte pour :</p>
          <ul style="margin:8px 0 16px;padding-left:20px">
            <li><strong>Animal :</strong> ${animalLabel}</li>
            <li><strong>Pays :</strong> ${countryLabel}</li>
          </ul>
          <p>Cliquez ci-dessous pour activer vos alertes :</p>
          <p style="text-align:center;margin:28px 0">
            <a href="${confirmUrl}" style="background:#f97316;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;font-size:15px">
              Confirmer mes alertes
            </a>
          </p>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0">
          <p style="font-size:11px;color:#9ca3af;text-align:center">
            Si vous n'avez pas demande cette alerte, ignorez cet email.<br>
            <a href="${unsubscribeUrl}" style="color:#9ca3af">Se desinscrire</a>
          </p>
          <p>L'equipe Mes Poilus</p>
        </div>
      `,
    });
  } catch (e) {
    console.error('[adoption-alerts] email confirmation error:', e);
  }

  return NextResponse.json({ success: true });
}
