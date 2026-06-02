import type { Message } from '@/types';

interface Props {
  message: Message;
  characterName: string;
  characterEmoji: string;
}

export function MessageBubble({ message, characterName, characterEmoji }: Props) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex items-end gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {!isUser && (
        <div className="text-xl shrink-0 mb-1">{characterEmoji}</div>
      )}
      <div
        className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
          isUser
            ? 'bg-pink-500 text-white rounded-br-sm'
            : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-bl-sm border border-gray-100 dark:border-gray-700'
        }`}
      >
        {!isUser && (
          <p className="text-xs font-semibold text-pink-400 mb-1">{characterName}</p>
        )}
        {message.imageUrl && (
          <img
            src={message.imageUrl}
            alt="공유된 이미지"
            className="rounded-xl mb-2 max-w-full max-h-48 object-cover"
          />
        )}
        {message.content && (
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        )}
        <p className={`text-xs mt-1 ${isUser ? 'text-pink-200' : 'text-gray-400 dark:text-gray-500'} text-right`}>
          {message.createdAt.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}
