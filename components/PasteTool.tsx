"use client";

import { useRef, useState } from "react";
import { bioticDoc } from "@/lib/biotic";
import type { ExtractedDoc } from "@/lib/types";
import { validateFile } from "@/lib/extract/validate";
import { extractTxt } from "@/lib/extract/txt";
import { extractPdf } from "@/lib/extract/pdf";
import { extractDocx } from "@/lib/extract/docx";
import { splitParagraphs } from "@/lib/extract/split";
import { FAIL_MESSAGES } from "@/lib/extract/messages";
import type { ExtractFailReason } from "@/lib/extract/strategy";
import { BioticReader } from "@/components/BioticReader";
import { ExportControls } from "@/components/ExportControls";
import { FileDropZone } from "@/components/FileDropZone";
import { ExtractProgress } from "@/components/ExtractProgress";
import { CloseIcon, FileIcon } from "@/components/icons";

// PasteTool — paste raw text OR drop/pick a .txt / digital PDF, then trigger an
// EXPLICIT conversion (INPUT-01, D-03). The card doubles as the drop-zone (D-11);
// a loaded file is a removable filename chip, never text dumped into the textarea
// (D-12). TXT extracts instantly; a PDF extracts with a determinate per-page
// progress bar (D-14) and a Cancel that aborts and resets (D-15). The same Convert
// button sends the result to BioticReader (D-13). Edge cases surface as calm
// INPUT-07 messages before conversion. All client-side; nothing is uploaded (PRIV-01).

// Pasted text -> ExtractedDoc via the shared splitter (single source of truth).
function toDoc(text: string): ExtractedDoc {
  return { paragraphs: splitParagraphs(text) };
}

