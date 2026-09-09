import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { randomUUID } from 'crypto';
import { createAdminClient } from '@/lib/supabase/server';
import { checkRateLimit, getClientIP } from '@/lib/rateLimit';
import { sendEmail } from '@/lib/resend';
import { emailWrapper } from '@/lib/cron-email';
import { isSameOriginRequest } from '@/lib/security';

export const runtime = 'nodejs';
export const maxDuration = 60;

const MAX_PHOTO_SIZE = 5 * 1024 * 1024; // 5 Mo

export async function POST(req: NextRequest) {
  if (!isSameOriginRequest(req)) return NextResponse.json({ error: 'Origine invalide' }, { status: 403 });
  const ip = getClientIP(req);
  const { allowed } = await checkRateLimit(`adoption:${ip}`, 3_600_000, 5);

  if (!allowed) {
    return NextResponse.json({ error: 'Trop de soumissions. Réessayez dans 1h.' }, { status: 429 });
  }

  try {
    const formData = await req.formData();
    const get = (k: string) => (formData.get(k) as string | null) ?? '';
    const poster_name = get('poster_name');
    const email = get('email');
    const animal_type = get('animal_type');
    const breed = get('breed');
    const age = get('age');
    const gender = get('gender');
    const region = get('region');
    const description = get('description');
    const reason = get('reason');
    const contact_phone = get('contact_phone');
    const photos = formData.getAll('photos').filter((p): p is File => p instanceof File);

    // ── Validation des champs texte (AVANT tout upload) ───────────────────────
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

    // ── Validation des photos (AVANT upload) ──────────────────────────────────
    if (photos.length < 2)
      return NextResponse.json({ error: 'Minimum 2 photos requises' }, { status: 400 });
    if (photos.length > 5)
      return NextResponse.json({ error: '5 photos maximum' }, { status: 400 });
    for (const file of photos) {
      if (!file.type.startsWith('image/'))
        return NextResponse.json({ error: 'Seules les images sont acceptées' }, { status: 400 });
      if (file.size > MAX_PHOTO_SIZE)
        return NextResponse.json({ error: 'Une photo dépasse 5 Mo' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // ── Upload des photos UNIQUEMENT après validation complète ────────────────
    // (conversion JPEG + auto-rotation EXIF + redimensionnement). Si quoi que ce
    // soit échoue ensuite, on supprime les fichiers déjà uploadés (rollback) →
    // plus aucune photo orpheline possible.
    const uploadedPaths: string[] = [];
    const photoUrls: string[] = [];
    try {
      for (const file of photos) {
        const original = Buffer.from(await file.arrayBuffer());
        let buffer: Buffer = original;
        let contentType = file.type;
        let ext = (file.name.split('.').pop() ?? 'jpg').toLowerCase();
        try {
          buffer = await sharp(original)
            .rotate()
            .resize(1600, 1600, { fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 82, progressive: true })
            .toBuffer();
          contentType = 'image/jpeg';
          ext = 'jpg';
        } catch {
          // format exotique non décodable par sharp : on garde l'original
        }

        const path = `${randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from('adoption-photos')
          .upload(path, buffer, { contentType, upsert: false });
        if (upErr) throw upErr;

        uploadedPaths.push(path);
        const { data: { publicUrl } } = supabase.storage.from('adoption-photos').getPublicUrl(path);
        photoUrls.push(publicUrl);
      }
    } catch (upErr) {
      if (uploadedPaths.length) await supabase.storage.from('adoption-photos').remove(uploadedPaths);
      console.error('[adoption:submit] upload error:', upErr);
      return NextResponse.json({ error: "Erreur lors de l'upload des photos" }, { status: 500 });
    }

    // ── Insertion de l'annonce ────────────────────────────────────────────────
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
      photo_urls: photoUrls,
    });

    if (error) {
      // Rollback : l'annonce n'a pas été créée → on retire les photos uploadées
      await supabase.storage.from('adoption-photos').remove(uploadedPaths);
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
        html: emailWrapper('Annonce bien reçue !', `
          <p>Bonjour <strong>${cleanName}</strong>,</p>
          <p>Votre annonce d'adoption pour votre <strong>${animal_type}</strong> (${region.trim()}) a bien été soumise.</p>
          <p>Elle sera vérifiée par notre équipe et publiée dès validation si elle respecte nos conditions.</p>
          <p style="color:#6b7280;font-size:13px">Si vous avez des questions, contactez-nous à <a href="mailto:contact@mespoilus.com" style="color:#ea580c">contact@mespoilus.com</a>.</p>
        `),
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
            <h2 style="color:#ea580c">Nouvelle annonce à modérer</h2>
            <p><strong>Déposant :</strong> ${cleanName} (${cleanEmail})</p>
            <p><strong>Animal :</strong> ${animal_type}${breed ? ` · ${breed}` : ''}${age ? ` · ${age}` : ''}</p>
            <p><strong>Région :</strong> ${region.trim()}</p>
            <p><strong>Description :</strong> ${description.trim()}</p>
            <p><a href="https://mespoilus.com/adoption-admin" style="color:#ea580c">→ Accéder à la modération</a></p>
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
