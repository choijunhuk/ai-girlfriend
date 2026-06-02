import type { EmotionType } from '@/types';

const VALID_EMOTIONS: EmotionType[] = [
  'happy', 'sad', 'excited', 'neutral', 'angry', 'shy', 'loving', 'worried',
];

export function parseEmotion(raw: string, fallback: EmotionType): EmotionType {
  const cleaned = raw.trim().toLowerCase() as EmotionType;
  return VALID_EMOTIONS.includes(cleaned) ? cleaned : fallback;
}

export function inferEmotionFromKeywords(message: string, current: EmotionType): EmotionType {
  const text = message.toLowerCase();

  if (/사랑|보고싶|좋아|설레|두근/.test(text)) return 'loving';
  if (/신나|재밌|흥미|대박|와/.test(text)) return 'excited';
  if (/슬프|울|힘들|우울|외로/.test(text)) return 'sad';
  if (/화나|짜증|싫어|그만/.test(text)) return 'angry';
  if (/부끄|수줍|쑥스|민망/.test(text)) return 'shy';
  if (/걱정|불안|무서|무섭/.test(text)) return 'worried';
  if (/행복|좋은|기쁘|웃|ㅋ/.test(text)) return 'happy';

  return current;
}
