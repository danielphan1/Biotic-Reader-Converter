"use client";

// ExtractProgress — determinate per-page progress for PDF extraction (D-14) plus
// a Cancel escape hatch (D-15). A long PDF must never look frozen. Progress is
// conveyed by TEXT + ARIA, never color alone: the accent fill is reinforced by
// "Extracting page N of M" and role=progressbar with aria-valuenow/min/max.
// Cancel uses the reserved --color-destructive token. Tokens only — no hex.

export function ExtractProgress({
  page,
  total,
  onCancel,
}: {
  page: number;
  total: number;
  onCancel: () => void;
}) {
  const pct = total > 0 ? Math.round((page / total) * 100) : 0;
  const label = `Extracting page ${page} of ${total}`;

  return (
    <div className="flex flex-col gap-3">
      <p role="status" className="text-[14px] font-medium leading-[1.4] text-text-primary">
        {label}
      </p>
      <div
        role="progressbar"
        aria-valuenow={page}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label={label}
        className="h-2 w-full overflow-hidden rounded-full bg-surface-secondary"
      >
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-200"
          style={{ width: `${pct}%` }}
        />
      </div>
      <button
        type="button"
        onClick={onCancel}
        className="min-h-[44px] w-fit rounded-lg bg-destructive px-6 text-[14px] leading-[1.4] text-white hover:opacity-90"
      >
        Cancel
      </button>
    </div>
  );
}
