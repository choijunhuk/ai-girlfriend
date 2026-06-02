import { NextRequest } from 'next/server';
import { z } from 'zod';
import { generateTTS } from '@/lib/ai/openai';

const TTSSchema = z.object({
  text: z.string().min(1).max(500),
  voice: z.enum(['alloy', 'nova', 'shimmer', 'echo', 'fable', 'onyx']).optional(),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const parsed = TTSSchema.safeParse(body);
  if (!parsed.success) {
    return new Response('Invalid request', { status: 400 });
  }

  const { text, voice = 'nova' } = parsed.data;
  const audioBuffer = await generateTTS(text, voice);

  return new Response(new Uint8Array(audioBuffer), {
    headers: {
      'Content-Type': 'audio/mpeg',
      'Cache-Control': 'no-cache',
    },
  });
}
