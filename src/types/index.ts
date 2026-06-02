export type EmotionType =
  | 'happy'
  | 'sad'
  | 'excited'
  | 'neutral'
  | 'angry'
  | 'shy'
  | 'loving'
  | 'worried';

export type AIModel = 'gemini';

export type MessageRole = 'user' | 'assistant';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  emotion?: EmotionType;
  imageUrl?: string;
  createdAt: Date;
}

export interface Character {
  id: string;
  name: string;
  personality: string;
  backstory: string;
  speechStyle: string;
  avatarEmoji: string;
  aiModel: AIModel;
  affinityScore?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserFact {
  id: string;
  characterId: string;
  fact: string;
  createdAt: Date;
}

export interface ConversationState {
  id: string;
  characterId: string;
  messages: Message[];
  currentEmotion: EmotionType;
  isStreaming: boolean;
  isThinking: boolean;
}

export interface MemorySummary {
  id: string;
  characterId: string;
  summary: string;
  periodStart: Date;
  periodEnd: Date;
}

export interface ChatRequest {
  message: string;
  conversationId: string;
  characterId: string;
  model: AIModel;
}

export interface EmotionRequest {
  message: string;
  currentEmotion: EmotionType;
}

export interface EmotionResponse {
  emotion: EmotionType;
}

export interface TTSRequest {
  text: string;
  voice?: 'alloy' | 'nova' | 'shimmer' | 'echo' | 'fable' | 'onyx';
}

export const EMOTION_EMOJI: Record<EmotionType, string> = {
  happy: '😊',
  sad: '😢',
  excited: '🥰',
  neutral: '😊',
  angry: '😠',
  shy: '😳',
  loving: '💕',
  worried: '😟',
};

export const EMOTION_COLOR: Record<EmotionType, string> = {
  happy: '#FFB7C5',
  sad: '#A8C7FA',
  excited: '#FFD6E0',
  neutral: '#E8D5B7',
  angry: '#FFB3B3',
  shy: '#FFD4E8',
  loving: '#FF85A1',
  worried: '#C5CAE9',
};

export const DEFAULT_CHARACTER: Omit<Character, 'id' | 'createdAt' | 'updatedAt'> = {
  name: '아리',
  personality: '따뜻하고 다정한 성격으로, 상대방의 말에 귀 기울이고 공감을 잘 해줘',
  backstory: '우리는 오랜 친구에서 연인이 된 사이야. 서로를 잘 이해하고 편하게 대화해',
  speechStyle: '친근하고 자연스러운 한국어로, 가끔 애교도 섞어가며 대화해',
  avatarEmoji: '🌸',
  aiModel: 'gemini',
};
