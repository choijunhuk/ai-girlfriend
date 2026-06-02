'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CharacterCard } from '@/components/character/CharacterCard';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { InputBar } from '@/components/chat/InputBar';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useChatStore } from '@/store/chat';
import { useCharacterStore } from '@/store/character';
import { createConversation, saveCharacter } from '@/lib/memory/conversation';
import type { EmotionType, Message } from '@/types';
import { EMOTION_EMOJI } from '@/types';

const POSITIVE_EMOTIONS: EmotionType[] = ['happy', 'loving', 'excited'];
const VALID_EMOTIONS = new Set(Object.keys(EMOTION_EMOJI) as EmotionType[]);

export default function Home() {
  const router = useRouter();
  const { character, initDefault, bumpAffinity } = useCharacterStore();
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
    clearMessages,
  } = useChatStore();

  const [emotionHistory, setEmotionHistory] = useState<EmotionType[]>([]);

  useEffect(() => {
    initDefault();
  }, [initDefault]);

  // Sync active character to Supabase on mount/switch — prevents phantom character 404s
  useEffect(() => {
    if (character) saveCharacter(character).catch(() => {});
  }, [character?.id]);

  const isCreatingConversation = useRef(false);
  const prevCharacterId = useRef<string | null>(null);

  useEffect(() => {
    if (!character) {
      prevCharacterId.current = null;
      return;
    }
    if (character.id === prevCharacterId.current) return;
    prevCharacterId.current = character.id;
    clearMessages();
    setConversationId(null);
  }, [character?.id, clearMessages, setConversationId]);

  useEffect(() => {
    if (!character || conversationId || isCreatingConversation.current) return;
    isCreatingConversation.current = true;
    createConversation(character.id)
      .then(setConversationId)
      .catch(console.error)
      .finally(() => { isCreatingConversation.current = false; });
  }, [character, conversationId, setConversationId]);

  const trackEmotion = useCallback((emotion: EmotionType) => {
    setEmotionHistory((prev) => [...prev.slice(-19), emotion]);
  }, []);

  const updateEmotion = useCallback(
    async (message: string) => {
      const current = useChatStore.getState().currentEmotion;
      try {
        const res = await fetch('/api/emotion', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message, currentEmotion: current }),
        });
        if (!res.ok) return;
        const { emotion } = await res.json();
        if (!emotion || !VALID_EMOTIONS.has(emotion)) return;
        setEmotion(emotion);
        trackEmotion(emotion);
        if (POSITIVE_EMOTIONS.includes(emotion)) {
          bumpAffinity(2);
        } else {
          bumpAffinity(1);
        }
      } catch {}
    },
    [setEmotion, trackEmotion, bumpAffinity]
  );

  const playTTS = useCallback((text: string) => {
    try {
      if (!('speechSynthesis' in window)) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ko-KR';
      window.speechSynthesis.speak(utterance);
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
            character: {
              id: character.id,
              name: character.name,
              personality: character.personality,
              backstory: character.backstory,
              speechStyle: character.speechStyle,
              avatarEmoji: character.avatarEmoji,
              aiModel: character.aiModel,
            },
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

        await updateEmotion(fullResponse);

        if (useChatStore.getState().ttsEnabled && fullResponse) {
          playTTS(fullResponse.slice(0, 200));
        }
      } catch {
        appendToLastAssistantMessage('\n(연결 오류가 발생했어요 😢)');
      } finally {
        setStreaming(false);
      }
    },
    [
      character, conversationId, isStreaming,
      addMessage, startAssistantMessage, appendToLastAssistantMessage,
      setStreaming, updateEmotion, playTTS,
    ]
  );

  const sendImage = useCallback(
    async (imageBase64: string, mimeType: string, caption: string) => {
      if (!character || !conversationId || isStreaming) return;

      const previewUrl = `data:${mimeType};base64,${imageBase64}`;
      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content: caption,
        imageUrl: previewUrl,
        createdAt: new Date(),
      };
      addMessage(userMsg);
      setStreaming(true);
      startAssistantMessage();

      try {
        const res = await fetch('/api/chat/image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: caption,
            imageBase64,
            mimeType,
            conversationId,
            characterId: character.id,
            character: {
              id: character.id,
              name: character.name,
              personality: character.personality,
              backstory: character.backstory,
              speechStyle: character.speechStyle,
              avatarEmoji: character.avatarEmoji,
              aiModel: character.aiModel,
            },
          }),
        });

        if (!res.ok) throw new Error('Image chat failed');
        const { reply, emotion } = await res.json();
        appendToLastAssistantMessage(reply);
        if (emotion) {
          setEmotion(emotion);
          trackEmotion(emotion);
          bumpAffinity(POSITIVE_EMOTIONS.includes(emotion) ? 3 : 1);
        }

        if (useChatStore.getState().ttsEnabled && reply) {
          playTTS(reply.slice(0, 200));
        }
      } catch {
        appendToLastAssistantMessage('\n(이미지 처리 중 오류가 발생했어요 😢)');
      } finally {
        setStreaming(false);
      }
    },
    [
      character, conversationId, isStreaming,
      addMessage, startAssistantMessage, appendToLastAssistantMessage,
      setStreaming, setEmotion, trackEmotion, bumpAffinity, playTTS,
    ]
  );

  if (!character) {
    return (
      <div className="h-screen flex items-center justify-center bg-white dark:bg-gray-950">
        <div className="text-4xl animate-spin">🌸</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-pink-50/30 dark:bg-gray-950 overflow-hidden">
      <aside className="hidden md:flex flex-col w-52 p-4 border-r border-pink-100 dark:border-gray-800 bg-white/60 dark:bg-gray-900/60 shrink-0">
        <CharacterCard character={character} emotion={currentEmotion} emotionHistory={emotionHistory} />
      </aside>

      <main className="flex flex-col flex-1 overflow-hidden">
        <header className="flex items-center gap-3 px-4 py-3 border-b border-pink-100 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80">
          <span className="text-2xl md:hidden">{character.avatarEmoji}</span>
          <div className="md:hidden">
            <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{character.name}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
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
          <div className="flex-1" />
          <ThemeToggle />
          <button
            onClick={() => router.push('/characters')}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-sm"
            title="캐릭터 변경"
          >
            👥
          </button>
          <button
            onClick={() => router.push('/settings')}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-sm"
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
          onSendImage={sendImage}
          disabled={isStreaming || !conversationId}
          ttsEnabled={ttsEnabled}
          onToggleTTS={toggleTTS}
        />
      </main>
    </div>
  );
}
