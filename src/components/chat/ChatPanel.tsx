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
  }, [history?.messages.length, loading]);

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/20 md:hidden" onClick={onClose} />
      )}

      <div
        className={cn(
          'fixed right-0 top-0 z-50 flex h-full w-full max-w-full flex-col border-l border-border/70 bg-card/95 shadow-[0_24px_60px_-32px_rgba(15,23,42,0.85)] backdrop-blur-xl transition-transform duration-300 md:w-[420px]',
          isOpen ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        <div className="flex items-center justify-between border-b border-border/70 px-5 py-4 pt-[max(1rem,env(safe-area-inset-top))]">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/12 text-primary">
              <MessageCircle className="h-4 w-4" />
            </div>
            <div>
              <span className="text-sm font-semibold">{t('chat.socraticTutor', language)}</span>
              {history && (
                <div className="text-xs text-muted-foreground">
                  {t('chat.level', language)} {history.socraticLevel}/3
                </div>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            aria-label={t('chat.close', language)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
          {(!history || history.messages.length === 0) && (
            <div className="rounded-[24px] border border-border/70 bg-background/55 px-5 py-8 text-center text-sm text-muted-foreground">
              <MessageCircle className="mx-auto mb-3 h-8 w-8 opacity-30" />
              <p>{t('chat.tellMe', language)}</p>
              <p className="text-xs mt-1">{t('chat.illGuide', language)}</p>
            </div>
          )}

          {history?.messages.map((msg, i) => (
            <ChatMessage key={i} message={msg} />
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="flex gap-1 rounded-[22px] rounded-bl-md bg-secondary px-4 py-3">
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
            inputLabel={t('chat.whatConfused', language)}
            sendLabel={t('chat.send', language)}
          />
        ) : (
          <div className="border-t border-border/70 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] text-center text-xs text-muted-foreground">
            {t('chat.limitReached', language)}
          </div>
        )}
      </div>
    </>
  );
}
