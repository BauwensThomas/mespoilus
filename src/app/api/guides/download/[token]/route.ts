import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.mespoilus.com';

function htmlPage(title: string, message: string, linkLabel?: string, linkHref?: string) {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} — Mes Poilus</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f9fafb; color: #111827; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 24px; }
    .card { background: white; border: 1px solid #e5e7eb; border-radius: 16px; padding: 40px 32px; max-width: 480px; width: 100%; text-align: center; box-shadow: 0 4px 24px rgba(0,0,0,0.06); }
    .icon { width: 56px; height: 56px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; font-size: 28px; }
    h1 { font-size: 22px; font-weight: 700; margin-bottom: 12px; }
    p { font-size: 15px; color: #6b7280; line-height: 1.6; }
    a.btn { display: inline-block; margin-top: 24px; background: #ea580c; color: white; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-weight: 600; font-size: 14px; transition: background 0.2s; }
    a.btn:hover { background: #c2410c; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${title}</h1>
    <p>${message}</p>
    ${linkLabel && linkHref ? `<a href="${linkHref}" class="btn">${linkLabel}</a>` : ''}
  </div>
</body>
</html>`;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { token: string } }
) {
  const { token } = params;

  if (!token) {
    return new NextResponse(
      htmlPage('Lien invalide', 'Ce lien de téléchargement est invalide.', 'Retour au site', `${APP_URL}/guides`),
      { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }

  const supabase = createAdminClient();

  // 1. Find download record joining guide
  const { data: download, error } = await supabase
    .from('pdf_downloads')
    .select('id, expires_at, downloaded_at, guide_id, pdf_guides(file_path, title)')
    .eq('token', token)
    .maybeSingle();

  if (error || !download) {
    return new NextResponse(
      htmlPage('Lien invalide', 'Ce lien de téléchargement est invalide ou a déjà été utilisé.', 'Retour aux guides', `${APP_URL}/guides`),
      { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }

  // 2. Check expiry using SQL-comparable ISO string comparison
  const now = new Date().toISOString();
  if (download.expires_at < now) {
    return new NextResponse(
      htmlPage(
        'Lien expiré',
        'Ce lien de téléchargement a expiré. Retournez sur le site pour en demander un nouveau.',
        'Demander un nouveau lien',
        `${APP_URL}/guides`
      ),
      { status: 410, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }

  // 3. Get file_path from joined guide
  const guide = Array.isArray(download.pdf_guides)
    ? download.pdf_guides[0]
    : download.pdf_guides;

  if (!guide?.file_path) {
    return new NextResponse(
      htmlPage('Fichier introuvable', 'Le fichier PDF est temporairement indisponible. Veuillez nous contacter.', 'Retour aux guides', `${APP_URL}/guides`),
      { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }

  // 4. Generate Supabase Storage signed URL (60 seconds)
  const { data: signedData, error: signedError } = await supabase.storage
    .from('pdf-guides')
    .createSignedUrl(guide.file_path, 60);

  if (signedError || !signedData?.signedUrl) {
    console.error('[guides/download] signed URL error:', signedError);
    return new NextResponse(
      htmlPage('Erreur serveur', 'Impossible de générer le lien de téléchargement. Veuillez réessayer.', 'Retour aux guides', `${APP_URL}/guides`),
      { status: 500, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }

  // 5. Mark as downloaded (only if first time)
  if (!download.downloaded_at) {
    await supabase
      .from('pdf_downloads')
      .update({ downloaded_at: new Date().toISOString() })
      .eq('id', download.id);
  }

  // 6. Redirect to signed URL
  return NextResponse.redirect(signedData.signedUrl);
}
