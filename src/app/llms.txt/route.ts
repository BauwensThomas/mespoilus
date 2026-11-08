import { createAdminClient } from '@/lib/supabase/server';

/**
 * /llms.txt généré automatiquement (remplace le fichier fixe public/llms.txt de juin 2026).
 * Présente le site aux assistants IA (ChatGPT, Claude, Perplexity...) et liste TOUS les
 * articles publiés par catégorie, avec leur description. Régénéré une fois par jour.
 * Ne liste que des pages indexables (pas de /adoption/deposer, /favoris, /liens : noindex).
 */
export const revalidate = 86400;

const SITE = 'https://www.mespoilus.com';

const CATEGORIES: { id: string; label: string }[] = [
  { id: 'chiens', label: 'Chiens' },
  { id: 'chats', label: 'Chats' },
  { id: 'oiseaux', label: 'Oiseaux' },
  { id: 'rongeurs', label: 'Rongeurs' },
  { id: 'reptiles', label: 'Reptiles' },
  { id: 'general', label: 'Général' },
];

const clean = (s: string | null | undefined) =>
  (s ?? '').replace(/\s+/g, ' ').replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '').trim();

export async function GET() {
  let articles: { slug: string; title: string; category: string; meta_description: string | null; excerpt: string | null }[] = [];
  try {
    const { data } = await createAdminClient()
      .from('articles')
      .select('slug, title, category, meta_description, excerpt')
      .eq('status', 'published')
      .order('published_at', { ascending: false });
    articles = data ?? [];
  } catch { /* liste des articles omise, le reste du fichier reste valable */ }

  const blogSections = CATEGORIES.map(({ id, label }) => {
    const list = articles.filter(a => a.category === id);
    if (!list.length) return '';
    const lines = list.map(a => {
      const desc = clean(a.meta_description ?? a.excerpt);
      return `- [${clean(a.title)}](${SITE}/blog/${a.slug})${desc ? ` : ${desc}` : ''}`;
    });
    return `### ${label}\n- [Tous les articles ${label.toLowerCase()}](${SITE}/blog/${id})\n${lines.join('\n')}`;
  }).filter(Boolean).join('\n\n');

  const body = `# Mes Poilus

> Mes Poilus (${SITE}) est un site francophone pour les propriétaires et amoureux des animaux de compagnie : chiens, chats, oiseaux, rongeurs et reptiles. Il réunit un blog de conseils santé et guides pratiques, des fiches races, des annonces d'adoption gratuites entre particuliers, des outils gratuits et un comparateur de prix d'accessoires. Audience francophone (Belgique, France, Suisse, Luxembourg, Canada).

Les articles sont rédigés avec l'aide d'une intelligence artificielle (Marie) à partir de recommandations vétérinaires reconnues, puis relus et supervisés par le fondateur, Thomas. Ils ne remplacent pas l'avis d'un vétérinaire. Détails : ${SITE}/a-propos

## Blog (${articles.length} articles)

${blogSections}

## Adoption
Annonces d'adoption gratuites entre particuliers, vérifiées avant publication. Les coordonnées du déposant restent privées : les intéressés le contactent via un formulaire.
- [Annonces d'adoption](${SITE}/adoption)

## Fiches races
Caractère, santé, alimentation, entretien et conseils avant l'adoption, par espèce.
- [Toutes les fiches races](${SITE}/races)
- [Races de chiens](${SITE}/races/chiens)
- [Races de chats](${SITE}/races/chats)
- [Espèces d'oiseaux](${SITE}/races/oiseaux)
- [Espèces de rongeurs](${SITE}/races/rongeurs)
- [Espèces de reptiles](${SITE}/races/reptiles)

## Outils gratuits
- [Calculateur d'âge](${SITE}/outils/age) : âge de l'animal en équivalent humain selon l'espèce.
- [Calculateur de nutrition](${SITE}/outils/nutrition) : estimation de la ration alimentaire.
- [Générateur de prénoms](${SITE}/outils/prenom) : idées de noms par espèce.
- [Quiz](${SITE}/outils/quiz) : quel animal de compagnie choisir selon son mode de vie.

## Boutique (comparateur de prix)
Accessoires, alimentation et matériel. Chaque fiche compare les offres de marchands partenaires ; l'achat se fait toujours chez le marchand (liens affiliés).
- [Boutique](${SITE}/boutique)

## Guides et solidarité
- [Guides PDF gratuits](${SITE}/guides)
- [Grille Mystère](${SITE}/grille) : jeu solidaire au profit des refuges.
- [Soutenir Mes Poilus](${SITE}/soutenir)

## À propos
- [À propos](${SITE}/a-propos)
- [Espace presse](${SITE}/presse)
- Réseaux sociaux : Instagram et Facebook @mespoilusofficiel
- Contact : contact@mespoilus.com

## Optional
- [Mentions légales](${SITE}/mentions-legales)
- [CGU](${SITE}/cgu)
- [Politique de confidentialité](${SITE}/politique-confidentialite)
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
}
