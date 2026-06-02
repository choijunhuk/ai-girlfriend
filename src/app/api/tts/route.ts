import { NextRequest } from 'next/server';

// TTS is handled client-side via Web Speech API.
// This stub prevents 404 in case of stale client calls.
export async function POST(_req: NextRequest) {
  return new Response('TTS unavailable — use browser speech synthesis', { status: 501 });
}
