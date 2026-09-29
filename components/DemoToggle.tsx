"use client";

import { useMemo, useState } from "react";
import { bioticHtml } from "@/lib/biotic";

// DemoToggle — a zero-effort live Before/After demo on a FIXED canned sample
// (LAND-02). Critically, it runs the SAME bioticHtml engine the real tool uses
// (D-02 single source of truth) — no hardcoded pre-bolded markup, no separate
// demo transform. State is conveyed via aria-pressed (not color alone) and each
// segment meets the 44px hit-area floor.
//
// The segment indicator slides between the two options so the switch reads as one
// control rather than two buttons that happen to sit together.

const SAMPLE =
  "Reading should feel effortless, not like a chore. When the first part of each word is emphasized, your eyes catch an anchor and glide forward with less backtracking. Give it a moment and notice whether the page feels a little quieter.";

export function DemoToggle() {
  const [showAfter, setShowAfter] = useState(true);
  // SAFE: bioticHtml escapes every character; only its own <b> tags are raw.
  const html = useMemo(() => bioticHtml(SAMPLE), []);

  const segment =
    "relative z-10 min-h-11 flex-1 rounded-full px-6 text-[14px] font-medium transition-colors";

  return (
    <section
      id="demo"
      aria-labelledby="demo-heading"
      className="mx-auto max-w-5xl scroll-mt-20 px-6 pb-20 sm:pb-24"
    >
      <div className="flex max-w-[47.5rem] flex-wrap items-end justify-between gap-6">
        <h2
          id="demo-heading"
          className="font-display text-[clamp(1.75rem,3.5vw,2.25rem)] leading-[1.1] tracking-[-0.02em] text-text-primary"
        >
          See the effect
        </h2>

        <div
          role="group"
          aria-label="Toggle between the original text and biotic reading"
          className="relative flex w-full max-w-[19rem] rounded-full border border-border-hairline bg-surface-secondary p-1"
        >
          <span
            aria-hidden="true"
            className="absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-accent shadow-raised transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none"
            style={{ transform: `translateX(${showAfter ? "100%" : "0%"})` }}
          />
          <button
            type="button"
            aria-pressed={!showAfter}
            onClick={() => setShowAfter(false)}
            className={`${segment} ${!showAfter ? "text-accent-contrast" : "text-text-secondary hover:text-text-primary"}`}
          >
            Before
          </button>
          <button
            type="button"
            aria-pressed={showAfter}
            onClick={() => setShowAfter(true)}
            className={`${segment} ${showAfter ? "text-accent-contrast" : "text-text-secondary hover:text-text-primary"}`}
          >
            After
          </button>
        </div>
      </div>

      <div className="mt-8 max-w-[47.5rem] rounded-2xl border border-border-hairline bg-surface p-7 shadow-panel sm:p-10">
        <div className="max-w-[54ch] text-[1.0625rem] leading-[1.7] sm:text-[1.1875rem] text-text-primary">
          {showAfter ? (
            <p dangerouslySetInnerHTML={{ __html: html }} />
          ) : (
            <p>{SAMPLE}</p>
          )}
        </div>
      </div>
    </section>
  );
}
