import Anthropic from '@anthropic-ai/sdk';

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
  // Timeout explicite aligné sur maxDuration des routes longues (jusqu'à 300s),
  // avec ~30s de marge pour la sauvegarde. Évite les coupures SDK implicites.
  timeout: 270_000,
  // 1 retry max : évite de doubler la latence sur les générations longues.
  maxRetries: 1,
});

// Génération 5.5 (27/11/2026) : moins chère et meilleure que la précédente.
// Haiku 4.5 1 $ / 5 $ -> Haiku 5.5 0,10 $ / 0,50 $ ; Sonnet 4.6 3 $ / 15 $ -> Sonnet 5.5 2 $ / 10 $ ;
// Opus 4.7 5 $ / 25 $ -> Opus 5.5 4 $ / 20 $ (par million de tokens, entrée / sortie).
export const MODELS = {
  opus: 'claude-opus-5-5',
  sonnet: 'claude-sonnet-5-5',
  haiku: 'claude-haiku-5-5',
} as const;

export type Effort = 'low' | 'medium' | 'high';

// Les modèles 5.5 réfléchissent avant de répondre (réflexion adaptative, impossible à couper sur Opus 5.5).
// L'effort règle la quantité de réflexion, donc les tokens facturés : bas pour les tâches simples
// (Haiku : FAQ, traductions, classement, réseaux sociaux), moyen pour le raisonnement (Sonnet).
const DEFAULT_EFFORT: Record<string, Effort> = {
  [MODELS.haiku]: 'low',
  [MODELS.sonnet]: 'medium',
  [MODELS.opus]: 'medium',
};

// La réflexion compte dans max_tokens : marge ajoutée pour ne pas tronquer la réponse visible.
// Seuls les tokens réellement produits sont facturés, la marge ne coûte rien.
const THINKING_HEADROOM = 4000;

const isGen55 = (model: string) => model.endsWith('-5-5');

/** Paramètres à ajouter à un appel direct (crons) : effort + max_tokens avec marge de réflexion. */
export function modelParams(model: string, maxTokens: number, effort?: Effort) {
  if (!isGen55(model)) return { model, max_tokens: maxTokens };
  return {
    model,
    max_tokens: maxTokens + THINKING_HEADROOM,
    output_config: { effort: effort ?? DEFAULT_EFFORT[model] ?? 'medium' },
  };
}

/** Texte de la réponse. Une réponse 5.5 peut commencer par des blocs de réflexion : on lit les blocs texte. */
export function textOf(message: { content: Array<{ type: string }> }): string {
  return message.content
    .filter((b): b is { type: 'text'; text: string } => b.type === 'text')
    .map(b => b.text)
    .join('');
}

// Sonnet et Opus 5.5 : si un filtre de sécurité refuse (très improbable sur ce site), l'API relance
// d'elle-même sur un autre modèle (paramètre `fallbacks`, bêta). Haiku 5.5 n'a pas ce repli.
const FALLBACK_BETA = 'server-side-fallback-2026-07-01';
let fallbackUnsupported = false;

async function createMessage(params: Anthropic.MessageCreateParamsNonStreaming): Promise<Anthropic.Message> {
  if (params.model === MODELS.haiku || fallbackUnsupported || !isGen55(params.model)) {
    return anthropic.messages.create(params);
  }
  try {
    const beta = { ...params, betas: [FALLBACK_BETA], fallbacks: 'default' } as unknown as Anthropic.Beta.MessageCreateParamsNonStreaming;
    return (await anthropic.beta.messages.create(beta)) as unknown as Anthropic.Message;
  } catch (e) {
    if (!(e instanceof Anthropic.BadRequestError)) throw e;
    fallbackUnsupported = true; // paramètre refusé : appels normaux pour la suite
    return anthropic.messages.create(params);
  }
}

export async function runAgent(
  systemPrompt: string,
  task: string,
  model: string = MODELS.sonnet,
  maxTokens: number = 2048,
  effort?: Effort,
): Promise<{ content: string; inputTokens: number; outputTokens: number; stopReason: string }> {
  const message = await createMessage({
    ...modelParams(model, maxTokens, effort),
    system: systemPrompt,
    messages: [{ role: 'user', content: task }],
  } as Anthropic.MessageCreateParamsNonStreaming);

  return {
    content: textOf(message),
    inputTokens: message.usage.input_tokens,
    outputTokens: message.usage.output_tokens,
    stopReason: message.stop_reason ?? 'end_turn',
  };
}

export async function streamAgent(
  systemPrompt: string,
  task: string,
  model: string = MODELS.sonnet,
  maxTokens: number = 2048,
  onComplete?: (totalTokens: number) => void,
  effort?: Effort,
): Promise<ReadableStream<Uint8Array>> {
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      const stream = anthropic.messages.stream({
        ...modelParams(model, maxTokens, effort),
        system: systemPrompt,
        messages: [{ role: 'user', content: task }],
      } as Anthropic.MessageStreamParams);

      try {
        for await (const event of stream) {
          // Seuls les morceaux de texte sont transmis (les blocs de réflexion sont ignorés)
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        // Capturer le total tokens depuis le message final (disponible après la boucle)
        if (onComplete) {
          const final = await stream.finalMessage();
          onComplete(final.usage.input_tokens + final.usage.output_tokens);
        }
      } finally {
        controller.close();
      }
    },
  });
}
