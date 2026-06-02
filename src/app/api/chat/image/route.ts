import { NextRequest } from 'next/server';
import { z } from 'zod';
import { geminiVision } from '@/lib/ai/gemini';
import { supabase, isSupabaseConfigured } from '@/lib/memory/supabase';
import { saveMessage, getConversationHistory, getMemorySummaries, getUserFacts } from '@/lib/memory/conversation';
import { maybeSummarize } from '@/lib/memory/summarizer';
import { buildSystemPrompt } from '@/lib/ai/prompt-builder';
import { inferEmotionFromKeywords } from '@/lib/emotions/emotion-tracker';
import type { Character, EmotionType } from '@/types';

const MAX_B64 = 7_000_000;

const MAGIC: Record<string, number[]> = {
  'image/jpeg': [0xff, 0xd8, 0xff],
  'image/png': [0x89, 0x50, 0x4e, 0x47],
  'image/webp': [0x52, 0x49, 0x46, 0x46],
  'image/gif': [0x47, 0x49, 0x46],
};

function matchesMagic(base64: string, mime: string): boolean {
  const bytes = Buffer.from(base64.slice(0, 16), 'base64');
  const magic = MAGIC[mime];
  if (!magic) return false;
  return magic.every((b, i) => bytes[i] === b);
}

const CharacterSchema = z.object({
  id: z.string().uuid(),
  name: z.string().max(100),
  personality: z.string().max(500),
  backstory: z.string().max(500),
  speechStyle: z.string().max(300),
  avatarEmoji: z.string().max(10),
  aiModel: z.string().max(20),
});

const ImageChatSchema = z.object({
  message: z.string().max(2000).default('이 사진 어때?'),
  imageBase64: z.string().min(1).max(MAX_B64).regex(/^[A-Za-z0-9+/=]+$/),
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp', 'image/gif']).default('image/jpeg'),
  conversationId: z.string().uuid(),
  characterId: z.string().uuid(),
  character: CharacterSchema.optional(),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const parsed = ImageChatSchema.safeParse(body);
  if (!parsed.success) {
    return new Response('Invalid request', { status: 400 });
  }

  const { message, imageBase64, mimeType, conversationId, characterId, character: inlineCharacter } = parsed.data;

  if (!matchesMagic(imageBase64, mimeType)) {
    return new Response('Invalid image', { status: 400 });
  }

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
  let currentEmotion: EmotionType = 'neutral';
  let systemPrompt: string;

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
      aiModel: 'gemini',
    };
    currentEmotion = (historyResult.findLast((m) => m.emotion)?.emotion as EmotionType) ?? 'neutral';
    systemPrompt = buildSystemPrompt(character, currentEmotion, memoriesResult, userFactsResult);
  } else {
    if (!inlineCharacter) {
      return new Response('character data required when Supabase is not configured', { status: 400 });
    }
    character = { ...inlineCharacter, aiModel: 'gemini' };
    systemPrompt = buildSystemPrompt(character, currentEmotion, [], []);
  }

  await saveMessage(conversationId, 'user', message || '(이미지를 공유했어요)', undefined, `data:${mimeType};base64,${imageBase64}`);

  try {
    const reply = await geminiVision(message || '이 사진 어때?', imageBase64, mimeType, systemPrompt);
    const emotion = inferEmotionFromKeywords(reply, currentEmotion);
    await saveMessage(conversationId, 'assistant', reply, emotion);
    await maybeSummarize(conversationId, characterId).catch(() => {});
    return Response.json({ reply, emotion });
  } catch (err) {
    console.error('[image chat] Gemini error:', err);
    return Response.json({ error: '이미지 처리 중 오류가 발생했어요' }, { status: 500 });
  }
}
