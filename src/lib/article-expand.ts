import { runAgent, MODELS } from '@/lib/anthropic';

export const MIN_ARTICLE_WORDS = 1000;

export function countWords(markdown: string): number {
  return markdown.trim().split(/\s+/).filter(Boolean).length;
}

const SYSTEM = `Tu es rédacteur pour Mes Poilus, un site francophone de conseils sur les animaux de compagnie.
On te donne un article déjà publié, trop court. Tu le complètes avec du contenu réellement utile, jamais du remplissage.`;

/**
 * Garde-fou longueur du cron blog : un article de moins de MIN_ARTICLE_WORDS mots est complété
 * (2 à 3 sections H2 utiles avant "En résumé"). Les articles courts de mai 2026 étaient
 * "explorés, non indexés" par Google (médiane 899 mots contre 1 214 pour les articles indexés).
 * Renvoie null si l'article est assez long ou si le résultat n'est pas sûr (tronqué, plus court,
 * lien d'origine perdu, frontmatter) : l'article d'origine est alors conservé.
 */
export async function expandShortArticle(content: string): Promise<{ content: string; words: number; tokens: number } | null> {
  const words = countWords(content);
  if (words >= MIN_ARTICLE_WORDS) return null;

  const task = `Voici un article de blog publié sur Mes Poilus. Il fait ${words} mots, c'est trop court pour être bien référencé.

Réécris-le EN ENTIER en Markdown en respectant ces règles :
- Conserve tout le texte existant, ses titres et TOUS les liens Markdown à l'identique (même texte, même URL). Tu peux seulement ajuster une transition.
- Ajoute 2 à 3 nouvelles sections H2 réellement utiles (cas particuliers, erreurs fréquentes, étapes pratiques détaillées, différences selon l'âge ou l'espèce, quand consulter un vétérinaire), placées AVANT la section "En résumé".
- Objectif : entre 1150 et 1350 mots au total.
- N'invente aucun chiffre précis, aucune étude, aucun nom de produit ni aucun lien nouveau.
- INTERDIT : emoji, tiret long (— ou –), frontmatter (---). Ton chaleureux, vouvoiement si l'article vouvoie.
- Renvoie UNIQUEMENT l'article complet, sans commentaire avant ou après.

ARTICLE :
${content}`;

  const res = await runAgent(SYSTEM, task, MODELS.sonnet, 6000);
  const expanded = res.content.trim().replace(/^```(?:markdown)?\s*/i, '').replace(/```\s*$/, '').trim();
  const newWords = countWords(expanded);
  const links = (s: string) => [...s.matchAll(/\]\(([^)\s]+)\)/g)].map(m => m[1]);
  const lostLink = links(content).some(l => !expanded.includes(l));

  if (res.stopReason === 'max_tokens' || expanded.startsWith('---') || newWords < words + 150 || lostLink) {
    console.warn(`[article-expand] résultat rejeté (mots ${words} -> ${newWords}, stop=${res.stopReason}, lien perdu=${lostLink})`);
    return null;
  }
  return { content: expanded, words: newWords, tokens: res.inputTokens + res.outputTokens };
}
