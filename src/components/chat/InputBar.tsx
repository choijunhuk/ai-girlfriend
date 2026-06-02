'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import { VoiceButton } from '@/components/voice/VoiceButton';

interface Props {
  onSend: (message: string) => void;
  onSendImage?: (imageBase64: string, mimeType: string, caption: string) => void;
  disabled?: boolean;
  ttsEnabled: boolean;
  onToggleTTS: () => void;
}

export function InputBar({ onSend, onSendImage, disabled, ttsEnabled, onToggleTTS }: Props) {
  const [input, setInput] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageData, setImageData] = useState<{ base64: string; mimeType: string } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    const trimmed = input.trim();
    if (disabled) return;
    if (imageData && onSendImage) {
      onSendImage(imageData.base64, imageData.mimeType, trimmed);
      setImageData(null);
      setPreviewUrl(null);
      setInput('');
      return;
    }
    if (!trimmed) return;
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

  const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
  const MAX_FILE_BYTES = 5 * 1024 * 1024;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    if (!ALLOWED_MIME.has(file.type)) {
      alert('JPEG, PNG, WebP, GIF 파일만 지원해요.');
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      alert('5MB 이하 이미지만 전송할 수 있어요.');
      return;
    }

    const mimeType = file.type as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif';
    const reader = new FileReader();
    reader.onerror = () => alert('이미지를 읽는 중 오류가 발생했어요.');
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      const base64 = dataUrl.split(',')[1];
      if (!base64) return;
      setImageData({ base64, mimeType });
      setPreviewUrl(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const canSend = imageData ? true : !!input.trim();

  return (
    <div className="border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 px-4 py-3">
      {previewUrl && (
        <div className="relative inline-block mb-2 ml-auto mr-0 flex justify-end">
          <img src={previewUrl} alt="preview" className="h-20 w-20 object-cover rounded-xl border border-gray-200 dark:border-gray-700" />
          <button
            onClick={() => { setPreviewUrl(null); setImageData(null); }}
            className="absolute -top-1.5 -right-1.5 bg-gray-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center"
          >
            ✕
          </button>
        </div>
      )}
      <div className="flex items-end gap-2 max-w-2xl mx-auto">
        <VoiceButton onTranscript={setInput} disabled={disabled} />

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={handleFileChange}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className="p-2.5 rounded-full shrink-0 bg-gray-100 dark:bg-gray-800 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-40"
          title="이미지 전송"
        >
          🖼️
        </button>

        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          placeholder={imageData ? '이미지 설명 추가 (선택)...' : '메시지를 입력하세요... (Enter 전송)'}
          rows={1}
          className="flex-1 resize-none rounded-2xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 px-4 py-2.5 text-sm focus:outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-100 dark:focus:ring-pink-900/30 transition-all"
          style={{ maxHeight: 120 }}
          disabled={disabled}
        />

        <button
          type="button"
          onClick={onToggleTTS}
          className={`p-2.5 rounded-full shrink-0 transition-colors ${
            ttsEnabled ? 'bg-pink-400 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
          title={ttsEnabled ? 'TTS 켜짐' : 'TTS 꺼짐'}
        >
          🔊
        </button>

        <button
          type="button"
          onClick={handleSend}
          disabled={!canSend || disabled}
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
