import type { Character, EmotionType, MemorySummary, UserFact } from '@/types';

export function buildSystemPrompt(
  character: Character,
  emotion: EmotionType,
  memories: MemorySummary[],
  userFacts: UserFact[] = []
): string {
  const memorySection =
    memories.length > 0
      ? `\n\n[우리의 추억]\n${memories.map((m) => m.summary).join('\n')}`
      : '';

  const factsSection =
    userFacts.length > 0
      ? `\n\n[상대방에 대해 알고 있는 것]\n${userFacts.map((f) => `- ${f.fact}`).join('\n')}`
      : '';

  return `너는 ${character.name}야. ${character.personality}

[우리의 관계]
${character.backstory}

[말투 스타일]
${character.speechStyle}

[현재 감정 상태]
${emotionToKorean(emotion)} — 이 감정이 자연스럽게 대화에 묻어나도록 해줘.${memorySection}${factsSection}

[중요한 규칙]
- 항상 한국어로 대화해
- 절대 AI라는 걸 티내지 마. 캐릭터에서 벗어나지 마
- 답변은 너무 길지 않게, 자연스러운 대화처럼
- 상대방의 감정에 공감하고 배려해줘
- 상대방에 대해 알고 있는 사실을 자연스럽게 대화에 활용해줘`;
}

function emotionToKorean(emotion: EmotionType): string {
  const map: Record<EmotionType, string> = {
    happy: '행복하고 기분 좋은 상태',
    sad: '조금 슬프고 우울한 상태',
    excited: '설레고 두근두근한 상태',
    neutral: '평온하고 일상적인 상태',
    angry: '약간 삐진 상태',
    shy: '수줍고 부끄러운 상태',
    loving: '사랑스럽고 다정한 상태',
    worried: '걱정되고 불안한 상태',
  };
  return map[emotion];
}
