import { NextRequest } from 'next/server';
import { z } from 'zod';
import { detectEmotion } from '@/lib/ai/openai';
import { parseEmotion, inferEmotionFromKeywords } from '@/lib/emotions/emotion-tracker';
import type { EmotionResponse, EmotionType } from '@/types';

const EmotionSchema = z.object({
  message: z.string().min(1).max(4000),
  currentEmotion: z.string(),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const parsed = EmotionSchema.safeParse(body);
  if (!parsed.success) {
    return new Response('Invalid request', { status: 400 });
  }

  const { message, currentEmotion } = parsed.data;

  const keywordEmotion = inferEmotionFromKeywords(message, currentEmotion as EmotionType);
  if (keywordEmotion !== currentEmotion) {
    return Response.json({ emotion: keywordEmotion } satisfies EmotionResponse);
  }

  try {
    const raw = await detectEmotion(message, currentEmotion);
    const emotion = parseEmotion(raw, currentEmotion as EmotionType);
    return Response.json({ emotion } satisfies EmotionResponse);
  } catch (err) {
    console.error('[emotion] detection failed:', err);
    return Response.json({ emotion: currentEmotion } satisfies EmotionResponse);
  }
}
