import { create } from 'zustand';
import type { Message, EmotionType } from '@/types';

interface ChatStore {
  messages: Message[];
  currentEmotion: EmotionType;
  isStreaming: boolean;
  conversationId: string | null;
  ttsEnabled: boolean;

  setConversationId: (id: string | null) => void;
  addMessage: (message: Message) => void;
  appendToLastAssistantMessage: (text: string) => void;
  setStreaming: (val: boolean) => void;
  setEmotion: (emotion: EmotionType) => void;
  toggleTTS: () => void;
  clearMessages: () => void;
  startAssistantMessage: () => string;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: [],
  currentEmotion: 'neutral',
  isStreaming: false,
  conversationId: null,
  ttsEnabled: false,

  setConversationId: (id) => set({ conversationId: id ?? null }),

  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),

  startAssistantMessage: () => {
    const id = crypto.randomUUID();
    set((state) => ({
      messages: [
        ...state.messages,
        { id, role: 'assistant', content: '', createdAt: new Date() },
      ],
    }));
    return id;
  },

  appendToLastAssistantMessage: (text) =>
    set((state) => {
      const msgs = [...state.messages];
      const last = msgs[msgs.length - 1];
      if (last?.role === 'assistant') {
        msgs[msgs.length - 1] = { ...last, content: last.content + text };
      }
      return { messages: msgs };
    }),

  setStreaming: (val) => set({ isStreaming: val }),

  setEmotion: (emotion) => set({ currentEmotion: emotion }),

  toggleTTS: () => set((state) => ({ ttsEnabled: !state.ttsEnabled })),

  clearMessages: () => set({ messages: [] }),
}));
