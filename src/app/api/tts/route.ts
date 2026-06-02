import { NextRequest } from 'next/server';
import { generateTTS } from '@/lib/ai/openai';
import type { TTSRequest } from '@/types';

export async function POST(req: NextRequest) {
  const body: TTSRequest = await req.json();
  const { text, voice = 'nova' } = body;

  if (!text) {
    return new Response('Missing text', { status: 400 });
  }

  const audioBuffer = await generateTTS(text.slice(0, 500), voice);

  return new Response(new Uint8Array(audioBuffer), {
    headers: {
      'Content-Type': 'audio/mpeg',
      'Cache-Control': 'no-cache',
    },
  });
}
