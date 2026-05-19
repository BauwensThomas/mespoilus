import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { checkRateLimit, getClientIP } from '@/lib/rateLimit';
import { sendEmail } from '@/lib/resend';

export async function POST(req: NextRequest) {
  const ip = getClientIP(req);
  const { allowed } = await checkRateLimit(`adoption:${ip}`, 3_600_000, 5);

  if (!allowed) {
    return NextResponse.json({ error: 'Trop de soumissions. Réessayez dans 1h.' }, { status: 429 });
  }

  try {
    const { poster_name, email, animal_type, breed, age, gender, region, description, reason, contact_phone, photo_urls } =
      await req.json();

    if (!poster_name?.trim())
      return NextResponse.json({ error: 'Prénom requis' }, { status: 400 });
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return NextResponse.json({ error: 'Email invalide' }, { status: 400 });
    if (!animal_type)
      return NextResponse.json({ error: "Type d'animal requis" }, { status: 400 });
    if (!region?.trim())
      return NextResponse.json({ error: 'Région requise' }, { status: 400 });
    if (!age || !/^\d{1,2} (mois|ans)$/.test(age.trim()) || parseInt(age) < 1 || parseInt(age) > 99)
      return NextResponse.json({ error: 'Âge invalide (1–99 mois ou ans)' }, { status: 400 });
    if (!description?.trim() || description.trim().length < 20)
      return NextResponse.json({ error: 'Description trop courte (min. 20 caractères)' }, { status: 400 });
    if (!reason?.trim() || reason.trim().length < 10)
      return NextResponse.json({ error: 'Raison du don requise (min. 10 caractères)' }, { status: 400 });
    if (!contact_phone?.trim())
      return NextResponse.json({ error: 'Numéro de téléphone requis' }, { status: 400 });
    if (!Array.isArray(photo_urls) || photo_urls.length < 2)
      return NextResponse.json({ error: 'Minimum 2 photos requises' }, { status: 400 });
    if (photo_urls.length > 5)
      return NextResponse.json({ error: '5 photos maximum' }, { status: 400 });

    const supabase = createAdminClient();
    const { error } = await supabase.from('adoption_posts').insert({
      poster_name: poster_name.trim(),
      email: email.toLowerCase().trim(),
      animal_type,
      breed: breed?.trim() || null,
      age: age?.trim() || null,
      gender: gender || 'inconnu',
      region: region.trim(),
      description: description.trim(),
      reason: reason.trim(),
      contact_info: contact_phone?.trim() || null,
      photo_urls,
    });

    if (error) {
      console.error('[adoption:submit]', error);
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }

    const cleanEmail  = email.toLowerCase().trim();
    const cleanName   = poster_name.trim();

    // Email de confirmation au déposant
    try {
      await sendEmail({
        to: cleanEmail,
        subject: "Votre annonce d'adoption est en cours de validation",
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#111">
            <h2 style="color:#f59e0b">Annonce bien reçue !</h2>
            <p>Bonjour <strong>${cleanName}</strong>,</p>
            <p>Votre annonce d'adoption pour votre <strong>${animal_type}</strong> (${region.trim()}) a bien été soumise.</p>
            <p>Elle sera vérifiée par notre équipe et publiée dès validation si elle respecte nos conditions.</p>
            <p style="color:#6b7280;font-size:13px">Si vous avez des questions, contactez-nous à <a href="mailto:contact@mespoilus.com" style="color:#f59e0b">contact@mespoilus.com</a>.</p>
            <p>-L'équipe Mes Poilus 🐾</p>
          </div>
        `,
      });
    } catch (mailErr) {
      console.error('[adoption:submit] mail confirmation error:', mailErr);
    }

    // Notification à l'admin
    try {
      await sendEmail({
        to: 'contact@mespoilus.com',
        subject: `Nouvelle annonce d'adoption à vérifier -${animal_type} (${region.trim()})`,
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#111">
            <h2 style="color:#f59e0b">Nouvelle annonce à modérer</h2>
            <p><strong>Déposant :</strong> ${cleanName} (${cleanEmail})</p>
            <p><strong>Animal :</strong> ${animal_type}${breed ? ` · ${breed}` : ''}${age ? ` · ${age}` : ''}</p>
            <p><strong>Région :</strong> ${region.trim()}</p>
            <p><strong>Description :</strong> ${description.trim()}</p>
            <p><a href="https://mespoilus.com/adoption-admin" style="color:#f59e0b">→ Accéder à la modération</a></p>
          </div>
        `,
      });
    } catch (mailErr) {
      console.error('[adoption:submit] mail admin error:', mailErr);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[adoption:submit] Exception:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
