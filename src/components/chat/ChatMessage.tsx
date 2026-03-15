import type { ChatMessage as ChatMessageType } from '@/lib/types';
import { cn } from '@/lib/utils';
import { HelpCircle } from 'lucide-react';

interface ChatMessageProps {
  message: ChatMessageType;
}

/** Render inline markdown: **bold**, *italic*, `code`, and newlines */
function renderInlineMarkdown(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  // Split on markdown patterns: **bold**, *italic*, `code`
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    // Push text before match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    if (match[2]) {
      // **bold**
      parts.push(<strong key={match.index} className="font-semibold">{match[2]}</strong>);
    } else if (match[3]) {
      // *italic*
      parts.push(<em key={match.index}>{match[3]}</em>);
    } else if (match[4]) {
      // `code`
      parts.push(<code key={match.index} className="rounded bg-black/10 px-1 py-0.5 text-[13px] dark:bg-white/10">{match[4]}</code>);
    }

    lastIndex = match.index + match[0].length;
  }

  // Push remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

function renderContent(text: string): React.ReactNode {
  // Split by newlines, render inline markdown per line
  return text.split('\n').map((line, i, arr) => (
    <span key={i}>
      {renderInlineMarkdown(line)}
      {i < arr.length - 1 && <br />}
    </span>
  ));
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
        {isUser ? message.content : renderContent(message.content)}
      </div>
    </div>
  );
}
