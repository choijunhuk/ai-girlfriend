'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCharacterStore } from '@/store/character';
import { saveCharacter } from '@/lib/memory/conversation';
import type { Character } from '@/types';
import { DEFAULT_CHARACTER } from '@/types';

const EMPTY: Character = { id: '', ...DEFAULT_CHARACTER };

const SPEECH_STYLES = [
  '친근하고 자연스러운 한국어로, 가끔 애교도 섞어가며 대화해',
  '존댓말을 쓰되 따뜻하고 다정하게 대화해',
  '반말로 편하게, 친한 친구처럼 대화해',
  '츤데레 스타일로, 직접적으로 감정 표현은 잘 못하지만 속은 따뜻해',
  '귀엽고 애교 넘치는 말투로 대화해',
];

const AVATARS = ['🌸', '💝', '🌺', '✨', '🦋', '🌙', '💫', '🌹'];

export function CharacterSettingsForm() {
  const router = useRouter();
  const { character, setCharacter } = useCharacterStore();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Character>(character ?? EMPTY);

  useEffect(() => {
    if (character) setForm(character);
  }, [character]);

  if (!character) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      setCharacter(form);
      await saveCharacter(form);
      router.push('/');
    } catch {
      alert('저장 실패. Supabase 연결을 확인해주세요.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">💝 캐릭터 설정</h1>

      {/* Avatar */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">아바타</label>
        <div className="flex gap-2 flex-wrap">
          {AVATARS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => setForm((f) => ({ ...f, avatarEmoji: emoji }))}
              className={`text-2xl p-2 rounded-xl border-2 transition-all ${
                form.avatarEmoji === emoji
                  ? 'border-pink-400 bg-pink-50 scale-110'
                  : 'border-transparent hover:border-gray-200'
              }`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Name */}
      <Field label="이름">
        <input
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          className={inputClass}
          placeholder="예: 아리, 지수, 소연..."
        />
      </Field>

      {/* Personality */}
      <Field label="성격">
        <textarea
          value={form.personality}
          onChange={(e) => setForm((f) => ({ ...f, personality: e.target.value }))}
          className={`${inputClass} h-20 resize-none`}
          placeholder="예: 따뜻하고 다정한 성격으로, 상대방의 말에 귀 기울이고 공감을 잘 해줘"
        />
      </Field>

      {/* Backstory */}
      <Field label="우리의 관계">
        <textarea
          value={form.backstory}
          onChange={(e) => setForm((f) => ({ ...f, backstory: e.target.value }))}
          className={`${inputClass} h-20 resize-none`}
          placeholder="예: 우리는 대학교 동기야. 3년 사귄 커플이야."
        />
      </Field>

      {/* Speech style */}
      <Field label="말투 스타일">
        <div className="space-y-2 mb-2">
          {SPEECH_STYLES.map((style) => (
            <button
              key={style}
              type="button"
              onClick={() => setForm((f) => ({ ...f, speechStyle: style }))}
              className={`w-full text-left text-xs px-3 py-2 rounded-lg border transition-all ${
                form.speechStyle === style
                  ? 'border-pink-400 bg-pink-50 text-pink-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-600'
              }`}
            >
              {style}
            </button>
          ))}
        </div>
        <textarea
          value={form.speechStyle}
          onChange={(e) => setForm((f) => ({ ...f, speechStyle: e.target.value }))}
          className={`${inputClass} h-16 resize-none text-xs`}
          placeholder="직접 입력..."
        />
      </Field>

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-pink-500 hover:bg-pink-600 text-white py-3 rounded-xl font-semibold transition-colors disabled:opacity-50"
      >
        {saving ? '저장 중...' : '💾 저장하고 대화하기'}
      </button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

const inputClass =
  'w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-100 transition-all';
