// Magic-byte file validation — the trust boundary where untrusted bytes (a
// renamed binary, a booby-trapped "document") enter the app. The EXTENSION is
// never the gate (T-02-01): we sniff content and enforce a hard size cap
// (T-02-02) BEFORE reading any bytes. Pure — no DOM beyond the standard File API.

import type { ExtractFailReason } from "./strategy";

// 25 MB cap, evaluated before any slice/read so a huge file can never be parsed.
export const MAX_BYTES = 25 * 1024 * 1024;

const PDF_SIG = "%PDF-";
const ZIP_SIG = [0x50, 0x4b, 0x03, 0x04]; // "PK\x03\x04" — zip/docx/xlsx container
// OLE2 / Compound File Binary — encrypted OOXML wraps the zip in this container
// (also legacy .doc; that collision is accepted, RESEARCH A2). It never reaches
// the PK branch, so an encrypted .docx must be sniffed here as 'password'.
const CFBF_SIG = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1];

export type ValidateResult =
  | { ok: true; kind: "txt" | "pdf" | "docx" }
  | { ok: false; reason: ExtractFailReason };

// True if the head looks like a text-bearing file: a leading UTF-8/UTF-16 BOM,
// or a byte profile with no NUL and <=5% C0 control chars (excluding the normal
// whitespace controls \t \n \v \f \r). UTF-16 text is BOM-gated here because its
// interleaved NUL bytes would otherwise read as "binary".
function looksLikeText(b: Uint8Array): boolean {
  if (b.length === 0) return true; // empty -> 'empty' is decided downstream, not here
  // BOM sniff: UTF-8 (EF BB BF), UTF-16LE (FF FE), UTF-16BE (FE FF).
  if (b[0] === 0xef && b[1] === 0xbb && b[2] === 0xbf) return true;
  if (b[0] === 0xff && b[1] === 0xfe) return true;
  if (b[0] === 0xfe && b[1] === 0xff) return true;
  let control = 0;
  for (let i = 0; i < b.length; i++) {
    const c = b[i];
    if (c === 0x00) return false; // a NUL byte means binary
    const isWhitespaceControl = c === 0x09 || c === 0x0a || c === 0x0b || c === 0x0c || c === 0x0d;
    if (c < 0x20 && !isWhitespaceControl) control++;
  }
  return control / b.length <= 0.05;
}

function asLatin1(b: Uint8Array): string {
  let s = "";
  for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
  return s;
}

/**
 * Validate a dropped/picked file by size then magic bytes. Returns the detected
 * `kind` for routing to the right strategy, or a fail reason the UI maps to a
 * specific INPUT-07 message. A PK zip routes to the docx strategy; an encrypted
 * OOXML/CFBF file is classified as 'password' before the text heuristic runs.
 */
export async function validateFile(file: File): Promise<ValidateResult> {
  // Size gate FIRST — never read bytes from an oversize file (T-02-02 DoS).
  if (file.size > MAX_BYTES) return { ok: false, reason: "oversize" };

  const head = new Uint8Array(await file.slice(0, 1024).arrayBuffer());

  // %PDF- anywhere in the first 1024 bytes (some PDFs have leading junk).
  if (asLatin1(head).includes(PDF_SIG)) return { ok: true, kind: "pdf" };

  // PK zip container (docx/xlsx/zip) — routed to the docx strategy, which lets
  // mammoth reject a non-Word zip as 'unsupported' from its real parse error.
  if (
    head.length >= 4 &&
    head[0] === ZIP_SIG[0] &&
    head[1] === ZIP_SIG[1] &&
    head[2] === ZIP_SIG[2] &&
    head[3] === ZIP_SIG[3]
  ) {
    return { ok: true, kind: "docx" };
  }

  // CFBF/OLE2 header — an encrypted .docx (or legacy .doc) wraps its payload in
  // this container, so it never hits the PK branch. Classify as 'password' before
  // the text heuristic, which would otherwise see the binary head as unsupported.
  if (head.length >= 8 && CFBF_SIG.every((b, i) => head[i] === b)) {
    return { ok: false, reason: "password" };
  }

  if (looksLikeText(head)) return { ok: true, kind: "txt" };

  return { ok: false, reason: "unsupported" };
}
