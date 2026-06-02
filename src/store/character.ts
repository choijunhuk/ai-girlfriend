import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Character, AIModel } from '@/types';
import { DEFAULT_CHARACTER } from '@/types';

interface CharacterStore {
  character: Character | null;
  isLoading: boolean;
  setCharacter: (character: Character) => void;
  updateField: <K extends keyof Character>(key: K, value: Character[K]) => void;
  setModel: (model: AIModel) => void;
  initDefault: () => void;
}

export const useCharacterStore = create<CharacterStore>()(
  persist(
    (set, get) => ({
      character: null,
      isLoading: false,

      setCharacter: (character) => set({ character }),

      updateField: (key, value) => {
        const current = get().character;
        if (!current) return;
        set({ character: { ...current, [key]: value } });
      },

      setModel: (model) => {
        const current = get().character;
        if (!current) return;
        set({ character: { ...current, aiModel: model } });
      },

      initDefault: () => {
        if (get().character) return;
        set({
          character: {
            id: crypto.randomUUID(),
            ...DEFAULT_CHARACTER,
          },
        });
      },
    }),
    { name: 'ai-girlfriend-character' }
  )
);
