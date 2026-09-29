"use client";

// ExtractProgress — extraction feedback with a Cancel escape hatch (D-15), in two
// modes so no long parse ever looks frozen:
//   • determinate (PDF, D-14): a per-page bar + "Extracting page N of M" + role=
//     progressbar with aria-valuenow/min/max. Progress is conveyed by TEXT + ARIA,
//     never color alone.
//   • indeterminate (DOCX, D-19): mammoth gives no page count, so we show
//     "Reading document…" and a pulsing accent fill (Tailwind animate-pulse — a
//     compositor-thread animation that keeps moving even if the main thread briefly
//     blocks during parse). No aria-valuenow (no false percentage); role=progressbar
//     with aria-valuetext announces activity to a screen reader.
// Cancel uses the reserved --color-destructive token and is identical in both modes.
// Tokens only — no hex, no new tokens.

export function ExtractProgress({
  page,
  total,
  indeterminate = false,
  onCancel,
}: {
  page?: number;
  total?: number;
  indeterminate?: boolean;
  onCancel: () => void;
}) {
  const pct = !indeterminate && total && total > 0 ? Math.round(((page ?? 0) / total) * 100) : 0;
  const label = indeterminate ? "Reading document…" : `Extracting page ${page} of ${total}`;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p role="status" className="tabular text-[14px] font-medium text-text-primary">
          {label}
        </p>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex min-h-11 items-center rounded-full border border-border-strong px-5 text-[14px] font-medium text-destructive transition-colors hover:bg-surface-secondary"
        >
          Cancel
        </button>
      </div>

      {indeterminate ? (
        <div
          role="progressbar"
          aria-valuetext={label}
          aria-label={label}
          className="h-1.5 w-full overflow-hidden rounded-full bg-surface-secondary"
        >
          <div className="h-full w-full rounded-full bg-accent animate-pulse" />
        </div>
      ) : (
        <div
          role="progressbar"
          aria-valuenow={page}
          aria-valuemin={0}
          aria-valuemax={total}
          aria-label={label}
          className="h-1.5 w-full overflow-hidden rounded-full bg-surface-secondary"
        >
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-300 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}
