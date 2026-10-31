import { createAdminClient } from '@/lib/supabase/server';
import { runAgent } from '@/lib/anthropic';
import { getAgent } from '@/lib/agents/config';
import { prepareSocialImage } from '@/lib/social-image';
import { sendEmail } from '@/lib/resend';
import { emailWrapper } from '@/lib/cron-email';

const FACEBOOK_URL = 'https://www.facebook.com/profile.php?id=61589487954538';
const INSTAGRAM_URL = 'https://www.instagram.com/mespoilusofficiel/';

const ANIMAL_LABEL: Record<string, string> = {
  chien: 'Chien', chat: 'Chat', oiseau: 'Oiseau',
  rongeur: 'Rongeur', reptile: 'Reptile', autre: 'Animal',
};

// "07600 VALS LES BAINS, France" -> "Vals Les Bains, France" : jamais de code postal dans un post public
function publicLocation(region: string | null): string | null {
  if (!region) return null;
  const clean = region.replace(/\b\d{4,5}\b/g, '').replace(/\s+/g, ' ').replace(/\s+,/g, ',').trim();
  if (!clean) return null;
  return clean === clean.toUpperCase()
    ? clean.toLowerCase().replace(/(^|[\s,'-])(\p{L})/gu, (_, sep: string, c: string) => sep + c.toUpperCase())
    : clean;
}

/**
 * Publie une annonce d'adoption sur Facebook + Instagram (webhook Make, même circuit que les
 * articles) : texte rédigé par Emma, 1re photo recadrée au ratio Instagram, lien de l'annonce
 * dans `article_url` (premier commentaire Facebook). Appelé à l'approbation de l'annonce et par
 * le bouton "Partager sur les réseaux" de /adoption-admin. `shared_at` empêche un double partage.
 */
export async function shareAdoptionPost(id: string): Promise<{ ok: boolean; error?: string }> {
  const start = Date.now();
  const supabase = createAdminClient();

  const { data: post } = await supabase
    .from('adoption_posts')
    .select('id, animal_type, breed, age, gender, region, description, photo_urls, status, shared_at')
    .eq('id', id)
    .single();

  if (!post || post.status !== 'approved') return { ok: false, error: 'Annonce introuvable ou non approuvée' };
  if (post.shared_at) return { ok: false, error: 'Annonce déjà partagée' };

  const makeUrl = process.env.MAKE_WEBHOOK_URL;
  if (!makeUrl) return { ok: false, error: 'MAKE_WEBHOOK_URL manquant' };

  // Réservation atomique (double clic, approbation + bouton) ; libérée si l'envoi échoue
  const { data: claimed } = await supabase
    .from('adoption_posts')
    .update({ shared_at: new Date().toISOString() })
    .eq('id', id)
    .is('shared_at', null)
    .select('id');
  if (!claimed?.length) return { ok: false, error: 'Annonce déjà partagée' };
  const release = () => supabase.from('adoption_posts').update({ shared_at: null }).eq('id', id);

  const listingUrl = `https://www.mespoilus.com/adoption/${post.id}`;
  const location = publicLocation(post.region);
  const fiche = [
    `Animal : ${ANIMAL_LABEL[post.animal_type] ?? post.animal_type}${post.breed ? ` (${post.breed})` : ''}`,
    post.age ? `Âge : ${post.age}` : null,
    post.gender && post.gender !== 'inconnu' ? `Sexe : ${post.gender}` : null,
    location ? `Lieu : ${location}` : null,
    post.description ? `Description du propriétaire : ${post.description.slice(0, 600)}` : null,
  ].filter(Boolean).join('\n');

  const emma = getAgent('emma');
  const prompt = `Crée un post Facebook et Instagram chaleureux pour une nouvelle annonce d'adoption publiée sur Mes Poilus.

${fiche}

Consignes :
- Présente cet animal avec ses vraies informations (prénom s'il figure dans la description, race, âge, ville) et donne envie de l'adopter ou de partager le post
- Le lieu se limite à la ville et au pays : jamais d'adresse, de code postal, d'email ni de numéro de téléphone
- Invite à aller voir toutes les annonces d'adoption sur mespoilus.com
- Dis clairement que déposer une annonce d'adoption sur Mes Poilus est gratuit
- Comme lien, utilise uniquement : mespoilus.com/adoption
- Hashtags pertinents (adoption, espèce, race, ville)`;

  let content: string;
  let tokens = 0;
  try {
    const res = await runAgent(emma.systemPrompt, prompt, emma.model, emma.maxTokens ?? 2000);
    content = res.content.trim();
    tokens = res.inputTokens + res.outputTokens;
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erreur Emma';
    await release();
    await logShare(supabase, 'error', start, `Erreur Emma : ${msg}`, { id }, 0);
    return { ok: false, error: msg };
  }

  const hashtags = content.match(/#[\wÀ-ɏ]+/g) ?? [];
  const cleanContent = content.replace(/#[\wÀ-ɏ]+/g, '').replace(/\n{3,}/g, '\n\n').trim();
  const rawImage: string | undefined = post.photo_urls?.[0];

  const body: Record<string, string> = { content: cleanContent, hashtags: hashtags.join(' '), article_url: listingUrl };
  if (rawImage) body.image_url = await prepareSocialImage(rawImage);

  try {
    const res = await fetch(makeUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) throw new Error(`webhook Make ${res.status}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erreur webhook';
    await release();
    await logShare(supabase, 'error', start, `Erreur envoi Make : ${msg}`, { id }, tokens);
    return { ok: false, error: msg };
  }

  for (const platform of ['facebook', 'instagram']) {
    await supabase.from('social_posts').insert({ content, platform, hashtags, status: 'draft' });
  }
  await logShare(supabase, 'success', start,
    `Annonce partagée : ${ANIMAL_LABEL[post.animal_type] ?? post.animal_type}${post.breed ? ` ${post.breed}` : ''}`,
    { id, listing_url: listingUrl }, tokens);
  return { ok: true };
}

async function logShare(
  supabase: ReturnType<typeof createAdminClient>,
  status: 'success' | 'error',
  start: number,
  action: string,
  details: Record<string, unknown>,
  tokens: number,
) {
  try {
    await supabase.from('activity_logs').insert({
      agent_id: 'emma', agent_name: 'Emma',
      action: `[Adoption social] ${action}`,
      status, duration_ms: Date.now() - start, details, tokens_used: tokens,
    });
  } catch { /* non-bloquant */ }
}

const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const EMAIL_ANIMAL_LABEL: Record<string, string> = {
  chien: 'chien', chat: 'chat', oiseau: 'oiseau', rongeur: 'petit compagnon', reptile: 'reptile',
};

const BUTTON ='display:inline-block;color:#fff;padding:10px 22px;border-radius:8px;text-decoration:none;font-weight:bold;margin:4px';

/**
 * Email au déposant à l'approbation : annonce en ligne, partage sur nos réseaux (si le post a
 * bien été envoyé), invitation à s'abonner et à partager, code de suppression.
 */
export async function sendAdoptionOnlineEmail(params: {
  id: string;
  email: string;
  posterName: string;
  animalType: string;
  region: string | null;
  deleteToken: string;
  shared: boolean;
}) {
  const listingUrl = `https://www.mespoilus.com/adoption/${params.id}`;
  // Espèce de l'annonce ("votre chat", "votre oiseau"...) ; "autre" ou inconnue -> "votre compagnon"
  const animal = EMAIL_ANIMAL_LABEL[params.animalType] ?? 'compagnon';
  const sharedBlock = params.shared
    ? `<p>Pour lui donner encore plus de chances, nous l'avons aussi partagée sur nos réseaux sociaux, <strong>Facebook</strong> et <strong>Instagram</strong>.</p>`
    : '';

  await sendEmail({
    to: params.email,
    subject: 'Votre annonce est en ligne sur Mes Poilus !',
    html: emailWrapper('Votre annonce est en ligne !', `
      <p>Bonjour <strong>${escapeHtml(params.posterName)}</strong>,</p>
      <p>Bonne nouvelle : votre annonce d'adoption pour votre <strong>${animal}</strong>${params.region ? ` (${escapeHtml(params.region)})` : ''} est désormais en ligne sur Mes Poilus.</p>
      ${sharedBlock}
      <p style="text-align:center;margin:22px 0">
        <a href="${listingUrl}" style="${BUTTON};background:#ea580c">Voir mon annonce</a>
      </p>

      <div style="background:#fff7ed;border-left:3px solid #ea580c;padding:14px 18px;border-radius:6px;margin:20px 0">
        <p style="margin:0 0 8px;font-weight:bold;color:#9a3412">Aidez-nous à lui trouver une famille</p>
        <p style="margin:0 0 8px">Plus votre annonce circule, plus vite votre compagnon trouvera son nouveau foyer. Vous pouvez nous aider :</p>
        <ul style="margin:0 0 10px;padding-left:20px">
          <li>abonnez-vous à nos pages Facebook et Instagram${params.shared ? ' et partagez la publication de votre annonce' : ''} ;</li>
          <li>partagez le lien de votre annonce à votre famille, vos amis et dans les groupes de votre région : <a href="${listingUrl}" style="color:#ea580c">${listingUrl}</a></li>
        </ul>
        <p style="text-align:center;margin:12px 0 0">
          <a href="${FACEBOOK_URL}" style="${BUTTON};background:#1877f2">Facebook</a>
          <a href="${INSTAGRAM_URL}" style="${BUTTON};background:#e1306c">Instagram</a>
        </p>
      </div>

      <p>Nous espérons de tout coeur que votre ${animal} trouvera très vite une famille aimante, qui lui offrira toute la tendresse et l'attention qu'il mérite. Merci de lui donner cette chance.</p>
      <p>Toute l'équipe de Mes Poilus</p>

      <p style="font-size:13px;color:#6b7280;margin-top:22px">Pour supprimer votre annonce à tout moment (par exemple une fois votre animal adopté), utilisez ce code sur la page de votre annonce :</p>
      <p style="font-family:monospace;font-size:26px;font-weight:bold;letter-spacing:6px;color:#111;background:#f3f4f6;padding:14px 20px;border-radius:8px;text-align:center">${params.deleteToken}</p>
      <p style="font-size:12px;color:#9ca3af">Conservez ce code précieusement, il ne peut pas être récupéré.</p>
    `),
  });
}
