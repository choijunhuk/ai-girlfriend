'use client';

import { useEffect, useRef } from 'react';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import type { Message, Character, EmotionType } from '@/types';

interface Props {
  messages: Message[];
  isStreaming: boolean;
  character: Character;
  emotion: EmotionType;
}

export function ChatWindow({ messages, isStreaming, character, emotion }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  if (messages.length === 0 && !isStreaming) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-gray-400 dark:text-gray-500 p-8">
        <span className="text-5xl">{character.avatarEmoji}</span>
        <p className="text-sm text-center">
          <span className="font-semibold text-pink-400">{character.name}</span>이(가) 기다리고 있어요 💕
          <br />
          <span className="text-xs">먼저 말을 걸어보세요</span>
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
      {messages.map((msg) => (
        <MessageBubble
          key={msg.id}
          message={msg}
          characterName={character.name}
          characterEmoji={character.avatarEmoji}
        />
      ))}
      {isStreaming && messages[messages.length - 1]?.role !== 'assistant' && (
        <TypingIndicator name={character.name} />
      )}
      <div ref={bottomRef} />
    </div>
  );
}
