"use client";

import { useState } from "react";
import { buildExportHtml, downloadHtml } from "@/lib/export-html";
import { copyRich } from "@/lib/clipboard";
import { CheckIcon, CopyIcon, DownloadIcon } from "@/components/icons";

// ExportControls — Copy + Download HTML affordances sitting WITH the converted
// result (D-04). Secondary, neutral buttons (the accent fill is reserved for the
// single Convert CTA), rendered as a quiet action row under the reading panel
// rather than a competing card. Both reuse the SAME escaped transform output —
// no second transform, no new XSS sink — and stay fully client-side (PRIV-01).
//
// `html`  = the converted biotic HTML (already escaped) — the reader's content.
// `plain` = the user's original pasted text — the clipboard text/plain fallback.
export function ExportControls({ html, plain }: { html: string; plain: string }) {
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);

  async function handleCopy() {
    setCopyFailed(false);
    try {
      // Rich payload = a self-contained styled document so bolding survives the paste.
      await copyRich(buildExportHtml(html), plain);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopyFailed(true);
    }
  }

  function handleDownload() {
    downloadHtml(buildExportHtml(html));
  }

  const buttonClass =
    "inline-flex min-h-11 items-center gap-2 rounded-full border border-border-strong px-5 text-[14px] font-medium text-text-primary transition-colors hover:bg-surface-secondary";

  return (
    <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-3">
      <button type="button" onClick={handleCopy} className={buttonClass}>
        {copied ? <CheckIcon className="size-4" /> : <CopyIcon className="size-4" />}
        {copied ? "Copied" : "Copy"}
      </button>
      <button type="button" onClick={handleDownload} className={buttonClass}>
        <DownloadIcon className="size-4" />
        Download HTML
      </button>

      <p
        role="status"
        aria-live="polite"
        className="text-[14px] leading-[1.5] text-text-muted"
      >
        {copied
          ? "Copied to your clipboard."
          : copyFailed
            ? "Couldn't copy automatically — select the text and copy manually."
            : "A single file you can reopen offline — the bolding stays."}
      </p>

    </div>
  );
}
