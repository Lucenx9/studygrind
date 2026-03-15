import { useState, useRef, useCallback } from 'react';
import { FileUp, Loader2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { t, type Language } from '@/lib/i18n';
import type { PdfExtractionWarning } from '@/lib/pdf';

interface PdfDropzoneProps {
  onExtracted: (text: string) => void;
  language: Language;
}

export function PdfDropzone({ onExtracted, language }: PdfDropzoneProps) {
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [warnings, setWarnings] = useState<PdfExtractionWarning[]>([]);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (file.type !== 'application/pdf') {
      setError(t('pdf.only', language));
      return;
    }

    setLoading(true);
    setError(null);
    setWarnings([]);

    try {
      // Dynamic import: PDF.js is only loaded when user actually drops/selects a PDF
      const { extractTextFromPdf } = await import('@/lib/pdf');
      const result = await extractTextFromPdf(file);
      setWarnings(result.warnings);

      if (!result.text.trim()) {
        setError(t('pdf.noText', language));
        return;
      }

      onExtracted(result.text);
    } catch {
      setError(t('pdf.failedRead', language));
    } finally {
      setLoading(false);
    }
  }, [language, onExtracted]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => setDragging(false), []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  }, [handleFile]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      inputRef.current?.click();
    }
  }, []);

  return (
    <div className="space-y-2">
      <div
        role="button"
        tabIndex={loading ? -1 : 0}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        onKeyDown={handleKeyDown}
        aria-label={t('pdf.dropHere', language)}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-3 rounded-[24px] border-2 border-dashed p-6 text-center transition-[border-color,background-color,transform] duration-200',
          dragging ? 'border-primary bg-primary/6' : 'border-border/70 bg-background/55 hover:border-primary/40 hover:bg-accent/45',
          loading && 'pointer-events-none opacity-60',
        )}
      >
        <input ref={inputRef} type="file" accept="application/pdf" onChange={handleInputChange} className="hidden" />
        {loading ? (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">{t('pdf.extracting', language)}</p>
          </>
        ) : (
          <>
            <div className="flex h-14 w-14 items-center justify-center rounded-[22px] bg-primary/10 text-primary">
              <FileUp className="h-7 w-7" />
            </div>
            <p className="text-sm font-medium text-foreground">{t('pdf.dropHere', language)}</p>
            <p className="text-xs leading-6 text-muted-foreground">{t('pdf.extractedBelow', language)}</p>
          </>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {warnings.map((warning, i) => (
        <div key={i} className="flex items-start gap-2 rounded-2xl bg-yellow-500/10 p-3 text-sm">
          <AlertTriangle className="h-4 w-4 shrink-0 text-yellow-600 dark:text-yellow-400 mt-0.5" />
          <p className="text-yellow-700 dark:text-yellow-300">
            {warning.type === 'page-limit'
              ? t('pdf.pagesLimited', language).replace('{max}', String(warning.maxPages)).replace('{total}', String(warning.totalPages))
              : t('pdf.scannedWarning', language)}
          </p>
        </div>
      ))}
    </div>
  );
}
