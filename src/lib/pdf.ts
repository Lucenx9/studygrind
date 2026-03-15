import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Use local worker instead of CDN for reliability and offline support
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;

const MAX_PAGES = 50;
const MIN_CHARS_PER_PAGE = 20; // Below this, likely a scanned/image page

export interface PdfExtractionResult {
  text: string;
  totalPages: number;
  extractedPages: number;
  warnings: string[];
}

export async function extractTextFromPdf(file: File): Promise<PdfExtractionResult> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const totalPages = pdf.numPages;
  const extractedPages = Math.min(totalPages, MAX_PAGES);
  const warnings: string[] = [];

  if (totalPages > MAX_PAGES) {
    warnings.push(
      `Only the first ${MAX_PAGES} pages were extracted to keep generation costs low (PDF has ${totalPages} pages).`
    );
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
    warnings.push(
      'This PDF appears to be scanned/image-based. Text extraction may not work well. Try copy-pasting your notes instead.'
    );
  }

  return {
    text: textParts.join('\n\n'),
    totalPages,
    extractedPages,
    warnings,
  };
}
