'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCharacterStore } from '@/store/character';
import { saveCharacter } from '@/lib/memory/conversation';
import { DEFAULT_CHARACTER } from '@/types';
import type { Character } from '@/types';

const EMPTY_FORM: Omit<Character, 'id'> = {
  ...DEFAULT_CHARACTER,
  name: '',
  affinityScore: 0,
};

const FIELD_CONFIG = [
  ['name', '이름', '예: 수아'] as const,
  ['avatarEmoji', '이모지', '예: 🌸'] as const,
  ['personality', '성격', '따뜻하고 다정한...'] as const,
  ['backstory', '배경', '우리는 오랜 친구...'] as const,
  ['speechStyle', '말투', '친근하고 자연스럽게...'] as const,
] as const;

export default function CharactersPage() {
  const router = useRouter();
  const { characters, activeCharacterId, addCharacter, deleteCharacter, setActiveCharacter, initDefault } =
    useCharacterStore();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    initDefault();
  }, [initDefault]);

  const handleSelect = (id: string) => {
    setActiveCharacter(id);
    router.push('/');
  };

  const handleAdd = async () => {
    if (!form.name.trim() || saving) return;
    setSaving(true);
    try {
      const newChar = addCharacter({ ...form, affinityScore: 0 });
      await saveCharacter(newChar);
      setActiveCharacter(newChar.id);
      router.push('/');
    } catch {
      alert('캐릭터 저장 실패. Supabase 연결을 확인해주세요.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (characters.length <= 1) return;
    deleteCharacter(id);
  };

  return (
    <div className="min-h-screen bg-pink-50/30 dark:bg-gray-950 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.back()}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            ← 뒤로
          </button>
          <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">캐릭터 선택</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="text-pink-500 hover:text-pink-600 font-medium text-sm"
          >
            {showForm ? '취소' : '+ 새 캐릭터'}
          </button>
        </div>

        {showForm && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm mb-6 space-y-3">
            <h2 className="font-semibold text-gray-700 dark:text-gray-200 text-sm">새 캐릭터 만들기</h2>
            {FIELD_CONFIG.map(([key, label, placeholder]) => (
              <div key={key}>
                <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">{label}</label>
                <input
                  className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-pink-300"
                  placeholder={placeholder}
                  value={String(form[key] ?? '')}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                />
              </div>
            ))}
            <button
              onClick={handleAdd}
              disabled={!form.name.trim() || saving}
              className="w-full bg-pink-500 hover:bg-pink-600 disabled:opacity-40 text-white rounded-xl py-2 text-sm font-medium transition-colors"
            >
              {saving ? '저장 중...' : '캐릭터 추가'}
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          {characters.map((char) => (
            <button
              key={char.id}
              onClick={() => handleSelect(char.id)}
              className={`relative p-5 rounded-2xl text-left transition-all shadow-sm border-2 bg-white dark:bg-gray-900 ${
                char.id === activeCharacterId
                  ? 'border-pink-400 shadow-pink-100 dark:shadow-pink-900'
                  : 'border-transparent'
              }`}
            >
              {characters.length > 1 && (
                <button
                  onClick={(e) => handleDelete(char.id, e)}
                  className="absolute top-2 right-2 text-gray-300 hover:text-red-400 text-xs"
                >
                  ✕
                </button>
              )}
              <div className="text-3xl mb-2">{char.avatarEmoji}</div>
              <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{char.name}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">{char.personality}</p>
              <div className="mt-2 flex items-center gap-1">
                <div
                  className="h-1.5 rounded-full bg-pink-300 dark:bg-pink-600 transition-all"
                  style={{ width: `${char.affinityScore ?? 0}%`, minWidth: 4 }}
                />
                <span className="text-xs text-gray-400">{char.affinityScore ?? 0}</span>
              </div>
              {char.id === activeCharacterId && (
                <span className="absolute top-2 left-3 text-xs text-pink-500 font-medium">활성</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
