"use client";

import { useMemo, useState } from "react";
import { bioticHtml } from "@/lib/biotic";

// DemoToggle — a zero-effort live Before/After demo on a FIXED canned sample
// (LAND-02). Critically, it runs the SAME bioticHtml engine the real tool uses
// (D-02 single source of truth) — no hardcoded pre-bolded markup, no separate
// demo transform. State is conveyed via aria-pressed (not color alone) and each
// segment meets the 44px hit-area floor.

const SAMPLE =
  "Reading should feel effortless, not like a chore. When the first part of each word is emphasized, your eyes catch an anchor and glide forward with less backtracking. Give it a moment and notice whether the page feels a little quieter.";

export function DemoToggle() {
  const [showAfter, setShowAfter] = useState(true);
  // SAFE: bioticHtml escapes every character; only its own <b> tags are raw.
  const html = useMemo(() => bioticHtml(SAMPLE), []);

  return (
    <section aria-labelledby="demo-heading" className="flex flex-col gap-4">
      <h2
        id="demo-heading"
        className="text-[20px] font-semibold leading-[1.3] text-text-primary"
      >
        See the effect
      </h2>

      <div
        role="group"
        aria-label="Toggle between the original text and biotic reading"
        className="inline-flex w-fit overflow-hidden rounded-lg border border-border-hairline"
      >
        <button
          type="button"
          aria-pressed={!showAfter}
          onClick={() => setShowAfter(false)}
          className={`min-h-[44px] px-5 text-[14px] leading-[1.4] ${
            !showAfter
              ? "bg-accent text-white"
              : "bg-surface text-text-primary"
          }`}
        >
          Before
        </button>
        <button
          type="button"
          aria-pressed={showAfter}
          onClick={() => setShowAfter(true)}
          className={`min-h-[44px] border-l border-border-hairline px-5 text-[14px] leading-[1.4] ${
            showAfter ? "bg-accent text-white" : "bg-surface text-text-primary"
          }`}
        >
          After
        </button>
      </div>
      <p className="text-[14px] leading-[1.4] text-text-muted">
        Toggle to see the effect.
      </p>

      <div className="max-w-[70ch] rounded-xl border border-border-hairline bg-surface-secondary p-6 text-[16px] leading-[1.5] text-text-primary">
        {showAfter ? (
          <p dangerouslySetInnerHTML={{ __html: html }} />
        ) : (
          <p>{SAMPLE}</p>
        )}
      </div>
    </section>
  );
}
