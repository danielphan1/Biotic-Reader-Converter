// DOCX runtime. mammoth does the byte-parsing (unzip + OOXML walk); we only route
// its plain-text output through the shared normalize/split fan-in, so a Word file
// becomes the SAME ExtractedDoc { paragraphs } as TXT/PDF.
//
// PRIV-01: mammoth is dynamically imported (keeps the ~400KB lib out of the initial
// bundle and avoids any SSR/prerender import-time surprise), and it never touches
// the network — it reads only the package-internal zip parts of the file in hand.
//
// D-16 plain-text path: we call extractRawText, NOT convertToHtml. There is no HTML
// sink, no DOMPurify, no dangerouslySetInnerHTML — extracted text flows to React as
// text nodes only. Tables/lists are flattened to text lines by extractRawText (D-17).

import type { ExtractContext, ExtractResult, ExtractStrategy } from "./strategy";
import { normalize } from "./normalize";
import { splitParagraphs } from "./split";

/**
 * Extract a .docx ArrayBuffer into an ExtractedDoc. mammoth.extractRawText unzips
 * and flattens the document (paragraphs, list items, and table cells all become
 * text lines). On any parse failure we classify into the closed taxonomy; an
 * aborted signal (checked after the parse resolves — resolve-then-discard) yields
 * 'cancelled'; a document with no readable text yields 'empty'.
 */
export async function extractDocx(buf: ArrayBuffer, signal: AbortSignal): Promise<ExtractResult> {
  let value: string;
  try {
    const mammoth = await import("mammoth");
    // mammoth ships two unzip builds: the BROWSER build reads only `arrayBuffer`,
    // the NODE build (used by the vitest node-env tests) reads only `buffer`. Both
    // funnel to JSZip.loadAsync, which accepts an ArrayBuffer either way — so we
    // pass the same ArrayBuffer under BOTH keys to work in the browser app and the
    // headless test without an environment sniff.
    const result = await mammoth.extractRawText({ arrayBuffer: buf, buffer: buf as never });
    value = result.value; // ignore result.messages — extractRawText emits no markup
  } catch (e) {
    return classifyDocxError(e);
  }

  // Cancel is honored after the parse resolves: mammoth has no AbortSignal hook, so
  // we let it finish and discard the result (RESEARCH Q2). Bounded by the 25MB cap.
  if (signal.aborted) return { error: true, reason: "cancelled" };

  const paragraphs = splitParagraphs(normalize(value));
  if (paragraphs.length === 0) return { error: true, reason: "empty" };
  return { ok: true, doc: { paragraphs } };
}

/**
 * Pure classifier for a mammoth/jszip failure — kept message-based (mammoth errors
 * carry no stable `.name`) and side-effect-free so the routing is unit-provable.
 * "Could not find main document part" means the zip is not a Word doc; the
 * central-directory/corrupt family means a damaged zip; anything else is unknown.
 */
export function classifyDocxError(e: unknown): ExtractResult {
  const message = (e as { message?: string } | null)?.message ?? "";
  if (/Could not find main document part/i.test(message)) {
    return { error: true, reason: "unsupported" };
  }
  if (/(central directory|end of central|corrupt|invalid|truncated)/i.test(message)) {
    return { error: true, reason: "corrupt" };
  }
  return { error: true, reason: "unknown" };
}

/**
 * ExtractStrategy adapter so DOCX plugs into the same fan-in as TXT/PDF. Unlike
 * pdfStrategy it does NOT thread ctx.onProgress — DOCX parse is indeterminate (D-19).
 */
export const docxStrategy: ExtractStrategy = {
  kind: "docx",
  async extract(file: File, ctx: ExtractContext): Promise<ExtractResult> {
    const buf = await file.arrayBuffer();
    return extractDocx(buf, ctx.signal ?? new AbortController().signal);
  },
};
