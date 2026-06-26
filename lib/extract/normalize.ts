// Normalize extracted text toward clean, reflowed reading text: expand the
// common typographic ligatures PDF/DOCX extraction can emit, then NFC-normalize
// so combining marks precompose (keeps the downstream grapheme-aware transform
// and search/copy behaving predictably). Pure — no DOM, no React, no PDF lib.

// Ligature -> ASCII expansion (U+FB00..U+FB06). FB05/FB06 (long-s-t / st) both
// map to "st"; we do not preserve the archaic long-s distinction in reading text.
const LIGATURES: Record<string, string> = {
  "ﬀ": "ff",
  "ﬁ": "fi",
  "ﬂ": "fl",
  "ﬃ": "ffi",
  "ﬄ": "ffl",
  "ﬅ": "st",
  "ﬆ": "st",
};

export function normalize(s: string): string {
  return s.replace(/[ﬀ-ﬆ]/g, (m) => LIGATURES[m] ?? m).normalize("NFC");
}
