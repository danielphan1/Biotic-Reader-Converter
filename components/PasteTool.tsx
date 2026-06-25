"use client";

import { useState } from "react";
import { bioticDoc } from "@/lib/biotic";
import type { ExtractedDoc } from "@/lib/types";
import { BioticReader } from "@/components/BioticReader";

// PasteTool — paste raw text and trigger an EXPLICIT conversion (INPUT-01, D-03:
// not live-as-you-type). Owns the paste/convert state and renders BioticReader
// BELOW itself so the input stays visible for re-edit/re-convert (D-04). All work
// is in-memory and client-side; nothing is uploaded (PRIV-01).

// Split pasted text into clean reflowed paragraphs: blank-line-separated blocks,
// trimmed, empties dropped. This is the ExtractedDoc the transform engine consumes.
function toDoc(text: string): ExtractedDoc {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
  return { paragraphs };
}

export function PasteTool() {
  const [text, setText] = useState("");
  const [html, setHtml] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const canConvert = text.trim().length > 0 && !busy;

  async function handleConvert() {
    if (!canConvert) return;
    setBusy(true);
    // Yield a frame so the "Converting…" busy state is perceivable on large pastes
    // (INPUT-06) — never freeze silently. Instant pastes may swap imperceptibly.
    await new Promise((resolve) => setTimeout(resolve, 0));
    setHtml(bioticDoc(toDoc(text)));
    setBusy(false);
  }

  return (
    <section aria-labelledby="paste-heading" className="flex flex-col gap-6">
      <h2
        id="paste-heading"
        className="text-[20px] font-semibold leading-[1.3] text-text-primary"
      >
        Try it on your own text
      </h2>

      <div className="flex flex-col gap-2 rounded-xl border border-border-hairline bg-surface-secondary p-6">
        <label
          htmlFor="paste-input"
          className="text-[14px] leading-[1.4] text-text-primary"
        >
          Paste your text
        </label>
        <textarea
          id="paste-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste or type any text here, then press Convert."
          className="min-h-[200px] w-full resize-y rounded-lg border border-border-hairline bg-surface p-4 text-[16px] leading-[1.5] text-text-primary placeholder:text-text-muted"
        />
        <div>
          <button
            type="button"
            onClick={handleConvert}
            disabled={!canConvert}
            aria-disabled={!canConvert}
            aria-busy={busy}
            className="min-h-[44px] rounded-lg bg-accent px-6 text-[14px] font-semibold leading-[1.4] text-white hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy ? "Converting…" : "Convert"}
          </button>
        </div>
      </div>

      <BioticReader html={html} />
    </section>
  );
}
