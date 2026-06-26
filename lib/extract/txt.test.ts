import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { extractTxt } from "./txt";

// Read a real on-disk file as a TIGHT ArrayBuffer. Node pools small file reads
// into a shared buffer, so we must slice to the file's exact byte range.
function fileBuffer(rel: string): ArrayBuffer {
  const b = readFileSync(resolve(process.cwd(), rel));
  return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
}
function utf8Buffer(s: string): ArrayBuffer {
  const b = Buffer.from(s, "utf-8");
  return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
}

describe("extractTxt — BOM-aware decode -> ExtractedDoc (INPUT-02, INPUT-07)", () => {
  it("decodes a UTF-8 buffer into paragraphs", async () => {
    const r = await extractTxt(utf8Buffer("Para one.\n\nPara two."));
    expect(r).toEqual({ ok: true, doc: { paragraphs: ["Para one.", "Para two."] } });
  });

  it("decodes the UTF-16LE BOM fixture correctly (NOT via File.text, which is UTF-8 only)", async () => {
    const r = await extractTxt(fileBuffer("test/fixtures/utf16le.txt"));
    expect("ok" in r && r.ok).toBe(true);
    if ("ok" in r && r.ok) {
      expect(r.doc.paragraphs.length).toBeGreaterThanOrEqual(2);
      expect(r.doc.paragraphs[0]).toContain("UTF-16");
    }
  });

  it("classifies a whitespace-only buffer as reason:'empty' (not ok)", async () => {
    const r = await extractTxt(utf8Buffer("   \n\n  \t "));
    expect(r).toEqual({ error: true, reason: "empty" });
  });

  it("classifies non-decodable (fatal UTF-8) bytes as reason:'unsupported'", async () => {
    // 'Hi' then bytes illegal as UTF-8 lead/continuation (0xC0, 0xC1, 0xFF).
    // First two bytes are NOT a UTF-16 BOM, so the decoder stays fatal-UTF-8.
    const bad = new Uint8Array([0x48, 0x69, 0xc0, 0xc1, 0xff, 0x28]).buffer;
    const r = await extractTxt(bad);
    expect(r).toEqual({ error: true, reason: "unsupported" });
  });
});
