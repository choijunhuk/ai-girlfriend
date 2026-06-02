'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { CharacterCard } from '@/components/character/CharacterCard';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { InputBar } from '@/components/chat/InputBar';
import { useChatStore } from '@/store/chat';
import { useCharacterStore } from '@/store/character';
import { createConversation } from '@/lib/memory/conversation';
import type { EmotionType, Message } from '@/types';

export default function Home() {
  const router = useRouter();
  const { character, initDefault } = useCharacterStore();
  const {
    messages,
    currentEmotion,
    isStreaming,
    conversationId,
    ttsEnabled,
    setConversationId,
    addMessage,
    startAssistantMessage,
    appendToLastAssistantMessage,
    setStreaming,
    setEmotion,
    toggleTTS,
  } = useChatStore();

  useEffect(() => {
    initDefault();
  }, [initDefault]);

  useEffect(() => {
    if (!character || conversationId) return;
    createConversation(character.id)
      .then(setConversationId)
      .catch(console.error);
  }, [character, conversationId, setConversationId]);

  const updateEmotion = useCallback(
    async (message: string, current: EmotionType) => {
      try {
        const res = await fetch('/api/emotion', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message, currentEmotion: current }),
        });
        const { emotion } = await res.json();
        setEmotion(emotion as EmotionType);
      } catch {}
    },
    [setEmotion]
  );

  const playTTS = useCallback(async (text: string) => {
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.onended = () => URL.revokeObjectURL(url);
      await audio.play();
    } catch {}
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!character || !conversationId || isStreaming) return;

      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content: text,
        createdAt: new Date(),
      };
      addMessage(userMsg);
      setStreaming(true);
      startAssistantMessage();

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: text,
            conversationId,
            characterId: character.id,
            model: character.aiModel,
          }),
        });

        if (!res.ok || !res.body) throw new Error('Chat failed');

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let fullResponse = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          fullResponse += chunk;
          appendToLastAssistantMessage(chunk);
        }

        await updateEmotion(fullResponse, currentEmotion);

        if (ttsEnabled && fullResponse) {
          await playTTS(fullResponse.slice(0, 200));
        }
      } catch {
        appendToLastAssistantMessage('\n(연결 오류가 발생했어요 😢)');
      } finally {
        setStreaming(false);
      }
    },
    [
      character, conversationId, isStreaming, currentEmotion, ttsEnabled,
      addMessage, startAssistantMessage, appendToLastAssistantMessage,
      setStreaming, updateEmotion, playTTS,
    ]
  );

  if (!character) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-4xl animate-spin">🌸</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-pink-50/30 overflow-hidden">
      <aside className="hidden md:flex flex-col w-48 p-4 border-r border-pink-100 bg-white/60 shrink-0">
        <CharacterCard character={character} emotion={currentEmotion} />
      </aside>

      <main className="flex flex-col flex-1 overflow-hidden">
        <header className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-pink-100 bg-white/80">
          <span className="text-2xl">{character.avatarEmoji}</span>
          <div>
            <p className="font-semibold text-gray-800 text-sm">{character.name}</p>
            <p className="text-xs text-gray-400">
              {currentEmotion === 'happy' && '😊 행복해요'}
              {currentEmotion === 'loving' && '💕 사랑스러워요'}
              {currentEmotion === 'excited' && '🥰 설레요'}
              {currentEmotion === 'neutral' && '😊 평온해요'}
              {currentEmotion === 'shy' && '😳 수줍어요'}
              {currentEmotion === 'sad' && '😢 슬퍼요'}
              {currentEmotion === 'worried' && '😟 걱정돼요'}
              {currentEmotion === 'angry' && '😠 삐졌어요'}
            </p>
          </div>
          <button
            onClick={() => router.push('/settings')}
            className="ml-auto text-gray-400 hover:text-gray-600 text-sm"
          >
            ⚙️
          </button>
        </header>

        <ChatWindow
          messages={messages}
          isStreaming={isStreaming}
          character={character}
          emotion={currentEmotion}
        />

        <InputBar
          onSend={sendMessage}
          disabled={isStreaming || !conversationId}
          ttsEnabled={ttsEnabled}
          onToggleTTS={toggleTTS}
        />
      </main>
    </div>
  );
}
