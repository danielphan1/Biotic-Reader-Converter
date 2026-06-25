"use client";

// BioticReader — the accessible on-screen reading surface (READ-01).
// ORIGINATED in Phase 1; reused unchanged downstream and EXTENDED by Phase 4
// (size/spacing controls, dark/sepia themes). Built against the reserved Tailwind
// tokens (never hard-coded hex) so those later themes drop in without edits.
//
// Presentational only: it receives ALREADY-SAFE biotic HTML from lib/biotic.ts
// (every user character is escaped there; only the engine's own <b>/<p> tags are
// raw — see Pitfall 1 / V5). Rendering it via dangerouslySetInnerHTML is therefore
// safe. Biotic bolding is conveyed by semantic font-weight, never color, so it
// survives copy/paste, the HTML download, future themes, and assistive tech.

export function BioticReader({ html }: { html: string | null }) {
  const isEmpty = html === null || html.trim() === "";

  if (isEmpty) {
    return (
      <section
        aria-label="Converted text"
        className="rounded-xl border border-border-hairline bg-surface-secondary p-6"
      >
        <h2 className="text-[20px] font-semibold leading-[1.3] text-text-primary">
          Your converted text will appear here
        </h2>
        <p className="mt-2 text-[16px] leading-[1.5] text-text-muted">
          Paste some text above and press Convert to see it in biotic reading.
        </p>
      </section>
    );
  }

  return (
    <section
      aria-label="Converted text"
      className="rounded-xl border border-border-hairline bg-surface-secondary p-6"
    >
      <h2 className="text-[20px] font-semibold leading-[1.3] text-text-primary">
        Your converted text
      </h2>
      <article
        className="mt-4 max-w-[70ch] text-[16px] leading-[1.5] text-text-primary [&>p]:mb-4 [&>p:last-child]:mb-0"
        // SAFE: lib/biotic.ts escapes every user character; only its own <b>/<p> are raw.
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </section>
  );
}
