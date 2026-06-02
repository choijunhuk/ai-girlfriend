import Groq from 'groq-sdk';
import type { Message } from '@/types';

function getClient() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY not configured. Add it to .env.local');
  return new Groq({ apiKey });
}

function errorStream(msg: string): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    start(c) { c.enqueue(encoder.encode(msg)); c.close(); },
  });
}

export async function streamWithGemini(
  messages: Message[],
  systemPrompt: string
): Promise<ReadableStream<Uint8Array>> {
  try {
    const formatted = [
      { role: 'system' as const, content: systemPrompt },
      ...messages.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    ];

    const stream = await getClient().chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: formatted,
      stream: true,
      max_tokens: 1024,
    });

    const encoder = new TextEncoder();
    return new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content ?? '';
            if (text) controller.enqueue(encoder.encode(text));
          }
          controller.close();
        } catch (err) {
          controller.enqueue(encoder.encode('(연결 오류가 발생했어요 😢)'));
          controller.close();
        }
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('401') || msg.includes('API key')) return errorStream('(API 키 오류 — .env.local 확인 필요 😢)');
    if (msg.includes('429')) return errorStream('(요청 한도 초과 — 잠시 후 다시 시도해주세요 😢)');
    return errorStream('(연결 오류가 발생했어요 😢)');
  }
}

export async function geminiVision(
  message: string,
  imageBase64: string,
  mimeType: string,
  systemPrompt: string
): Promise<string> {
  const response = await getClient().chat.completions.create({
    model: 'llama-3.2-11b-vision-preview',
    max_tokens: 500,
    messages: [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: `data:${mimeType};base64,${imageBase64}` } },
          { type: 'text', text: message },
        ],
      },
    ],
  });
  return response.choices[0]?.message?.content ?? '(응답 없음)';
}

export async function geminiEmotion(message: string, currentEmotion: string): Promise<string> {
  const response = await getClient().chat.completions.create({
    model: 'llama-3.1-8b-instant',
    max_tokens: 10,
    temperature: 0.2,
    messages: [
      {
        role: 'system',
        content: `감정 분석기야. 메시지를 보고 AI 여자친구의 감정 상태를 판단해. 반드시 다음 중 하나만 답해: happy, sad, excited, neutral, angry, shy, loving, worried. 현재 감정: ${currentEmotion}. 감정이 크게 바뀌지 않으면 현재 감정 유지해.`,
      },
      { role: 'user', content: message },
    ],
  });
  return response.choices[0]?.message?.content?.trim().toLowerCase() ?? currentEmotion;
}

export async function geminiGenerate(prompt: string): Promise<string> {
  const response = await getClient().chat.completions.create({
    model: 'llama-3.1-8b-instant',
    max_tokens: 300,
    messages: [{ role: 'user', content: prompt }],
  });
  return response.choices[0]?.message?.content ?? '';
}
