// TXT reference strategy — the simplest ExtractStrategy and the canonical shape
// PDF (02-04) mirrors: raw bytes -> decoded text -> shared normalize/split ->
// ExtractedDoc, with failures classified into the closed ExtractFailReason
// taxonomy. We decode from the ArrayBuffer (NOT File.text(), which is UTF-8 only
// and would mangle the UTF-16 fixture) and sniff the BOM to pick the encoding.

import type { ExtractResult } from "./strategy";
import { normalize } from "./normalize";
import { splitParagraphs } from "./split";

function sniffEncoding(b: Uint8Array): string {
  if (b[0] === 0xff && b[1] === 0xfe) return "utf-16le";
  if (b[0] === 0xfe && b[1] === 0xff) return "utf-16be";
  return "utf-8"; // includes the UTF-8 BOM, which TextDecoder consumes
}

/**
 * Decode a .txt ArrayBuffer into an ExtractedDoc. UTF-8 is decoded with
 * `fatal: true` so a binary file renamed .txt that slipped past validation is
 * rejected as 'unsupported' rather than yielding U+FFFD garbage. A decode that
 * produces no paragraphs is 'empty'. Used directly by the TXT UI slice (02-03).
 */
export async function extractTxt(buf: ArrayBuffer): Promise<ExtractResult> {
  const bytes = new Uint8Array(buf);
  const label = sniffEncoding(bytes);

  let text: string;
  try {
    // Only UTF-8 is fatal — UTF-16 has no invalid-byte concept for a BOM'd file.
    text = new TextDecoder(label, { fatal: label === "utf-8" }).decode(buf);
  } catch {
    return { error: true, reason: "unsupported" };
  }

  const paragraphs = splitParagraphs(normalize(text));
  if (paragraphs.length === 0) return { error: true, reason: "empty" };
  return { ok: true, doc: { paragraphs } };
}
