import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import type { ChatHistory } from '@/lib/types';
import { X, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { t, type Language } from '@/lib/i18n';

interface ChatPanelProps {
  isOpen: boolean;
  history: ChatHistory | null;
  loading: boolean;
  canSendMore: boolean;
  language: Language;
  onSend: (message: string) => void;
  onClose: () => void;
}

export function ChatPanel({ isOpen, history, loading, canSendMore, language, onSend, onClose }: ChatPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history?.messages.length]);

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/20 md:hidden" onClick={onClose} />
      )}

      <div
        className={cn(
          'fixed right-0 top-0 z-50 flex h-full w-full flex-col bg-card/95 backdrop-blur-sm border-l border-border shadow-xl transition-transform duration-300 md:w-[400px]',
          isOpen ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">{t('chat.socraticTutor', language)}</span>
            {history && (
              <span className="text-xs text-muted-foreground">
                {t('chat.level', language)} {history.socraticLevel}/3
              </span>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
          {(!history || history.messages.length === 0) && (
            <div className="text-center text-sm text-muted-foreground py-8">
              <MessageCircle className="h-8 w-8 mx-auto mb-3 opacity-30" />
              <p>{t('chat.tellMe', language)}</p>
              <p className="text-xs mt-1">{t('chat.illGuide', language)}</p>
            </div>
          )}

          {history?.messages.map((msg, i) => (
            <ChatMessage key={i} message={msg} />
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-md bg-secondary px-4 py-3 flex gap-1">
                <span className="w-2 h-2 rounded-full bg-muted-foreground/50 bounce-dot" />
                <span className="w-2 h-2 rounded-full bg-muted-foreground/50 bounce-dot" />
                <span className="w-2 h-2 rounded-full bg-muted-foreground/50 bounce-dot" />
              </div>
            </div>
          )}
        </div>

        {canSendMore ? (
          <ChatInput
            onSend={onSend}
            disabled={loading}
            placeholder={t('chat.whatConfused', language)}
          />
        ) : (
          <div className="border-t border-border p-3 text-center text-xs text-muted-foreground">
            {t('chat.limitReached', language)}
          </div>
        )}
      </div>
    </>
  );
}
