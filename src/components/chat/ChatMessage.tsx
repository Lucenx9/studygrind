import type { ChatMessage as ChatMessageType } from '@/lib/types';
import { cn } from '@/lib/utils';
import { HelpCircle } from 'lucide-react';

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
          isUser
            ? 'bg-primary text-primary-foreground rounded-br-md'
            : 'bg-secondary text-secondary-foreground rounded-bl-md',
        )}
      >
        {!isUser && message.isQuestion && (
          <HelpCircle className="inline-block h-3.5 w-3.5 mr-1 opacity-60 -mt-0.5" />
        )}
        {message.content}
      </div>
    </div>
  );
}
