// Pure PDF classifiers — kept out of pdf.ts so the Nyquist-critical decisions
// (is this a scan? is it password-protected?) are unit-provable without PDF.js.

import type { ExtractResult } from "./strategy";

// Below this whole-document average, a PDF effectively has no text layer.
// Tunable on fixtures (RESEARCH A4). Evaluated AGGREGATE across all pages so a
// text doc with an image cover page is not misflagged as scanned (Pitfall 4).
export const AVG_CHARS_PER_PAGE_MIN = 8;

export function classifyDensity(paragraphs: string[], numPages: number): ExtractResult {
  const chars = paragraphs.join("").replace(/\s/g, "").length;
  // Scanned: has pages but the document-wide density is near zero.
  if (numPages > 0 && chars / numPages < AVG_CHARS_PER_PAGE_MIN) {
    return { error: true, reason: "scanned" };
  }
  // Empty: truly blank (no pages / no text at all).
  if (chars === 0 || paragraphs.length === 0) {
    return { error: true, reason: "empty" };
  }
  return { ok: true, doc: { paragraphs } };
}

// PDF.js exceptions carry a stable `.name`. The document promise rejects with
// PasswordException (encrypted) or InvalidPDFException (malformed); map by name.
export function classifyPdfError(e: unknown): ExtractResult {
  const name = (e as { name?: string } | null)?.name;
  if (name === "PasswordException") return { error: true, reason: "password" };
  if (name === "InvalidPDFException") return { error: true, reason: "corrupt" };
  return { error: true, reason: "unknown" };
}
