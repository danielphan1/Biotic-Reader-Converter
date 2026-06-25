"use client";

import { useState } from "react";
import { buildExportHtml, downloadHtml } from "@/lib/export-html";
import { copyRich } from "@/lib/clipboard";

// ExportControls — Copy + Download HTML affordances sitting WITH the converted
// result (D-04). Secondary, neutral/hairline-bordered buttons (accent is reserved
// for the single Convert CTA). Both reuse the SAME escaped transform output — no
// second transform, no new XSS sink — and stay fully client-side (PRIV-01).
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
    "min-h-[44px] rounded-lg border border-border-hairline bg-surface px-5 text-[14px] leading-[1.4] text-text-primary hover:bg-surface-secondary";

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border-hairline bg-surface-secondary p-6">
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={handleCopy} className={buttonClass}>
          {copied ? "Copied" : "Copy"}
        </button>
        <button type="button" onClick={handleDownload} className={buttonClass}>
          Download HTML
        </button>
      </div>
      <p className="text-[14px] leading-[1.4] text-text-muted">
        A single file you can reopen offline — the bolding stays.
      </p>
      {copied && (
        <p role="status" className="text-[14px] leading-[1.4] text-text-muted">
          Copied to your clipboard.
        </p>
      )}
      {copyFailed && (
        <p role="status" className="text-[14px] leading-[1.4] text-text-muted">
          Couldn&apos;t copy automatically — select the text and copy manually.
        </p>
      )}
    </div>
  );
}
