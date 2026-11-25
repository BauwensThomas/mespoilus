export function normalizeSearch(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

// Mots sans intérêt pour la recherche ("croquettes pour chat" = "croquettes chat")
const STOP_WORDS = new Set([
  'de', 'du', 'des', 'la', 'le', 'les', 'un', 'une', 'et', 'ou', 'a', 'au', 'aux', 'en', 'dans', 'sur', 'par',
  'pour', 'avec', 'mon', 'ma', 'mes', 'son', 'sa', 'ses', 'votre', 'vos', 'notre', 'nos', 'ce', 'ces', 'que', 'qui',
]);
const MAX_TERMS = 6;

/**
 * Motifs (regex Postgres, insensibles à la casse) pour une recherche : un par mot, à combiner en ET,
 * donc l'ordre des mots n'a pas d'importance.
 * - pluriel ignoré : "chats" trouve "chat" ;
 * - mot court (4 lettres ou moins) : seulement en début de mot, sinon "chat" trouverait "achat" ;
 * - mot long : n'importe où, "terrarium" trouve "aquaterrarium".
 * Les mots ne contiennent que des lettres et des chiffres : aucun caractère spécial de regex.
 */
export function searchPatterns(search: string): string[] {
  const all = normalizeSearch(search).split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  const useful = all.filter(w => !STOP_WORDS.has(w) && (w.length > 1 || /\d/.test(w)));
  const words = [...new Set(useful.length ? useful : all)].slice(0, MAX_TERMS);
  return words.map(w => {
    const term = w.length > 3 && !/\d/.test(w) ? w.replace(/[sx]$/, '') : w;
    // "gris" devient "gri" : on exige le mot entier pour ne pas trouver "griffoir"
    if (term !== w && term.length <= 3) return `\\m${term}[sx]?\\M`;
    return term.length <= 4 ? `\\m${term}` : term;
  });
}

/** Applique une recherche multi-mots (ET) sur une colonne déjà normalisée (sans accents, minuscules). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function applySearch(query: any, column: string, search: string): any {
  let q = query;
  for (const pattern of searchPatterns(search)) q = q.filter(column, 'imatch', pattern);
  return q;
}
