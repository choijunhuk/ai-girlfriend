import Anthropic from '@anthropic-ai/sdk';
import type { Message } from '@/types';
import { saveMemorySummary, getConversationHistory } from './conversation';
import { saveUserFacts } from './user-facts';

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

  const [summary, facts] = await Promise.all([
    summarizeMessages(toSummarize),
    extractUserFacts(toSummarize),
  ]);

  await Promise.all([
    summary
      ? saveMemorySummary(
          characterId,
          summary,
          toSummarize[0].createdAt,
          toSummarize[toSummarize.length - 1].createdAt
        )
      : Promise.resolve(),
    facts.length > 0 ? saveUserFacts(characterId, facts) : Promise.resolve(),
  ]);
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

async function extractUserFacts(messages: Message[]): Promise<string[]> {
  const userMessages = messages
    .filter((m) => m.role === 'user')
    .map((m) => m.content)
    .join('\n');

  if (userMessages.length < 50) return [];

  const response = await getClient().messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 200,
    messages: [
      {
        role: 'user',
        content: `다음 사용자 메시지에서 사용자에 관한 구체적인 사실을 추출해줘.
이름, 나이, 직업, 취미, 좋아하는 것, 싫어하는 것, 가족 등.
각 사실을 한 줄씩, JSON 배열 형식으로만 출력해. 없으면 빈 배열 [].

사용자 메시지:
${userMessages}

출력 형식: ["사실1", "사실2"]`,
      },
    ],
  });

  const block = response.content[0];
  if (block.type !== 'text') return [];

  try {
    const match = block.text.match(/\[[\s\S]*\]/);
    if (!match) return [];
    const parsed = JSON.parse(match[0]);
    if (!Array.isArray(parsed)) return [];
    const MAX_FACT_LEN = 200;
    return parsed
      .filter((f): f is string => typeof f === 'string')
      .map((f) => f.replace(/[\u0000-\u001F]/g, "").trim())
      .filter((f) => f.length > 0 && f.length <= MAX_FACT_LEN)
      .slice(0, 10);
  } catch {
    return [];
  }
}
