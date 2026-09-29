// Self-contained HTML export (OUT-01, D-05). buildExportHtml is PURE (no DOM, no
// React) so it is unit-testable and reused by both the download and the rich
// clipboard payload. The body is the ALREADY-ESCAPED output of bioticHtml/bioticDoc
// (single source of truth — never re-transform raw user text); only <b>/<p> are raw.
//
// The document references NO remote assets (no <link>, no <script>, no web fonts) and
// bakes the reading-surface styling inline using the system font stack, so it reads
// identically offline in any browser and makes no network call (PRIV-01 preserved).

// Reading-surface styling mirrored from the in-app reader tokens (D-10) as concrete
// values — the downloaded file has no access to the app's CSS variables.
const EXPORT_STYLE = `
  :root { color-scheme: light dark; }
  body {
    margin: 0;
    background: #fbfbfd;
    color: #14141a;
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    font-size: 19px;
    line-height: 1.75;
    -webkit-font-smoothing: antialiased;
  }
  main {
    max-width: 68ch;
    margin: 0 auto;
    padding: 72px 32px 96px;
  }
  p { margin: 0 0 1.25em; }
  p:last-child { margin-bottom: 0; }
  /* Biotic bolding is semantic font-weight, never color — survives offline + themes. */
  b { font-weight: 700; }
  ::selection { background: #5b4be0; color: #ffffff; }
  @media (prefers-color-scheme: dark) {
    body { background: #0a0a0f; color: #ededf2; }
    ::selection { background: #8b7df7; color: #0a0a0f; }
  }
  @media (max-width: 640px) {
    body { font-size: 18px; }
    main { padding: 40px 20px 64px; }
  }
`.trim();

/**
 * Build a complete, self-contained `<!doctype html>` document around already-escaped
 * biotic body HTML. The <title> deliberately avoids the trademarked term (LAND-03).
 */
export function buildExportHtml(bodyHtml: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>biotic reading</title>
<style>
${EXPORT_STYLE}
</style>
</head>
<body>
<main>${bodyHtml}</main>
</body>
</html>
`;
}

/**
 * Trigger a fully client-side download of the HTML (D-05). Blob + object URL + a
 * programmatic <a download> click; the object URL is revoked immediately after.
 * No network path — the file is created and saved entirely in the browser.
 */
export function downloadHtml(html: string, name = "biotic.html"): void {
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
