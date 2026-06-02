import { supabase } from './supabase';
import type { Message, Character, MemorySummary } from '@/types';
export { getUserFacts, saveUserFacts } from './user-facts';

export async function createConversation(characterId: string): Promise<string> {
  const { data, error } = await supabase
    .from('conversations')
    .insert({ character_id: characterId })
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
}

export async function saveMessage(
  conversationId: string,
  role: 'user' | 'assistant',
  content: string,
  emotion?: string,
  imageUrl?: string
): Promise<void> {
  const { error } = await supabase.from('messages').insert({
    conversation_id: conversationId,
    role,
    content,
    emotion: emotion ?? 'neutral',
    ...(imageUrl ? { image_url: imageUrl } : {}),
  });
  if (error) throw error;
}

export async function getConversationHistory(
  conversationId: string,
  limit = 50
): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    role: row.role,
    content: row.content,
    emotion: row.emotion,
    imageUrl: row.image_url ?? undefined,
    createdAt: new Date(row.created_at),
  }));
}

export async function saveCharacter(character: Character): Promise<void> {
  const { error } = await supabase
    .from('characters')
    .upsert({
      id: character.id,
      name: character.name,
      personality: character.personality,
      backstory: character.backstory,
      speech_style: character.speechStyle,
      avatar_emoji: character.avatarEmoji,
      ai_model: character.aiModel,
      affinity_score: character.affinityScore ?? 0,
    });
  if (error) throw error;
}

export async function getCharacterById(characterId: string): Promise<Character | null> {
  const { data, error } = await supabase
    .from('characters')
    .select('*')
    .eq('id', characterId)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    name: data.name,
    personality: data.personality,
    backstory: data.backstory,
    speechStyle: data.speech_style,
    avatarEmoji: data.avatar_emoji,
    aiModel: data.ai_model,
    affinityScore: data.affinity_score ?? 0,
  };
}

export async function getMemorySummaries(
  characterId: string,
  limit = 5
): Promise<MemorySummary[]> {
  const { data, error } = await supabase
    .from('memory_summaries')
    .select('*')
    .eq('character_id', characterId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    characterId: row.character_id,
    summary: row.summary,
    periodStart: new Date(row.period_start),
    periodEnd: new Date(row.period_end),
  }));
}

export async function saveMemorySummary(
  characterId: string,
  summary: string,
  periodStart: Date,
  periodEnd: Date
): Promise<void> {
  const { error } = await supabase.from('memory_summaries').insert({
    character_id: characterId,
    summary,
    period_start: periodStart.toISOString(),
    period_end: periodEnd.toISOString(),
  });
  if (error) throw error;
}
