import Anthropic from '@anthropic-ai/sdk';

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
  // Timeout explicite aligné sur maxDuration des routes longues (jusqu'à 300s),
  // avec ~30s de marge pour la sauvegarde. Évite les coupures SDK implicites.
  timeout: 270_000,
  // 1 retry max : évite de doubler la latence sur les générations longues.
  maxRetries: 1,
});

export const MODELS = {
  opus: 'claude-opus-4-7',
  sonnet: 'claude-sonnet-4-6',
  haiku: 'claude-haiku-4-5-20251001',
} as const;

export async function runAgent(
  systemPrompt: string,
  task: string,
  model: string = MODELS.sonnet,
  maxTokens: number = 2048
): Promise<{ content: string; inputTokens: number; outputTokens: number; stopReason: string }> {
  const message = await anthropic.messages.create({
    model,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: 'user', content: task }],
  });

  const content = message.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as { type: 'text'; text: string }).text)
    .join('');

  return {
    content,
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
  onComplete?: (totalTokens: number) => void
): Promise<ReadableStream<Uint8Array>> {
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      const stream = anthropic.messages.stream({
        model,
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [{ role: 'user', content: task }],
      });

      try {
        for await (const event of stream) {
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
