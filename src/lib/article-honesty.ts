import { runAgent, MODELS } from '@/lib/anthropic';

/**
 * Garde-fou "pas de mensonge" (25/11/2026). Les articles sont écrits par une IA : rien n'a été testé,
 * personne n'a été rencontré, aucun lecteur n'a écrit. 43 phrases de ce genre ont été corrigées
 * à la main ce jour-là dans 32 articles publiés, malgré la consigne du prompt.
 */
export const HONESTY_RULE = `HONNÊTETÉ (règle absolue) : tu es une IA. N'écris JAMAIS que des produits ont été testés, essayés, comparés ou approuvés par nous, par des experts ou par des propriétaires. N'invente JAMAIS un vécu ("j'ai constaté", "je vois souvent"), une rencontre, un message de lecteur, un "cas réel" ni une équipe de vétérinaires. Ne cite JAMAIS de note (4,6/5), d'étoiles ni de nombre d'avis clients : ces chiffres changent et ne sont pas vérifiables. Pas de "j'aimerais", "j'adore", "je serais ravi". Écris plutôt "une erreur fréquente", "imaginons un chat qui...", "voici une sélection".`;

const CLAIMS: RegExp[] = [
  // e?s? : accord du participe ("les croquettes que nous avons testées"), trou constaté le 27/11/2026
  /\b(?:nous|on) (?:avons|a) (?:\w+ )?(?:teste|essaye|compare|analyse)e?s?\b/,
  /\bapres avoir (?:teste|essaye|compare)e?s?\b/,
  /\btestee?s? (?:et (?:approuve|recommande|compare|valide)|par (?:nous|nos|notre|des (?:proprietaires|milliers|experts)))/,
  /\b(?:produits?|modeles?|litieres?|cages?|harnais|colliers?|jouets?|croquettes|recommandations?|selection)(?: \w+){0,2} testee?s?\b/,
  /\b(?:concretes?|rigoureuse|fiables?) et testee?s?\b/,
  /\bapprouvee?s? par (?:nos|notre|nous|des|les)\b/,
  /\bj'ai (?:\w+ )?(?:teste|essaye|constate|observe|remarque|vu|suivi|rencontre|discute|accompagne|recu)e?s?\b/,
  /\bque (?:je|nous) (?:vois|voyons|constate|constatons)\b/,
  /\bj'(?:observe|aimerais|adore|adorerais)\b/,
  /\bje (?:l'ai vu|vois souvent|serais (?:ravi|heureu))/,
  /\b(?:m'a|m'ont|nous a|nous ont) (?:ecrit|contacte|raconte|confie|demande)/,
  /\bavec (?:qui|lequel|laquelle) j'ai\b/,
  /\bje (?:vous|te) (?:presente|guide|recommande|conseille|explique)/,
  /\blaisse[zs]?-moi\b/,
  /\bcas reel\b/,
  /\b(?:nos|notre) (?:equipes?|experts?|veterinaires?|testeurs?)\b/,
  /\bont aide de nombreux\b/,
  // Notes et nombres d'avis ("4,6/5", "25 000 avis clients"), sans toucher à une fraction ("4/5 de la ration")
  /\(?\b(?:notes?|notee?s?|etoiles?|avis)\b[^.!?]{0,25}\b[1-5](?:[.,]\d)? ?\/ ?5\b/,
  /\b[1-5](?:[.,]\d)? ?\/ ?5\b[^!?]{0,25}\b(?:avis|etoiles?|utilisateurs)\b/,
  /\([1-5](?:[.,]\d)? ?\/ ?5\b/,
  /\b\d[\d\s.,]* avis\b|\bmilliers d'avis\b/,
];

/** Sans accents ni majuscules, guillemets retirés : une citation ("je crois que...") n'est pas une affirmation. */
function flat(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[‘’]/g, "'").toLowerCase()
    .replace(/«[^»]*»|“[^”]*”|"[^"]*"/g, ' ');
}

export function hasFalseClaim(text: string): boolean {
  const t = flat(text);
  return CLAIMS.some(re => re.test(t));
}

/** Phrases (texte exact de l'article) contenant une affirmation fausse. */
export function findFalseClaims(markdown: string): string[] {
  const found: string[] = [];
  for (const line of markdown.split('\n')) {
    for (const sentence of line.split(/(?<=[.!?])\s+/)) {
      if (sentence.trim() && hasFalseClaim(sentence)) found.push(sentence.trim());
    }
  }
  return [...new Set(found)];
}

const links = (s: string) => [...s.matchAll(/\]\(([^)\s]+)\)/g)].map(m => m[1]).join('|');

/**
 * Réécrit honnêtement chaque phrase fautive (mêmes liens obligatoires). Une phrase dont la
 * réécriture n'est pas sûre est supprimée, sauf si elle contient un lien ou si c'est un titre
 * ou un élément de liste : elle est alors renvoyée dans `remaining`, à corriger à la main.
 */
export async function removeFalseClaims(content: string): Promise<{ content: string; fixed: number; remaining: string[]; tokens: number } | null> {
  const claims = findFalseClaims(content);
  if (claims.length === 0) return null;

  let rewrites: unknown[] = [];
  let tokens = 0;
  try {
    const res = await runAgent(
      'Tu corriges des phrases d\'un site sur les animaux. Tu réponds uniquement par un tableau JSON de chaînes.',
      `${HONESTY_RULE}

Réécris chaque phrase ci-dessous pour retirer l'affirmation fausse, en gardant le conseil utile. Garde les liens Markdown à l'identique, le même vouvoiement ou tutoiement et une longueur proche. N'ajoute aucun fait, aucun chiffre, aucun emoji, aucun tiret long.
Réponds par un tableau JSON de ${claims.length} chaîne(s), dans le même ordre.

${JSON.stringify(claims)}`,
      MODELS.haiku, 2000,
    );
    tokens = res.inputTokens + res.outputTokens;
    const json = res.content.match(/\[[\s\S]*\]/);
    const parsed: unknown = json ? JSON.parse(json[0]) : [];
    if (Array.isArray(parsed) && parsed.length === claims.length) rewrites = parsed;
  } catch (err) {
    console.warn('[article-honesty] réécriture échouée :', err instanceof Error ? err.message : err);
  }

  let out = content;
  let fixed = 0;
  const remaining: string[] = [];
  claims.forEach((claim, i) => {
    const r = rewrites[i];
    const safe = typeof r === 'string' && r.trim().length > 10 && r.length < claim.length * 1.8 + 60
      && !r.includes('\n') && !/[—–]/.test(r) && links(r) === links(claim) && !hasFalseClaim(r);
    if (safe) {
      out = out.split(claim).join((r as string).trim());
      fixed++;
    } else if (!links(claim) && !/^\s*(#|[-*>]|\d+\.)/.test(claim)) {
      out = out.split(claim).join('').replace(/ {2,}/g, ' ').replace(/\n{3,}/g, '\n\n');
      fixed++;
    } else {
      remaining.push(claim);
    }
  });
  return { content: out, fixed, remaining, tokens };
}
