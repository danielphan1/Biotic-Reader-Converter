// Pure PDF reflow: turn PDF.js's positioned TextItem fragments into clean
// single-column text. PDF text arrives as glyph runs with (x,y) baselines, not
// lines — group by baseline proximity, insert a space across a horizontal gap,
// respect PDF.js's own hasEOL break, and de-hyphenate words split across lines.
// No PDF-lib import — operates on the structural item shape so it stays unit-pure.
// Scope: single-column body text (REQUIREMENTS: no pixel-perfect layout).

export interface ReflowItem {
  str?: string;
  transform?: number[]; // [a,b,c,d,x,y]; x=[4], y=[5] baseline
  width?: number;
  height?: number;
  hasEOL?: boolean;
}

interface Line {
  y: number;
  text: string;
  lastX: number;
  h: number;
}

export function reflowPage(items: ReadonlyArray<ReflowItem>): string {
  const lines: Line[] = [];
  let cur: Line | null = null;

  for (const it of items) {
    if (typeof it.str !== "string") continue; // skip TextMarkedContent (no str)
    const tr = it.transform ?? [1, 0, 0, 1, 0, 0];
    const x = tr[4];
    const y = tr[5];
    const h = it.height || 0;

    const sameLine = cur !== null && Math.abs(y - cur.y) < Math.max(2, (cur.h || h) * 0.5);
    if (!sameLine) {
      cur = { y, text: "", lastX: x, h };
      lines.push(cur);
    }
    const line = cur!;
    const gap = x - line.lastX;
    const needsSpace =
      line.text.length > 0 && gap > h * 0.25 && !line.text.endsWith(" ") && !it.str.startsWith(" ");
    line.text += (needsSpace ? " " : "") + it.str;
    line.lastX = x + (it.width || 0);
    if (it.hasEOL) cur = null; // PDF.js's explicit line break
  }

  // De-hyphenate "exam-\nple" -> "example": only a hyphen after a letter followed
  // by a lowercase line start (avoids merging real hyphenated compounds at line ends).
  const out: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].text.trimEnd();
    const next = lines[i + 1]?.text.trimStart() ?? "";
    if (/[A-Za-zÀ-ÿ]-$/.test(t) && /^[a-zà-ÿ]/.test(next)) {
      lines[i + 1].text = t.slice(0, -1) + next;
      continue; // drop this line; merged forward
    }
    out.push(t);
  }
  return out.join("\n");
}
