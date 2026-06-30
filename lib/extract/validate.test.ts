import { describe, it, expect } from "vitest";
import { validateFile, MAX_BYTES } from "./validate";

// Magic-byte validation must NEVER trust the extension — build Files from raw
// bytes with deliberately mismatched names (a renamed binary, a fake .txt).
function fileOf(bytes: number[], name = "f.bin"): File {
  return new File([new Uint8Array(bytes)], name);
}
const ascii = (s: string): number[] => [...s].map((c) => c.charCodeAt(0));

describe("validateFile — magic-byte sniff + size cap (INPUT-02/03, T-02-01/02)", () => {
  it("accepts a %PDF- header as kind:pdf (by content, not .pdf)", async () => {
    const r = await validateFile(fileOf(ascii("%PDF-1.7\n%âãÏÓ"), "doc.bin"));
    expect(r.ok).toBe(true);
    expect(r.ok && r.kind).toBe("pdf");
  });

  it("routes a PK zip header (docx-class) to kind:docx — by content, not .docx", async () => {
    const r = await validateFile(fileOf([0x50, 0x4b, 0x03, 0x04, 1, 2, 3], "fake.txt"));
    expect(r.ok).toBe(true);
    expect(r.ok && r.kind).toBe("docx");
  });

  it("maps a CFBF/OLE2 header (encrypted/legacy Office) to reason:password", async () => {
    const r = await validateFile(fileOf([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1, 0, 0], "enc.docx"));
    expect(r.ok).toBe(false);
    expect(!r.ok && r.reason).toBe("password");
  });

  it("accepts a UTF-8 text sample as kind:txt", async () => {
    const r = await validateFile(fileOf(ascii("hello world\nsecond line"), "note.txt"));
    expect(r.ok).toBe(true);
    expect(r.ok && r.kind).toBe("txt");
  });

  it("accepts a UTF-16LE BOM text sample as kind:txt (extractTxt decodes it)", async () => {
    const r = await validateFile(fileOf([0xff, 0xfe, 0x68, 0x00, 0x69, 0x00], "u16.txt"));
    expect(r.ok).toBe(true);
    expect(r.ok && r.kind).toBe("txt");
  });

  it("rejects a NUL/control-heavy binary as unsupported (renamed .txt)", async () => {
    const r = await validateFile(fileOf([0x00, 0x01, 0x02, 0x00, 0x03, 0xff, 0x00], "fake.txt"));
    expect(r.ok).toBe(false);
    expect(!r.ok && r.reason).toBe("unsupported");
  });

  it("rejects an over-25MB file as oversize BEFORE reading any bytes", async () => {
    const f = fileOf(ascii("hi"), "big.txt");
    Object.defineProperty(f, "size", { value: MAX_BYTES + 1 });
    // Prove no bytes are read for an oversize file: reading must reject first.
    f.slice = () => {
      throw new Error("validateFile read bytes before the size gate");
    };
    const r = await validateFile(f);
    expect(r.ok).toBe(false);
    expect(!r.ok && r.reason).toBe("oversize");
  });
});
