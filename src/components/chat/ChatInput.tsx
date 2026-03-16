import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled: boolean;
  placeholder?: string;
  inputLabel?: string;
  sendLabel?: string;
}

export function ChatInput({ onSend, disabled, placeholder, inputLabel, sendLabel }: ChatInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!disabled) {
      textareaRef.current?.focus();
    }
  }, [disabled]);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex items-end gap-3 border-t border-border/60 bg-background/72 px-4 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] backdrop-blur-xl">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder ?? ''}
        aria-label={inputLabel ?? placeholder ?? 'Message'}
        disabled={disabled}
        className="min-h-[52px] max-h-[140px] resize-none text-sm"
        rows={1}
      />
      <Button
        size="icon-sm"
        onClick={handleSubmit}
        disabled={!value.trim() || disabled}
        aria-label={sendLabel ?? 'Send message'}
        className="shrink-0"
      >
        <Send className="h-4 w-4" />
      </Button>
    </div>
  );
}
