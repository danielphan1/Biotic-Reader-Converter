// The extraction fan-in contract. Every input format (TXT here, PDF in 02-04,
// DOCX in Phase 3, OCR in Phase 5) implements ExtractStrategy and normalizes to
// the SAME ExtractedDoc { paragraphs } the transform engine already consumes.
//
// Design: a discriminated ExtractResult union carries either a decoded doc or a
// single ExtractFailReason from a closed taxonomy, so the UI (02-03/02-05) maps
// each reason to ONE specific, actionable message (INPUT-07) — never a silent
// failure or a generic error.

import type { ExtractedDoc } from "@/lib/types";

// Re-export so strategy implementations import the fan-in shape from one place.
export type { ExtractedDoc };

/**
 * Closed taxonomy of why extraction failed. Each value maps to exactly one
 * user-facing message (INPUT-07). PDF adds the 'scanned'/'password' cases in
 * 02-04; TXT uses 'empty'/'unsupported'; validation uses 'oversize'/'unsupported'.
 */
export type ExtractFailReason =
  | "empty" // decoded successfully but no readable text
  | "scanned" // image-only / no text layer (PDF, 02-04)
  | "password" // encrypted / password-protected (PDF, 02-04)
  | "corrupt" // structurally invalid for its claimed format
  | "unsupported" // not a format we handle (magic-byte/decoder reject)
  | "oversize" // exceeds MAX_BYTES before any parse
  | "cancelled" // user aborted via AbortSignal
  | "unknown"; // unclassified failure

/**
 * Result of an extraction attempt. `ok` carries the normalized doc; the failure
 * branch carries a single reason from the taxonomy above.
 */
export type ExtractResult =
  | { ok: true; doc: ExtractedDoc }
  | { error: true; reason: ExtractFailReason };

/**
 * Per-extraction context: progress reporting for the determinate bar (D-14) and
 * a cancel signal (D-15). Both optional so the simplest strategy (TXT) ignores them.
 */
export interface ExtractContext {
  onProgress?(page: number, total: number): void;
  signal?: AbortSignal;
}

/**
 * The interface every input format implements. `kind` is the validated format
 * tag; `extract` consumes the raw File and returns a normalized ExtractResult.
 */
export interface ExtractStrategy {
  readonly kind: "txt" | "pdf" | "docx";
  extract(file: File, ctx: ExtractContext): Promise<ExtractResult>;
}
