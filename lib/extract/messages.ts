import type { ExtractFailReason } from "./strategy";

// INPUT-07 copy: one specific, actionable, CALM message per failure reason —
// never a silent failure or a generic error. Wording stays honest (no promises
// of features not yet shipped: the `scanned` message does NOT tease OCR, which
// is Phase 5) and uses "biotic" naming only — never the trademarked term
// (LAND-03). Rendered in the muted (non-destructive-red) style from Phase 1.
//
// `cancelled` is intentionally excluded: a user-initiated cancel silently resets
// the card with no message. The Exclude makes the map exhaustively cover every
// reason that DOES surface copy (TypeScript enforces it).
export const FAIL_MESSAGES: Record<
  Exclude<ExtractFailReason, "cancelled">,
  { heading?: string; body: string }
> = {
  empty: {
    body: "This file doesn't contain any readable text. Try a different file.",
  },
  scanned: {
    body: "This PDF has no selectable text — it looks like a scan or photo. Try a text-based PDF.",
  },
  password: {
    body: "This file is password-protected, so its text can't be read. Try an unlocked copy.",
  },
  corrupt: {
    body: "This file looks damaged or isn't a readable document. Try re-saving or exporting it again.",
  },
  unsupported: {
    body: "This file isn't supported. Try a .txt file, a text-based PDF, or a Word (.docx) document.",
  },
  oversize: {
    body: "This file is larger than 25 MB. Try a smaller file.",
  },
  unknown: {
    body: "Something went wrong reading this file. Try again, or use a different file.",
  },
};
