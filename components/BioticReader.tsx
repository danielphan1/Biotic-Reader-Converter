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
//
// This is the surface the visitor is meant to stay in, so it gets the page's most
// generous reading setting: 19px, 1.75 leading, a 68ch measure.

export function BioticReader({ html }: { html: string | null }) {
  const isEmpty = html === null || html.trim() === "";

  if (isEmpty) {
    return (
      <section
        aria-label="Converted text"
        className="rounded-2xl border border-dashed border-border-hairline px-7 py-12 text-center sm:px-10"
      >
        <h2 className="text-[1.0625rem] font-medium text-text-primary">
          Your converted text will appear here
        </h2>
        <p className="mx-auto mt-2 max-w-[46ch] text-[0.9375rem] leading-[1.6] text-text-muted">
          Paste some text above and press Convert to see it in biotic reading.
        </p>
      </section>
    );
  }

  return (
    <section
      aria-label="Converted text"
      className="rounded-2xl border border-border-hairline bg-surface p-7 shadow-panel sm:p-10"
    >
      <h2 className="text-[13px] font-medium tracking-[0.06em] text-text-muted uppercase">
        Your converted text
      </h2>
      <article
        className="mt-6 max-w-[54ch] text-[1.0625rem] leading-[1.75] sm:text-[1.1875rem] text-text-primary [&>p]:mb-5 [&>p:last-child]:mb-0"
        // SAFE: lib/biotic.ts escapes every user character; only its own <b>/<p> are raw.
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </section>
  );
}
