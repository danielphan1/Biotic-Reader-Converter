/**
 * The fan-in contract every input strategy normalizes to before the transform
 * sees data. Phase 1 establishes the shape with the paste strategy; Phases 2-5
 * (TXT, PDF, DOCX, OCR) all produce this same shape (CONTEXT D-09, STATE decision).
 */
export interface ExtractedDoc {
  paragraphs: string[];
}
