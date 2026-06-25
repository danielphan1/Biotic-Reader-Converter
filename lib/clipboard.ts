// Rich + plain clipboard copy (OUT-03, D-06). Writes a `text/html` payload (so the
// biotic bolding survives when pasted into Docs/Slack/email) plus a `text/plain`
// fallback, via the async Clipboard API. Degrades gracefully: if ClipboardItem is
// unavailable it falls back to writeText(plain); if the clipboard is entirely
// unavailable it throws so the UI can show an actionable manual-copy message.
// Uses only the modern async Clipboard API (no deprecated copy command). Fully
// client-side (PRIV-01).
export async function copyRich(html: string, plain: string): Promise<void> {
  const hasClipboardItem =
    typeof navigator !== "undefined" &&
    !!navigator.clipboard &&
    typeof window !== "undefined" &&
    "ClipboardItem" in window;

  if (hasClipboardItem) {
    try {
      const item = new ClipboardItem({
        "text/html": new Blob([html], { type: "text/html" }),
        "text/plain": new Blob([plain], { type: "text/plain" }),
      });
      await navigator.clipboard.write([item]);
      return;
    } catch {
      // Fall through to the plain-text fallback below.
    }
  }

  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(plain);
    return;
  }

  throw new Error("Clipboard API unavailable");
}
