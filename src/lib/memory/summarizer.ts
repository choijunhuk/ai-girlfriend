import Anthropic from '@anthropic-ai/sdk';
import type { Message } from '@/types';
import { saveMemorySummary, getConversationHistory } from './conversation';

function getClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

const SUMMARIZE_THRESHOLD = 20;

export async function maybeSummarize(
  conversationId: string,
  characterId: string
): Promise<void> {
  const messages = await getConversationHistory(conversationId, 100);
  if (messages.length < SUMMARIZE_THRESHOLD) return;

  const toSummarize = messages.slice(0, messages.length - 10);
  if (toSummarize.length === 0) return;

  const summary = await summarizeMessages(toSummarize);
  if (!summary) return;

  await saveMemorySummary(
    characterId,
    summary,
    toSummarize[0].createdAt,
    toSummarize[toSummarize.length - 1].createdAt
  );
}

async function summarizeMessages(messages: Message[]): Promise<string | null> {
  const formatted = messages
    .map((m) => `${m.role === 'user' ? '나' : '너'}: ${m.content}`)
    .join('\n');

  const response = await getClient().messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 300,
    messages: [
      {
        role: 'user',
        content: `다음 대화를 3-4문장으로 요약해줘. 중요한 감정, 사건, 약속을 포함해:

${formatted}

요약:`,
      },
    ],
  });

  const block = response.content[0];
  return block.type === 'text' ? block.text : null;
}
