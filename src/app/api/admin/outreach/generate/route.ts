import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { runAgent, MODELS } from '@/lib/anthropic';

export const runtime = 'nodejs';

const SITE = 'https://www.mespoilus.com';

// Enveloppe brandée (même style que le modèle "Partenariat général") : on injecte
// uniquement le corps généré par l'IA → HTML toujours valide et cohérent.
function buildEmail(bodyHtml: string, articleTitle: string, articleUrl: string): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="font-family:system-ui,-apple-system,sans-serif;background:#f0f4f8;padding:20px 0">
  <tr><td align="center" style="padding:20px">
    <table width="860" cellpadding="0" cellspacing="0" border="0" style="max-width:860px;width:100%">
      <tr>
        <td bgcolor="#ea580c" style="background-color:#ea580c;padding:32px 40px;border-radius:12px 12px 0 0">
          <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:14px"><tr>
            <td style="vertical-align:middle;padding-right:10px"><img src="${SITE.replace('https://www.', 'https://')}/icon.svg" width="40" height="40" alt="Mes Poilus" style="display:block;border:0"></td>
            <td style="vertical-align:middle"><span style="color:white;font-size:26px;font-weight:800;letter-spacing:-0.5px">Mes Poilus</span></td>
          </tr></table>
          <h1 style="color:white;font-size:21px;font-weight:800;margin:0;line-height:1.3">Nous vous avons mis en avant 🐾</h1>
        </td>
      </tr>
      <tr>
        <td bgcolor="#ffffff" style="background-color:white;padding:36px 40px">
          ${bodyHtml}
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0">
            <tr><td align="center">
              <a href="${articleUrl}" style="display:inline-block;background:#ea580c;color:white;text-decoration:none;font-weight:700;font-size:15px;padding:13px 28px;border-radius:10px">Lire l'article</a>
            </td></tr>
          </table>
          <p style="color:#374151;font-size:15px;line-height:1.8;margin:24px 0 4px">Bien cordialement,</p>
          <p style="color:#374151;font-size:15px;line-height:1.8;margin:0">
            <strong>Thomas</strong><br>Fondateur - Mes Poilus<br>
            <a href="mailto:contact@mespoilus.com" style="color:#ea580c;text-decoration:none">contact@mespoilus.com</a>
          </p>
        </td>
      </tr>
      <tr>
        <td bgcolor="#f3f4f6" style="background-color:#f3f4f6;padding:20px 40px;text-align:center;border-top:2px solid #e5e7eb;border-radius:0 0 12px 12px">
          <p style="color:#6b7280;font-size:12px;margin:0 0 4px">Mes Poilus - <a href="${SITE}" style="color:#6b7280;text-decoration:underline">mespoilus.com</a></p>
          <p style="text-align:center;margin:4px 0 4px">
            <a href="https://www.facebook.com/profile.php?id=61589487954538" style="display:inline-block;margin:0 4px;background:#1877f2;color:#fff;font-size:11px;font-weight:700;padding:4px 12px;border-radius:5px;text-decoration:none">Facebook</a>
            <a href="https://www.instagram.com/mespoilusofficiel/" style="display:inline-block;margin:0 4px;background:#e1306c;color:#fff;font-size:11px;font-weight:700;padding:4px 12px;border-radius:5px;text-decoration:none">Instagram</a>
          </p>
          <p style="color:#9ca3af;font-size:11px;margin:4px 0 0">Article concerné : ${articleTitle}</p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>`;
}

// GET : liste des articles publiés (pour le sélecteur)
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const { data } = await createAdminClient()
    .from('articles')
    .select('slug, title, published_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(100);

  return NextResponse.json({ articles: data ?? [] });
}

// POST { slug } : génère subject + html d'email de prise de contact pour cet article
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const { slug } = await req.json() as { slug: string };
  if (!slug) return NextResponse.json({ error: 'slug requis' }, { status: 400 });

  const { data: article } = await createAdminClient()
    .from('articles')
    .select('title, excerpt, content, slug')
    .eq('slug', slug)
    .maybeSingle();

  if (!article) return NextResponse.json({ error: 'Article introuvable' }, { status: 404 });

  const articleUrl = `${SITE}/blog/${article.slug}`;
  const resume = (article.excerpt || (article.content ?? '').replace(/[#*>\-\[\]()]/g, ' ').slice(0, 400)).trim();

  const system = `Tu es Thomas, fondateur de Mes Poilus (mespoilus.com), un site francophone d'aide aux propriétaires d'animaux.
Tu écris un email de prise de contact à une organisation (refuge, association, marque animalière) que tu as mise en avant dans un article de ton blog.
BUT : créer une relation cordiale et l'inviter, si elle le souhaite, à partager l'article ou à le mentionner sur son site (page "liens utiles"/"partenaires") - SANS être commercial, insistant ni transactionnel.
CONTRAINTES :
- Ton chaleureux, humain, sincère. 3 à 4 courts paragraphes maximum.
- Email GÉNÉRIQUE (il sera envoyé à plusieurs destinataires) : commence par "Bonjour," (ne nomme pas un refuge précis).
- N'invente AUCUN chiffre ni fait. Mentionne naturellement que tu les as mis en avant dans l'article.
- N'inclus PAS de signature, d'en-tête, de logo ni de bouton : ils sont ajoutés automatiquement.
- Réponds UNIQUEMENT en JSON valide : {"subject":"...","body_html":"<p>...</p><p>...</p>"}
- body_html = uniquement des balises <p> (style inline non requis).`;

  const task = `Article mis en ligne :
Titre : ${article.title}
Lien : ${articleUrl}
Résumé : ${resume}

Rédige l'email (objet accrocheur mais sobre + corps en paragraphes <p>).`;

  let subject = `Nous avons parlé de vous sur Mes Poilus 🐾`;
  let bodyHtml = `<p>Bonjour,</p><p>Je suis Thomas, fondateur de Mes Poilus. Je viens de publier un article où je vous mets en avant : <a href="${articleUrl}">${article.title}</a>. Si vous le trouvez utile, n'hésitez pas à le partager !</p>`;

  try {
    const { content } = await runAgent(system, task, MODELS.sonnet, 1200);
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as { subject?: string; body_html?: string };
      if (parsed.subject?.trim()) subject = parsed.subject.trim();
      if (parsed.body_html?.trim()) bodyHtml = parsed.body_html.trim();
    }
  } catch { /* fallback ci-dessus */ }

  const html = buildEmail(bodyHtml, article.title, articleUrl);
  return NextResponse.json({ subject, html });
}
