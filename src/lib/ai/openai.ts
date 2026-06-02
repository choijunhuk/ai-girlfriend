import OpenAI from 'openai';
import type { Message } from '@/types';

function getClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function streamWithOpenAI(
  messages: Message[],
  systemPrompt: string
): Promise<ReadableStream<Uint8Array>> {
  const formattedMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...messages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
  ];

  const stream = await getClient().chat.completions.create({
    model: 'gpt-4o',
    messages: formattedMessages,
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
        controller.error(err);
      }
    },
  });
}

export async function generateTTS(text: string, voice: string = 'nova'): Promise<Buffer> {
  const response = await getClient().audio.speech.create({
    model: 'tts-1',
    voice: voice as 'alloy' | 'nova' | 'shimmer' | 'echo' | 'fable' | 'onyx',
    input: text,
  });
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function detectEmotion(message: string, currentEmotion: string): Promise<string> {
  const response = await getClient().chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `감정 분석기야. 메시지를 보고 AI 여자친구의 감정 상태를 판단해.
반드시 다음 중 하나만 답해: happy, sad, excited, neutral, angry, shy, loving, worried
현재 감정: ${currentEmotion}
감정이 크게 바뀌지 않으면 현재 감정 유지해.`,
      },
      { role: 'user', content: message },
    ],
    max_tokens: 10,
    temperature: 0.3,
  });
  return response.choices[0]?.message?.content?.trim().toLowerCase() ?? currentEmotion;
}
