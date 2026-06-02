import type { Message } from '@/types';
import { streamWithGemini } from './gemini';

export async function streamChat(
  messages: Message[],
  systemPrompt: string
): Promise<ReadableStream<Uint8Array>> {
  return streamWithGemini(messages, systemPrompt);
}
