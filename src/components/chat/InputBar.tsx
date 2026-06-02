'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import { VoiceButton } from '@/components/voice/VoiceButton';

interface Props {
  onSend: (message: string) => void;
  disabled?: boolean;
  ttsEnabled: boolean;
  onToggleTTS: () => void;
}

export function InputBar({ onSend, disabled, ttsEnabled, onToggleTTS }: Props) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  };

  return (
    <div className="border-t border-gray-100 bg-white px-4 py-3">
      <div className="flex items-end gap-2 max-w-2xl mx-auto">
        <VoiceButton onTranscript={setInput} disabled={disabled} />

        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          placeholder="메시지를 입력하세요... (Enter 전송)"
          rows={1}
          className="flex-1 resize-none rounded-2xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-100 transition-all"
          style={{ maxHeight: 120 }}
          disabled={disabled}
        />

        <button
          type="button"
          onClick={onToggleTTS}
          className={`p-2.5 rounded-full shrink-0 transition-colors ${
            ttsEnabled ? 'bg-pink-400 text-white' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
          }`}
          title={ttsEnabled ? 'TTS 켜짐' : 'TTS 꺼짐'}
        >
          🔊
        </button>

        <button
          type="button"
          onClick={handleSend}
          disabled={!input.trim() || disabled}
          className="bg-pink-500 hover:bg-pink-600 text-white p-2.5 rounded-full shrink-0 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
        >
          <svg className="w-5 h-5 rotate-90" fill="currentColor" viewBox="0 0 24 24">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
