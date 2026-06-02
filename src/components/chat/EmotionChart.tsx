'use client';

import type { EmotionType } from '@/types';
import { EMOTION_EMOJI } from '@/types';

interface Props {
  history: EmotionType[];
}

const EMOTION_Y: Record<EmotionType, number> = {
  loving: 0,
  excited: 1,
  happy: 2,
  neutral: 3,
  shy: 4,
  worried: 5,
  sad: 6,
  angry: 7,
};

export function EmotionChart({ history }: Props) {
  if (history.length === 0) return null;

  const recent = history.slice(-10);
  const W = 160;
  const H = 48;
  const steps = recent.length;
  const stepW = W / Math.max(steps - 1, 1);

  const points = recent.map((e, i) => {
    const x = i * stepW;
    const y = (EMOTION_Y[e] / 7) * H;
    return { x, y, emotion: e };
  });

  const polyline = points.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <div className="mt-3">
      <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">감정 변화</p>
      <svg width={W} height={H + 12} className="overflow-visible">
        <polyline
          points={polyline}
          fill="none"
          stroke="#f9a8d4"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {points.map((p, i) => (
          <text key={i} x={p.x} y={p.y + 4} fontSize="10" textAnchor="middle">
            {EMOTION_EMOJI[p.emotion]}
          </text>
        ))}
      </svg>
    </div>
  );
}
