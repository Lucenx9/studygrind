import { useEffect, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import type { ChatHistory } from '@/lib/types';
import { X, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { t, type Language } from '@/lib/i18n';
import { WARN_THRESHOLD } from '@/hooks/useChat';

interface ChatPanelProps {
  isOpen: boolean;
  history: ChatHistory | null;
  loading: boolean;
  canSendMore: boolean;
  messagesRemaining: number;
  language: Language;
  onSend: (message: string) => void;
  onClose: () => void;
}

export function ChatPanel({ isOpen, history, loading, canSendMore, messagesRemaining, language, onSend, onClose }: ChatPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history?.messages.length, isOpen, loading]);

  useEffect(() => {
    if (isOpen) {
      panelRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const messageKeys = useMemo(() => {
    const counts = new Map<string, number>();

    return (history?.messages ?? []).map(message => {
      const baseKey = `${message.role}:${message.timestamp}:${message.content}`;
      const occurrence = (counts.get(baseKey) ?? 0) + 1;
      counts.set(baseKey, occurrence);
      return `${baseKey}:${occurrence}`;
    });
  }, [history?.messages]);

  return (
    <>
      {isOpen && (
        <button
          type="button"
          aria-label={t('chat.close', language)}
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px] md:hidden"
          onClick={onClose}
        />
      )}

      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        inert={!isOpen}
        aria-modal={isOpen || undefined}
        aria-hidden={!isOpen}
        aria-labelledby="chat-panel-title"
        className={cn(
          'fixed right-0 top-0 z-50 flex h-full w-full max-w-full flex-col border-l border-border/65 bg-popover/94 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.8)] backdrop-blur-xl transition-transform duration-300 md:w-[408px]',
          isOpen ? 'translate-x-0' : 'translate-x-full pointer-events-none',
        )}
      >
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-4 pt-[max(1rem,env(safe-area-inset-top))]">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-[14px] bg-primary/10 text-primary">
              <MessageCircle className="h-4 w-4" />
            </div>
            <div>
              <span id="chat-panel-title" className="text-sm font-semibold tracking-[-0.01em]">{t('chat.socraticTutor', language)}</span>
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

        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5" aria-live="polite" aria-busy={loading}>
          {(!history || history.messages.length === 0) && (
            <div className="rounded-[20px] border border-border/60 bg-background/45 px-5 py-8 text-center text-sm text-muted-foreground">
              <MessageCircle className="mx-auto mb-3 h-8 w-8 opacity-25" />
              <p>{t('chat.tellMe', language)}</p>
              <p className="mt-1 text-xs">{t('chat.illGuide', language)}</p>
            </div>
          )}

          {history?.messages.map((msg, index) => (
            <ChatMessage key={messageKeys[index]} message={msg} />
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="flex gap-1 rounded-[18px] rounded-bl-md border border-border/55 bg-secondary/80 px-4 py-3">
                <span className="w-2 h-2 rounded-full bg-muted-foreground/50 bounce-dot" />
                <span className="w-2 h-2 rounded-full bg-muted-foreground/50 bounce-dot" />
                <span className="w-2 h-2 rounded-full bg-muted-foreground/50 bounce-dot" />
              </div>
            </div>
          )}
        </div>

        {canSendMore ? (
          <div>
            {messagesRemaining <= WARN_THRESHOLD && (
              <div className="px-4 pt-2 text-center text-xs text-muted-foreground/80">
                {t('chat.messagesRemaining', language).replace('{n}', String(messagesRemaining))}
              </div>
            )}
            <ChatInput
              onSend={onSend}
              disabled={loading}
              placeholder={t('chat.whatConfused', language)}
              inputLabel={t('chat.whatConfused', language)}
              sendLabel={t('chat.send', language)}
            />
          </div>
        ) : (
          <div className="border-t border-border/70 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] text-center text-xs text-muted-foreground">
            {t('chat.limitReached', language)}
          </div>
        )}
      </div>
    </>
  );
}
