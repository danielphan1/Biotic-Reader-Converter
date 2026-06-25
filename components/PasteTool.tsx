"use client";

import { useState } from "react";
import { bioticDoc } from "@/lib/biotic";
import type { ExtractedDoc } from "@/lib/types";
import { BioticReader } from "@/components/BioticReader";
import { ExportControls } from "@/components/ExportControls";

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
  // The exact plain text converted — retained at convert time for the clipboard
  // text/plain payload (the textarea may be edited after a conversion).
  const [convertedPlain, setConvertedPlain] = useState("");
  const [busy, setBusy] = useState(false);
  const [nudge, setNudge] = useState(false);

  const isEmpty = text.trim().length === 0;

  async function handleConvert() {
    if (busy) return;
    // INPUT-07: empty/whitespace Convert is never a silent no-op — show a calm,
    // actionable nudge (muted, not destructive red) and bail. The button stays
    // pressable precisely so this feedback can fire.
    if (isEmpty) {
      setNudge(true);
      return;
    }
    setNudge(false);
    setBusy(true);
    // INPUT-06: yield a frame so the "Converting…" busy state is perceivable on
    // large pastes — never freeze silently. Instant pastes may swap imperceptibly.
    await new Promise((resolve) => setTimeout(resolve, 0));
    setHtml(bioticDoc(toDoc(text)));
    setConvertedPlain(text);
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
          onChange={(e) => {
            setText(e.target.value);
            if (nudge) setNudge(false);
          }}
          placeholder="Paste or type any text here, then press Convert."
          className="min-h-[200px] w-full resize-y rounded-lg border border-border-hairline bg-surface p-4 text-[16px] leading-[1.5] text-text-primary placeholder:text-text-muted"
        />
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={handleConvert}
            disabled={busy}
            aria-busy={busy}
            aria-describedby={nudge ? "convert-nudge" : undefined}
            className="min-h-[44px] w-fit rounded-lg bg-accent px-6 text-[14px] leading-[1.4] text-white hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy ? "Converting…" : "Convert"}
          </button>
          {nudge && (
            <p
              id="convert-nudge"
              role="status"
              className="text-[14px] leading-[1.4] text-text-muted"
            >
              Add some text to convert first.
            </p>
          )}
        </div>
      </div>

      <BioticReader html={html} />

      {html !== null && html.trim() !== "" && (
        <ExportControls html={html} plain={convertedPlain} />
      )}
    </section>
  );
}
