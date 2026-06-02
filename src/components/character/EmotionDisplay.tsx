'use client';

import { EMOTION_EMOJI, EMOTION_COLOR } from '@/types';
import type { EmotionType } from '@/types';

interface Props {
  emotion: EmotionType;
  size?: 'sm' | 'md' | 'lg';
}

const SIZE = { sm: 'text-2xl', md: 'text-4xl', lg: 'text-6xl' };

export function EmotionDisplay({ emotion, size = 'md' }: Props) {
  return (
    <div
      className="flex items-center justify-center rounded-full transition-all duration-500"
      style={{
        backgroundColor: EMOTION_COLOR[emotion] + '40',
        width: size === 'lg' ? 80 : size === 'md' ? 56 : 36,
        height: size === 'lg' ? 80 : size === 'md' ? 56 : 36,
      }}
    >
      <span className={`${SIZE[size]} animate-bounce`} style={{ animationDuration: '2s' }}>
        {EMOTION_EMOJI[emotion]}
      </span>
    </div>
  );
}
