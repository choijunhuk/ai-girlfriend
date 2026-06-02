import { supabase } from './supabase';
import type { UserFact } from '@/types';

export async function getUserFacts(characterId: string, limit = 20): Promise<UserFact[]> {
  const { data, error } = await supabase
    .from('user_facts')
    .select('*')
    .eq('character_id', characterId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) return [];

  return (data ?? []).map((row) => ({
    id: row.id,
    characterId: row.character_id,
    fact: row.fact,
    createdAt: new Date(row.created_at),
  }));
}

export async function saveUserFacts(characterId: string, facts: string[]): Promise<void> {
  if (facts.length === 0) return;
  const rows = facts.map((fact) => ({ character_id: characterId, fact }));
  await supabase.from('user_facts').insert(rows);
}
