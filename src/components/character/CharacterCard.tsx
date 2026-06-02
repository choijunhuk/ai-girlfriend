'use client';

import Link from 'next/link';
import { EmotionDisplay } from './EmotionDisplay';
import { EMOTION_COLOR } from '@/types';
import type { Character, EmotionType } from '@/types';

interface Props {
  character: Character;
  emotion: EmotionType;
}

const MODEL_LABEL = { claude: '🟣 Claude', openai: '🟢 GPT-4o' };

export function CharacterCard({ character, emotion }: Props) {
  return (
    <div
      className="flex flex-col items-center gap-3 p-4 rounded-2xl shadow-sm transition-colors duration-500 w-full"
      style={{ backgroundColor: EMOTION_COLOR[emotion] + '30' }}
    >
      <div className="text-5xl">{character.avatarEmoji}</div>
      <EmotionDisplay emotion={emotion} size="sm" />
      <div className="text-center">
        <p className="font-bold text-gray-800 text-lg">{character.name}</p>
        <p className="text-xs text-gray-500 mt-0.5">{MODEL_LABEL[character.aiModel]}</p>
      </div>
      <Link
        href="/settings"
        className="text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2"
      >
        설정 변경
      </Link>
    </div>
  );
}
