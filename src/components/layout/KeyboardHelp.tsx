import { useEffect } from 'react';
import type { Language } from '@/lib/i18n';

const SHORTCUTS = [
  { keys: ['1', '2', '3', '4'], it: 'Valuta risposta (Ripeti \u2192 Facile)', en: 'Rate answer (Again \u2192 Easy)' },
  { keys: ['A', 'B', 'C', 'D'], it: 'Seleziona opzione MCQ', en: 'Select MCQ option' },
  { keys: ['Enter'], it: 'Conferma risposta', en: 'Submit answer' },
  { keys: ['Ctrl', 'Z'], it: 'Annulla ultima valutazione', en: 'Undo last rating' },
  { keys: ['?'], it: 'Mostra/nascondi scorciatoie', en: 'Toggle shortcuts' },
];

export function KeyboardHelp({ language, onClose }: { language: Language; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === '?') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <>
      <button type="button" className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-label="Close" />
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-[24px] border border-[color:var(--sg-border-2)] bg-[color:var(--sg-surface-overlay-strong)] p-6 shadow-[var(--sg-overlay-shadow)] backdrop-blur-2xl">
        <h2 className="text-lg font-bold tracking-[-0.02em] mb-4">
          {language === 'it' ? 'Scorciatoie da tastiera' : 'Keyboard shortcuts'}
        </h2>
        <div className="space-y-3">
          {SHORTCUTS.map((s) => (
            <div key={s.en} className="flex items-center justify-between gap-4">
              <span className="text-sm text-muted-foreground">{language === 'it' ? s.it : s.en}</span>
              <div className="flex gap-1">
                {s.keys.map((k) => (
                  <kbd key={k} className="rounded-lg border border-[color:var(--sg-border-2)] bg-[color:var(--sg-surface-2)] px-2 py-1 text-xs font-mono font-semibold text-foreground">
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-5 text-center text-xs text-muted-foreground">
          {language === 'it' ? 'Premi ? o Esc per chiudere' : 'Press ? or Esc to close'}
        </p>
      </div>
    </>
  );
}
