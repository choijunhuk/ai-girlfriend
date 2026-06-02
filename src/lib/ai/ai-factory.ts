import type { AIModel, Message } from '@/types';
import { streamWithClaude } from './claude';
import { streamWithOpenAI } from './openai';

export async function streamChat(
  model: AIModel,
  messages: Message[],
  systemPrompt: string
): Promise<ReadableStream<Uint8Array>> {
  if (model === 'claude') {
    return streamWithClaude(messages, systemPrompt);
  }
  return streamWithOpenAI(messages, systemPrompt);
}
