'use client';

import Link from 'next/link';
import { EmotionDisplay } from './EmotionDisplay';
import { AffinityMeter } from './AffinityMeter';
import { EmotionChart } from '@/components/chat/EmotionChart';
import { EMOTION_COLOR } from '@/types';
import type { Character, EmotionType } from '@/types';

interface Props {
  character: Character;
  emotion: EmotionType;
  emotionHistory?: EmotionType[];
}

const MODEL_LABEL = { claude: '🟣 Claude', openai: '🟢 GPT-4o' };

export function CharacterCard({ character, emotion, emotionHistory = [] }: Props) {
  return (
    <div
      className="flex flex-col items-center gap-3 p-4 rounded-2xl shadow-sm transition-colors duration-500 w-full"
      style={{ backgroundColor: EMOTION_COLOR[emotion] + '30' }}
    >
      <div className="text-5xl">{character.avatarEmoji}</div>
      <EmotionDisplay emotion={emotion} size="sm" />
      <div className="text-center">
        <p className="font-bold text-gray-800 dark:text-gray-100 text-lg">{character.name}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{MODEL_LABEL[character.aiModel]}</p>
      </div>
      <AffinityMeter score={character.affinityScore ?? 0} />
      {emotionHistory.length >= 3 && <EmotionChart history={emotionHistory} />}
      <div className="flex gap-3 mt-1">
        <Link
          href="/characters"
          className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 underline underline-offset-2"
        >
          캐릭터 변경
        </Link>
        <Link
          href="/settings"
          className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 underline underline-offset-2"
        >
          설정
        </Link>
      </div>
    </div>
  );
}
