import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Use local worker instead of CDN for reliability and offline support
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;

const MAX_PAGES = 50;
const MIN_CHARS_PER_PAGE = 20; // Below this, likely a scanned/image page

export type PdfExtractionWarning =
  | { type: 'page-limit'; maxPages: number; totalPages: number }
  | { type: 'scanned' };

export interface PdfExtractionResult {
  text: string;
  totalPages: number;
  extractedPages: number;
  warnings: PdfExtractionWarning[];
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export async function extractTextFromPdf(file: File): Promise<PdfExtractionResult> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`PDF too large (${Math.round(file.size / 1024 / 1024)}MB). Maximum is 50MB.`);
  }
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer, isEvalSupported: false }).promise;

  const totalPages = pdf.numPages;
  const extractedPages = Math.min(totalPages, MAX_PAGES);
  const warnings: PdfExtractionWarning[] = [];

  if (totalPages > MAX_PAGES) {
    warnings.push({ type: 'page-limit', maxPages: MAX_PAGES, totalPages });
  }

  const textParts: string[] = [];
  let lowTextPages = 0;

  for (let i = 1; i <= extractedPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')
      .trim();

    if (pageText.length < MIN_CHARS_PER_PAGE) {
      lowTextPages++;
    }

    if (pageText) {
      textParts.push(pageText);
    }
  }

  // If most pages have very little text, it's likely a scanned PDF
  if (extractedPages > 0 && lowTextPages / extractedPages > 0.5) {
    warnings.push({ type: 'scanned' });
  }

  return {
    text: textParts.join('\n\n'),
    totalPages,
    extractedPages,
    warnings,
  };
}
