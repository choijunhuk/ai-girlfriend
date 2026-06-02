import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Message } from '@/types';

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured. Add it to .env.local');
  return new GoogleGenerativeAI(apiKey);
}

function errorStream(msg: string): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    start(c) { c.enqueue(encoder.encode(msg)); c.close(); },
  });
}

function classifyError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes('429') || msg.includes('quota')) return '(API 할당량 초과 — aistudio.google.com에서 새 키 발급 필요 😢)';
  if (msg.includes('404')) return '(모델을 찾을 수 없어요 — Generative Language API 활성화 필요 😢)';
  if (msg.includes('API_KEY') || msg.includes('403')) return '(API 키 오류 — .env.local 확인 필요 😢)';
  return '(연결 오류가 발생했어요 😢)';
}

export async function streamWithGemini(
  messages: Message[],
  systemPrompt: string
): Promise<ReadableStream<Uint8Array>> {
  try {
    const model = getClient().getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: systemPrompt,
      generationConfig: { maxOutputTokens: 1024 },
    });

    const history = messages.slice(0, -1).map((m) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    }));

    const last = messages[messages.length - 1];
    const chat = model.startChat({ history });
    const result = await chat.sendMessageStream(last?.content ?? '');

    const encoder = new TextEncoder();
    return new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const text = chunk.text();
            if (text) controller.enqueue(encoder.encode(text));
          }
          controller.close();
        } catch (err) {
          controller.enqueue(encoder.encode(classifyError(err)));
          controller.close();
        }
      },
    });
  } catch (err) {
    return errorStream(classifyError(err));
  }
}

export async function geminiVision(
  message: string,
  imageBase64: string,
  mimeType: string,
  systemPrompt: string
): Promise<string> {
  const model = getClient().getGenerativeModel({
    model: 'gemini-1.5-flash',
    systemInstruction: systemPrompt,
    generationConfig: { maxOutputTokens: 500 },
  });

  const result = await model.generateContent([
    { inlineData: { mimeType, data: imageBase64 } },
    message,
  ]);
  return result.response.text();
}

export async function geminiEmotion(message: string, currentEmotion: string): Promise<string> {
  const model = getClient().getGenerativeModel({
    model: 'gemini-1.5-flash-8b',
    generationConfig: { maxOutputTokens: 10, temperature: 0.2 },
  });

  const result = await model.generateContent(
    `감정 분석기야. 메시지를 보고 AI 여자친구의 감정 상태를 판단해.\n반드시 다음 중 하나만 답해: happy, sad, excited, neutral, angry, shy, loving, worried\n현재 감정: ${currentEmotion}\n감정이 크게 바뀌지 않으면 현재 감정 유지해.\n메시지: ${message}`
  );
  return result.response.text().trim().toLowerCase();
}

export async function geminiGenerate(prompt: string): Promise<string> {
  const model = getClient().getGenerativeModel({
    model: 'gemini-1.5-flash-8b',
    generationConfig: { maxOutputTokens: 300 },
  });
  const result = await model.generateContent(prompt);
  return result.response.text();
}