export function PasteTool() {
  const [text, setText] = useState("");
  const [html, setHtml] = useState<string | null>(null);
  // The exact plain text converted — retained at convert time for the clipboard
  // text/plain payload (the source may be edited or replaced after a conversion).
  const [convertedPlain, setConvertedPlain] = useState("");
  const [busy, setBusy] = useState(false);
  const [nudge, setNudge] = useState(false);

  // File-input state (D-12): a loaded file is a name + its extracted doc, never
  // text in the textarea. fileError holds the INPUT-07 reason to surface.
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileDoc, setFileDoc] = useState<ExtractedDoc | null>(null);
  const [fileError, setFileError] = useState<ExtractFailReason | null>(null);

  // PDF extraction lifecycle (D-14 progress, D-15 cancel).
  const [extracting, setExtracting] = useState(false);
  const [progress, setProgress] = useState<{ page: number; total: number }>({ page: 0, total: 0 });
  // DOCX has no page count, so its progress is indeterminate (D-19) — distinct
  // from the PDF determinate bar that reads `progress`.
  const [indeterminate, setIndeterminate] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);

  const isEmpty = text.trim().length === 0;

  function removeFile() {
    setFileName(null);
    setFileDoc(null);
    setFileError(null);
  }

  function handleCancel() {
    controllerRef.current?.abort();
  }

  // Extract-on-drop (D-13): validate by magic bytes, then run the matching
  // strategy. A failure surfaces a calm message and leaves nothing to convert.
  async function handleFile(file: File) {
    setNudge(false);
    setFileError(null);
    setFileDoc(null);
    setFileName(null);

    const v = await validateFile(file);
    if (!v.ok) {
      setFileError(v.reason);
      return;
    }

    if (v.kind === "txt") {
      const r = await extractTxt(await file.arrayBuffer());
      if ("ok" in r) {
        setFileName(file.name);
        setFileDoc(r.doc);
      } else {
        setFileError(r.reason);
      }
      return;
    }

    if (v.kind === "docx") {
      // DOCX: indeterminate "Reading document…" + cancel (D-19). extractDocx
      // lazy-imports mammoth internally; no per-page progress (no page count).
      const controller = new AbortController();
      controllerRef.current = controller;
      setIndeterminate(true);
      setExtracting(true);
      const r = await extractDocx(await file.arrayBuffer(), controller.signal);
      setExtracting(false);
      setIndeterminate(false);
      controllerRef.current = null;

      if ("ok" in r) {
        setFileName(file.name);
        setFileDoc(r.doc);
      } else if (r.reason !== "cancelled") {
        setFileError(r.reason);
      }
      // cancelled -> silent reset (state already cleared above).
      return;
    }

    // v.kind === "pdf": extract with a determinate progress bar + cooperative
    // cancel. extractPdf lazy-imports pdfjs internally (no top-level pdfjs here).
    const controller = new AbortController();
    controllerRef.current = controller;
    setExtracting(true);
    setProgress({ page: 0, total: 0 });
    const r = await extractPdf(
      await file.arrayBuffer(),
      (page, total) => setProgress({ page, total }),
      controller.signal,
    );
    setExtracting(false);
    controllerRef.current = null;

    if ("ok" in r) {
      setFileName(file.name);
      setFileDoc(r.doc);
    } else if (r.reason !== "cancelled") {
      setFileError(r.reason);
    }
    // cancelled -> silent reset: state is already cleared above (empty drop-zone).
  }

  async function handleConvert() {
    if (busy) return;

    // File path takes precedence when a file is loaded.
    if (fileName !== null) {
      if (fileDoc === null) return; // failed/empty/unsupported -> no output (D-13)
      setBusy(true);
      await new Promise((resolve) => setTimeout(resolve, 0));
      setHtml(bioticDoc(fileDoc));
      setConvertedPlain(fileDoc.paragraphs.join("\n\n"));
      setBusy(false);
      return;
    }

    // Paste path (unchanged from Phase 1).
    if (isEmpty) {
      setNudge(true);
      return;
    }
    setNudge(false);
    setBusy(true);
    // INPUT-06: yield a frame so the "Converting…" busy state is perceivable on
    // large pastes — never freeze silently.
    await new Promise((resolve) => setTimeout(resolve, 0));
    setHtml(bioticDoc(toDoc(text)));
    setConvertedPlain(text);
    setBusy(false);
  }

  // 'cancelled' carries no message (a cancel silently resets the card), so it is
  // excluded from FAIL_MESSAGES; guard the lookup to keep the index well-typed.
  const failMessage =
    fileError !== null && fileError !== "cancelled" ? FAIL_MESSAGES[fileError] : null;

  return (
    <section
      id="tool"
      aria-labelledby="paste-heading"
      className="mx-auto max-w-5xl scroll-mt-20 px-6 pb-20 sm:pb-24"
    >
      <h2
        id="paste-heading"
        className="font-display text-[clamp(1.75rem,3.5vw,2.25rem)] leading-[1.1] tracking-[-0.02em] text-text-primary"
      >
        Try it on your own text
      </h2>

      <div className="mt-8 max-w-[47.5rem]">
        <FileDropZone onFile={handleFile} disabled={extracting}>
          {extracting ? (
            // While a file parses, progress + Cancel replace the input: a determinate
            // per-page bar for PDF (D-14/D-15) or an indeterminate indicator for DOCX (D-19).
            <div className="px-2 py-3">
              <ExtractProgress
                indeterminate={indeterminate}
                page={progress.page}
                total={progress.total}
                onCancel={handleCancel}
              />
            </div>
          ) : fileName !== null ? (
            // D-12: filename chip only — the extracted text is NOT shown in a textarea.
            <div className="flex min-h-[184px] flex-col items-start justify-center gap-4 px-2">
              <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-border-hairline bg-surface-secondary py-2 pr-3 pl-3 text-[14px] text-text-primary">
                <FileIcon className="size-4 shrink-0 text-text-muted" />
                <span className="truncate">{fileName}</span>
              </span>
              <button
                type="button"
                onClick={removeFile}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-md px-1 text-[14px] font-medium text-accent transition-colors hover:text-accent-hover"
              >
                <CloseIcon className="size-4" />
                remove
              </button>
            </div>
          ) : (
            <>
              <label
                htmlFor="paste-input"
                className="block px-2 pt-1 pb-2 text-[13px] font-medium tracking-[0.01em] text-text-muted"
              >
                Paste your text
              </label>
              <textarea
                id="paste-input"
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  if (nudge) setNudge(false);
                }}
                placeholder="Paste or type any text here, then press Convert."
                className="min-h-[184px] w-full resize-y rounded-xl border-0 bg-transparent px-2 pb-2 text-[1.0625rem] leading-[1.6] text-text-primary outline-none placeholder:text-text-muted focus-visible:outline-none"
              />
            </>
          )}
        </FileDropZone>

        {failMessage !== null && (
          <p
            role="status"
            className="mt-4 flex gap-2 rounded-xl border border-border-hairline bg-surface-secondary px-4 py-3 text-[14px] leading-[1.5] text-text-secondary"
          >
            {failMessage.body}
          </p>
        )}

        {!extracting && (
          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2">
            <button
              type="button"
              onClick={handleConvert}
              disabled={busy}
              aria-busy={busy}
              aria-describedby={nudge ? "convert-nudge" : undefined}
              className="inline-flex min-h-11 items-center rounded-full bg-accent px-7 text-[15px] font-medium text-accent-contrast shadow-accent transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none"
            >
              {busy ? "Converting…" : "Convert"}
            </button>
            {nudge && (
              <p
                id="convert-nudge"
                role="status"
                className="text-[14px] leading-[1.5] text-text-secondary"
              >
                Add some text to convert first.
              </p>
            )}
          </div>
        )}
      </div>

      <div className="mt-14 max-w-[47.5rem]">
        <BioticReader html={html} />
        {html !== null && html.trim() !== "" && (
          <ExportControls html={html} plain={convertedPlain} />
        )}
      </div>
    </section>
  );
}
