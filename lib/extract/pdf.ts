// Digital-PDF runtime. PDF.js does the heavy byte-parsing in its OWN bundled Web
// Worker (D-15 "off main thread" is satisfied — we do NOT author a second worker).
// The main thread runs a light per-page loop that drives determinate progress
// (D-14) and cooperative cancel (D-15), reflows each page, and frees memory.
//
// PRIV-01: the library is dynamically imported (keeps it out of the initial
// bundle AND avoids the SSR/prerender crash from a top-level import touching
// DOMMatrix — Pitfall 5), and the worker is the LOCAL self-hosted asset
// "/pdf.worker.min.mjs" — never an off-origin CDN, and never the
// import.meta.url bundler-worker pattern (which trips the Next production
// build). No cMapUrl: Latin-only for Phase 2.

import type { ExtractContext, ExtractResult, ExtractStrategy } from "./strategy";
import { reflowPage } from "./reflow";
import { normalize } from "./normalize";
import { splitParagraphs } from "./split";
import { classifyDensity, classifyPdfError } from "./classify";

let configured = false;

async function getPdfjs() {
  const pdfjs = await import("pdfjs-dist");
  if (!configured) {
    // Root-absolute local path — served by the static export, version-matched by
    // the predev/prebuild copy. The no-network guard asserts this stays local.
    pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
    configured = true;
  }
  return pdfjs;
}

/**
 * Extract a digital PDF's text layer into an ExtractedDoc. Reports per-page
 * progress, cooperatively cancels on an aborted signal (tearing down the worker),
 * frees each page, and classifies scanned/empty/password/corrupt outcomes.
 */
export async function extractPdf(
  buf: ArrayBuffer,
  onProgress: (page: number, total: number) => void,
  signal: AbortSignal,
): Promise<ExtractResult> {
  const pdfjs = await getPdfjs();
  const loadingTask = pdfjs.getDocument({ data: buf });
  // Do NOT set loadingTask.onPassword: providing a handler that never supplies a
  // password makes pdfjs WAIT (hang) for one. Leaving it unset is what makes the
  // document promise reject with PasswordException, which classifyPdfError maps.

  let pdf: Awaited<typeof loadingTask.promise>;
  try {
    pdf = await loadingTask.promise;
  } catch (e: unknown) {
    return classifyPdfError(e); // password | corrupt | unknown
  }

  const total = pdf.numPages;
  const pages: string[] = [];
  try {
    for (let i = 1; i <= total; i++) {
      // Cooperative cancel between pages (D-15); finally tears down the worker.
      if (signal.aborted) return { error: true, reason: "cancelled" };
      onProgress(i, total); // D-14: "Extracting page i of total"
      const page = await pdf.getPage(i);
      const tc = await page.getTextContent(); // heavy work runs in pdf.worker
      pages.push(reflowPage(tc.items));
      page.cleanup(); // free per-page memory (Pitfall 6)
    }
  } finally {
    // Always release the worker/document, on success OR cancel, to avoid leaks.
    await loadingTask.destroy();
  }

  const joined = pages.join("\n\n");
  const paragraphs = splitParagraphs(normalize(joined)); // NFC + ligatures
  return classifyDensity(paragraphs, total); // scanned | empty | { ok, doc }
}

/** ExtractStrategy adapter so PDF plugs into the same fan-in as TXT. */
export const pdfStrategy: ExtractStrategy = {
  kind: "pdf",
  async extract(file: File, ctx: ExtractContext): Promise<ExtractResult> {
    const buf = await file.arrayBuffer();
    return extractPdf(
      buf,
      ctx.onProgress ?? (() => {}),
      ctx.signal ?? new AbortController().signal,
    );
  },
};
