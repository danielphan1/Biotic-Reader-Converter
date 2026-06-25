import type { ExtractedDoc } from "./types";

// THE pure, Unicode-aware, XSS-safe biotic transform engine (D-09).
// Reused unchanged by the demo, the on-screen reader, and the HTML/clipboard
// exporters, and by every later input strategy (Phases 2-5). No React imports —
// this file stays framework-agnostic so every surface calls the SAME engine.
//
// Safety: every branch escapes user text; the only raw markup it emits is its
// own <b> (per word) and <p> (per paragraph) tags. Passing the result to
// dangerouslySetInnerHTML is therefore safe (Pitfall 1 / V5 HIGH).
//
// Sources:
//   Intl.Segmenter — developer.mozilla.org/.../Intl/Segmenter
//   isWordLike semantics — developer.mozilla.org/.../Intl/Segmenter/segment
//   bold-boundary intuition — github.com/Gumball12/text-vide/blob/main/HOW.md

// Keep HTML escaping in exactly one place — a missed entity is an XSS hole.
const escapeHtml = (s: string): string =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Only bold words made of Latin letters (incl. accents). Non-Latin word-like
// segments (CJK, Arabic, Cyrillic, ...) pass through unchanged (XFORM-02).
const isLatinWord = (seg: string): boolean => /\p{Script=Latin}/u.test(seg);

// Skip number-bearing segments ("1234", "3rd") — they are not bolded (XFORM-02).
const hasDigit = (seg: string): boolean => /\p{Nd}/u.test(seg);

// Bold the leading ~40-50% of a word's LETTER GRAPHEMES (not code units), so
// accents/combining marks stay attached to their base letter (XFORM-01).
const boldWord = (word: string): string => {
  const graphemes = [
    ...new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(word),
  ].map((g) => g.segment);
  const n = graphemes.length;
  // round so even short words get >= 1 bold grapheme.
  const count = Math.max(1, Math.round(n * 0.45));
  const head = graphemes.slice(0, count).join("");
  const tail = graphemes.slice(count).join("");
  return `<b>${escapeHtml(head)}</b>${escapeHtml(tail)}`;
};

/**
 * Transform a single string into SAFE biotic HTML: each Latin, non-numeric,
 * word-like segment gets its leading fraction wrapped in <b>; numbers,
 * punctuation, whitespace, and non-Latin scripts are escaped and passed through
 * unbolded. `locale` tunes word segmentation when known.
 */
export function bioticHtml(text: string, locale?: string): string {
  const segmenter = new Intl.Segmenter(locale, { granularity: "word" });
  let out = "";
  for (const { segment, isWordLike } of segmenter.segment(text)) {
    if (isWordLike && isLatinWord(segment) && !hasDigit(segment)) {
      out += boldWord(segment);
    } else {
      out += escapeHtml(segment);
    }
  }
  return out;
}

/**
 * Paragraph-aware variant for the ExtractedDoc fan-in (carried to Phases 2-5):
 * each paragraph becomes one `<p>` of biotic HTML. Empty docs return "".
 */
export function bioticDoc(doc: ExtractedDoc): string {
  return doc.paragraphs.map((p) => `<p>${bioticHtml(p)}</p>`).join("\n");
}
