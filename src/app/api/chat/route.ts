import { NextRequest } from 'next/server';
import { z } from 'zod';
import { streamChat } from '@/lib/ai/ai-factory';
import { buildSystemPrompt } from '@/lib/ai/prompt-builder';
import { saveMessage, getConversationHistory, getMemorySummaries, getUserFacts } from '@/lib/memory/conversation';
import { maybeSummarize } from '@/lib/memory/summarizer';
import { supabase, isSupabaseConfigured } from '@/lib/memory/supabase';
import { inferEmotionFromKeywords } from '@/lib/emotions/emotion-tracker';
import type { Character, EmotionType } from '@/types';

const CharacterSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  personality: z.string(),
  backstory: z.string(),
  speechStyle: z.string(),
  avatarEmoji: z.string(),
  aiModel: z.enum(['claude', 'openai']),
});

const ChatSchema = z.object({
  message: z.string().min(1).max(4000),
  conversationId: z.string().uuid(),
  characterId: z.string().uuid(),
  model: z.enum(['claude', 'openai']).optional(),
  character: CharacterSchema.optional(),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const parsed = ChatSchema.safeParse(body);
  if (!parsed.success) {
    return new Response('Invalid request: ' + parsed.error.issues[0]?.message, { status: 400 });
  }

  const { message, conversationId, characterId, model, character: inlineCharacter } = parsed.data;

  if (isSupabaseConfigured()) {
    const ownershipCheck = await supabase
      .from('conversations')
      .select('id')
      .eq('id', conversationId)
      .eq('character_id', characterId)
      .single();
    if (ownershipCheck.error || !ownershipCheck.data) {
      return new Response('Not found', { status: 404 });
    }
  }

  let character: Character;
  if (isSupabaseConfigured()) {
    const [historyResult, memoriesResult, characterResult, userFactsResult] = await Promise.all([
      getConversationHistory(conversationId),
      getMemorySummaries(characterId),
      supabase.from('characters').select('*').eq('id', characterId).single(),
      getUserFacts(characterId),
    ]);

    if (characterResult.error || !characterResult.data) {
      return new Response('Character not found', { status: 404 });
    }

    const char = characterResult.data;
    character = {
      id: char.id,
      name: char.name,
      personality: char.personality,
      backstory: char.backstory,
      speechStyle: char.speech_style,
      avatarEmoji: char.avatar_emoji,
      aiModel: char.ai_model,
    };

    const currentEmotion: EmotionType =
      (historyResult.findLast((m) => m.emotion)?.emotion as EmotionType) ?? 'neutral';
    const systemPrompt = buildSystemPrompt(character, currentEmotion, memoriesResult, userFactsResult);
    await saveMessage(conversationId, 'user', message);
    const allMessages = [
      ...historyResult,
      { id: 'new', role: 'user' as const, content: message, createdAt: new Date() },
    ];
    let fullResponse = '';
    const decoder = new TextDecoder();
    const aiStream = await streamChat(model ?? character.aiModel, allMessages, systemPrompt);
    const transformStream = new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        fullResponse += decoder.decode(chunk, { stream: true });
        controller.enqueue(chunk);
      },
      async flush() {
        fullResponse += decoder.decode();
        const responseEmotion = inferEmotionFromKeywords(fullResponse, currentEmotion);
        await saveMessage(conversationId, 'assistant', fullResponse, responseEmotion);
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

  if (!inlineCharacter) {
    return new Response('character data required when Supabase is not configured', { status: 400 });
  }
  character = inlineCharacter;

  const currentEmotion: EmotionType = 'neutral';
  const systemPrompt = buildSystemPrompt(character, currentEmotion, [], []);
  const allMessages = [{ id: 'new', role: 'user' as const, content: message, createdAt: new Date() }];

  let fullResponse = '';
  const decoder = new TextDecoder();
  const aiStream = await streamChat(model ?? character.aiModel, allMessages, systemPrompt);

  const transformStream = new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      fullResponse += decoder.decode(chunk, { stream: true });
      controller.enqueue(chunk);
    },
    flush() {
      fullResponse += decoder.decode();
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
