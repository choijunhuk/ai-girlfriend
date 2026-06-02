import { NextRequest } from 'next/server';
import { detectEmotion } from '@/lib/ai/openai';
import { parseEmotion, inferEmotionFromKeywords } from '@/lib/emotions/emotion-tracker';
import type { EmotionRequest, EmotionResponse, EmotionType } from '@/types';

export async function POST(req: NextRequest) {
  const body: EmotionRequest = await req.json();
  const { message, currentEmotion } = body;

  // Fast keyword inference first — avoids LLM call for obvious cases
  const keywordEmotion = inferEmotionFromKeywords(message, currentEmotion);
  if (keywordEmotion !== currentEmotion) {
    return Response.json({ emotion: keywordEmotion } satisfies EmotionResponse);
  }

  try {
    const raw = await detectEmotion(message, currentEmotion);
    const emotion = parseEmotion(raw, currentEmotion as EmotionType);
    return Response.json({ emotion } satisfies EmotionResponse);
  } catch {
    return Response.json({ emotion: currentEmotion } satisfies EmotionResponse);
  }
}
