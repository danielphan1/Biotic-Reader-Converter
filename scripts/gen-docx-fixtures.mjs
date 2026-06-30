// Generate the binary DOCX/ZIP test fixtures for Phase 3 (Word/DOCX input).
//
// Bash is blocked on this host, so fixtures are produced by Node — never a shell
// pipeline. jszip is resolved from the INSTALLED mammoth dependency tree via
// createRequire (mammoth depends on jszip), so we assemble the exact OOXML zip
// containers mammoth will parse, with no extra dependency of our own.
//
// Writes five fixtures into test/fixtures/ (guarded as binary in .gitattributes
// BEFORE this runs, so git never EOL-normalizes their zip records / magic bytes):
//   - sample.docx    valid .docx: 1 paragraph + 2-item list + 2x2 table (D-17)
//   - empty.docx     valid .docx whose only paragraph is empty -> 'empty'
//   - not-word.zip   real PK-zip lacking word/document.xml -> mammoth 'unsupported'
//   - corrupt.docx   sample.docx truncated past its central directory -> 'corrupt'
//   - encrypted.docx CFBF/OLE2-headed stub (D0 CF 11 E0 …) -> validate 'password'

import { createRequire } from "node:module";
import { mkdirSync, writeFileSync, statSync } from "node:fs";
import { join } from "node:path";

// Resolve jszip out of mammoth's own dependency tree — no direct dependency added.
const require = createRequire(import.meta.url);
const JSZip = require(require.resolve("jszip", { paths: [require.resolve("mammoth/package.json")] }));

const OUT_DIR = "test/fixtures";
mkdirSync(OUT_DIR, { recursive: true });

// Standard minimal OOXML package parts. mammoth resolves the main document part
// by following _rels/.rels -> word/document.xml (never by filename guess).
const CONTENT_TYPES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

const RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

const W_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
const para = (t) => `<w:p><w:r><w:t xml:space="preserve">${t}</w:t></w:r></w:p>`;
const cell = (t) => `<w:tc><w:tcPr/>${para(t)}</w:tc>`;
const row = (...cells) => `<w:tr>${cells.map(cell).join("")}</w:tr>`;

// sample: one normal paragraph, a 2-item list (two w:p), and a 2x2 table whose
// four cells carry distinct text — mammoth.extractRawText flattens all of it to
// lines, proving D-17 (list + table text preserved).
const SAMPLE_BODY =
  para("Reading helps focus") +
  para("First item") +
  para("Second item") +
  `<w:tbl>${row("R1C1", "R1C2")}${row("R2C1", "R2C2")}</w:tbl>`;

// empty: a single whitespace-only paragraph -> no readable text -> 'empty' downstream.
const EMPTY_BODY = `<w:p><w:r><w:t xml:space="preserve">   </w:t></w:r></w:p>`;

const documentXml = (body) =>
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="${W_NS}"><w:body>${body}<w:sectPr/></w:body></w:document>`;

function docxZip(body) {
  const zip = new JSZip();
  zip.file("[Content_Types].xml", CONTENT_TYPES);
  zip.file("_rels/.rels", RELS);
  zip.file("word/document.xml", documentXml(body));
  return zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
}

function notWordZip() {
  const zip = new JSZip();
  zip.file("hello.txt", "this is a plain zip, not a Word document");
  return zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
}

function write(name, buf) {
  const dest = join(OUT_DIR, name);
  writeFileSync(dest, buf);
  const { size } = statSync(dest);
  const head = buf.subarray(0, 4).toString("hex").toUpperCase();
  console.log(`[gen-docx-fixtures] ${dest} (${size} bytes, head=${head})`);
}

const sample = await docxZip(SAMPLE_BODY);
write("sample.docx", sample);

write("empty.docx", await docxZip(EMPTY_BODY));
write("not-word.zip", await notWordZip());

// corrupt: keep the leading PK signature but drop the trailing ~40% (which holds
// the end-of-central-directory record), so jszip rejects it as a corrupt zip.
// Pins the real jszip error substring for classifyDocxError (RESEARCH A3).
const cut = Math.floor(sample.length * 0.6);
write("corrupt.docx", sample.subarray(0, cut));

// encrypted: validateFile only sniffs the first 8 bytes, so a CFBF/OLE2 signature
// (the container an encrypted/legacy Office file actually uses) + zero padding is
// enough to exercise the 'password' branch. This is NOT a zip — no PK header.
const cfbf = Buffer.alloc(520);
Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]).copy(cfbf, 0);
write("encrypted.docx", cfbf);

console.log("[gen-docx-fixtures] done — 5 fixtures written.");
