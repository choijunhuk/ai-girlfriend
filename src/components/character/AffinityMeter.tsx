'use client';

interface Props {
  score: number;
}

const LEVELS = [
  { min: 0, label: '처음 만난 사이', color: 'bg-gray-300 dark:bg-gray-600' },
  { min: 20, label: '친한 친구', color: 'bg-blue-300 dark:bg-blue-500' },
  { min: 40, label: '짝사랑 중', color: 'bg-purple-300 dark:bg-purple-500' },
  { min: 60, label: '연인', color: 'bg-pink-400 dark:bg-pink-500' },
  { min: 80, label: '소울메이트 💕', color: 'bg-rose-500 dark:bg-rose-500' },
];

function getLevel(score: number) {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (score >= LEVELS[i].min) return LEVELS[i];
  }
  return LEVELS[0];
}

export function AffinityMeter({ score }: Props) {
  const level = getLevel(score);
  const pct = Math.min(100, score);

  return (
    <div className="w-full mt-3">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-gray-500 dark:text-gray-400">호감도</span>
        <span className="text-xs font-medium text-pink-500 dark:text-pink-400">{level.label}</span>
      </div>
      <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${level.color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
