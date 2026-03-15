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
          'max-w-[88%] rounded-[22px] border px-4 py-3 text-sm leading-7 shadow-[0_14px_34px_-30px_rgba(15,23,42,0.8)]',
          isUser
            ? 'rounded-br-md border-primary bg-primary text-primary-foreground'
            : 'rounded-bl-md border-border/70 bg-secondary/80 text-secondary-foreground',
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
