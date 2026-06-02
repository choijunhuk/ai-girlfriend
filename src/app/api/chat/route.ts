import { NextRequest } from 'next/server';
import { streamChat } from '@/lib/ai/ai-factory';
import { buildSystemPrompt } from '@/lib/ai/prompt-builder';
import { saveMessage, getConversationHistory, getMemorySummaries } from '@/lib/memory/conversation';
import { maybeSummarize } from '@/lib/memory/summarizer';
import { supabase } from '@/lib/memory/supabase';
import type { ChatRequest, Character, EmotionType } from '@/types';

export async function POST(req: NextRequest) {
  const body: ChatRequest = await req.json();
  const { message, conversationId, characterId, model } = body;

  if (!message || !conversationId || !characterId) {
    return new Response('Missing required fields', { status: 400 });
  }

  const [historyResult, memoriesResult, characterResult] = await Promise.all([
    getConversationHistory(conversationId),
    getMemorySummaries(characterId),
    supabase.from('characters').select('*').eq('id', characterId).single(),
  ]);

  if (characterResult.error || !characterResult.data) {
    return new Response('Character not found', { status: 404 });
  }

  const char = characterResult.data;
  const character: Character = {
    id: char.id,
    name: char.name,
    personality: char.personality,
    backstory: char.backstory,
    speechStyle: char.speech_style,
    avatarEmoji: char.avatar_emoji,
    aiModel: char.ai_model,
  };

  const lastEmotion: EmotionType =
    (historyResult.findLast((m) => m.emotion)?.emotion as EmotionType) ?? 'neutral';

  const systemPrompt = buildSystemPrompt(character, lastEmotion, memoriesResult);

  await saveMessage(conversationId, 'user', message, lastEmotion);

  const allMessages = [...historyResult, { id: 'new', role: 'user' as const, content: message, createdAt: new Date() }];

  let fullResponse = '';
  const aiStream = await streamChat(model ?? character.aiModel, allMessages, systemPrompt);

  const transformStream = new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      fullResponse += new TextDecoder().decode(chunk);
      controller.enqueue(chunk);
    },
    async flush() {
      await saveMessage(conversationId, 'assistant', fullResponse, lastEmotion);
      await maybeSummarize(conversationId, characterId).catch(() => {});
    },
  });

  return new Response(aiStream.pipeThrough(transformStream), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache',
    },
  });
}
