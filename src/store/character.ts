import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Character, AIModel } from '@/types';
import { DEFAULT_CHARACTER } from '@/types';

interface CharacterStore {
  characters: Character[];
  activeCharacterId: string | null;
  character: Character | null;
  isLoading: boolean;

  setCharacter: (character: Character) => void;
  addCharacter: (character: Omit<Character, 'id'>) => Character;
  deleteCharacter: (id: string) => void;
  setActiveCharacter: (id: string) => void;
  updateField: <K extends keyof Character>(key: K, value: Character[K]) => void;
  setModel: (model: AIModel) => void;
  bumpAffinity: (delta: number) => void;
  initDefault: () => void;
}

function deriveCharacter(characters: Character[], activeId: string | null): Character | null {
  return characters.find((c) => c.id === activeId) ?? null;
}

export const useCharacterStore = create<CharacterStore>()(
  persist(
    (set, get) => ({
      characters: [],
      activeCharacterId: null,
      character: null,
      isLoading: false,

      setCharacter: (character) => {
        const characters = get().characters.map((c) =>
          c.id === character.id ? character : c
        );
        set({ characters, character: deriveCharacter(characters, get().activeCharacterId) });
      },

      addCharacter: (data) => {
        const newChar: Character = { id: crypto.randomUUID(), ...data };
        const characters = [...get().characters, newChar];
        set({ characters });
        return newChar;
      },

      deleteCharacter: (id) => {
        const characters = get().characters.filter((c) => c.id !== id);
        const activeCharacterId =
          get().activeCharacterId === id
            ? (characters[0]?.id ?? null)
            : get().activeCharacterId;
        set({ characters, activeCharacterId, character: deriveCharacter(characters, activeCharacterId) });
      },

      setActiveCharacter: (id) => {
        const { characters } = get();
        set({ activeCharacterId: id, character: deriveCharacter(characters, id) });
      },

      updateField: (key, value) => {
        const { character, characters, activeCharacterId } = get();
        if (!character) return;
        const updated = characters.map((c) =>
          c.id === character.id ? { ...c, [key]: value } : c
        );
        set({ characters: updated, character: deriveCharacter(updated, activeCharacterId) });
      },

      setModel: (model) => {
        const { character, characters, activeCharacterId } = get();
        if (!character) return;
        const updated = characters.map((c) =>
          c.id === character.id ? { ...c, aiModel: model } : c
        );
        set({ characters: updated, character: deriveCharacter(updated, activeCharacterId) });
      },

      bumpAffinity: (delta) => {
        const { character, characters, activeCharacterId } = get();
        if (!character) return;
        const current = character.affinityScore ?? 0;
        const next = Math.min(100, Math.max(0, current + delta));
        const updated = characters.map((c) =>
          c.id === character.id ? { ...c, affinityScore: next } : c
        );
        set({ characters: updated, character: deriveCharacter(updated, activeCharacterId) });
      },

      initDefault: () => {
        const { characters, activeCharacterId } = get();
        if (characters.length > 0) {
          if (!activeCharacterId) {
            const id = characters[0].id;
            set({ activeCharacterId: id, character: deriveCharacter(characters, id) });
          } else if (!get().character) {
            set({ character: deriveCharacter(characters, activeCharacterId) });
          }
          return;
        }
        const defaultChar: Character = {
          id: crypto.randomUUID(),
          ...DEFAULT_CHARACTER,
          affinityScore: 0,
        };
        set({
          characters: [defaultChar],
          activeCharacterId: defaultChar.id,
          character: defaultChar,
        });
      },
    }),
    {
      name: 'ai-girlfriend-characters-v2',
      partialize: (state) => ({
        characters: state.characters,
        activeCharacterId: state.activeCharacterId,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.character = deriveCharacter(state.characters, state.activeCharacterId);
        }
      },
    }
  )
);
