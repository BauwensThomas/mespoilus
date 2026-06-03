import { runAgent, MODELS } from '@/lib/anthropic';

export interface FaqItem { q: string; a: string }

/**
 * Génère 3-4 questions/réponses SEO (longue traîne) pour un article via Haiku.
 * Retourne [] en cas d'échec (non-bloquant). Optionnellement seedé avec de
 * vraies requêtes Google (GSC) à privilégier comme questions.
 */
export async function generateFaq(
  title: string,
  content: string,
  gscQueries: string[] = []
): Promise<FaqItem[]> {
  const seed = gscQueries.length
    ? `\n\nQuestions RÉELLES tapées sur Google pour cet article (utilise-les en priorité, reformulées en questions naturelles) :\n${gscQueries.slice(0, 6).map(q => `- ${q}`).join('\n')}`
    : '';

  const system = `Tu es un expert SEO francophone. À partir d'un article, génère une FAQ de 3 à 4 questions que de vrais internautes tapent sur Google à propos de ce sujet, avec des réponses courtes (2-3 phrases), factuelles et utiles. Les questions doivent être en langage naturel (comme une recherche Google). Réponds UNIQUEMENT par un JSON valide : un tableau d'objets {"q":"...","a":"..."}. Aucun texte autour, pas de balises markdown.`;

  const task = `Titre : ${title}\n\nContenu (extrait) :\n${content.slice(0, 3000)}${seed}`;

  try {
    const { content: raw } = await runAgent(system, task, MODELS.haiku, 900);
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];
    const parsed = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((f: unknown): f is FaqItem =>
        !!f && typeof (f as FaqItem).q === 'string' && typeof (f as FaqItem).a === 'string')
      .map((f: FaqItem) => ({ q: f.q.trim(), a: f.a.trim() }))
      .filter(f => f.q && f.a)
      .slice(0, 4);
  } catch {
    return [];
  }
}
