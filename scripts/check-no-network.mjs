// Build-time no-network guard (PRIV-01). Now that a heavy parsing library
// (pdfjs-dist) is in the bundle, this scan fails the build if any source file
// under lib/ or components/ pulls the worker/cmap from a CDN or any off-origin
// URL. The worker MUST stay root-relative (/pdf.worker.min.mjs, self-hosted).
// 02-04 keeps this green when it sets workerSrc.

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOTS = ["lib", "components"];
const SOURCE = /\.(ts|tsx|js|jsx|mjs|cjs)$/;

// Known public CDN hosts for JS assets, and any off-origin worker/cmap URL.
const CDN_HOST = /\b(cdnjs|unpkg|jsdelivr)\b/i;
const OFF_ORIGIN_ASSET = /https?:\/\/[^\s'"`]*(pdf\.worker|cmap)/i;

function walk(dir) {
  const out = [];
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const name of entries) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      out.push(...walk(p));
    } else if (SOURCE.test(name) && !/\.test\./.test(name)) {
      out.push(p);
    }
  }
  return out;
}

const offenders = [];
for (const root of ROOTS) {
  for (const file of walk(root)) {
    const text = readFileSync(file, "utf8");
    if (CDN_HOST.test(text) || OFF_ORIGIN_ASSET.test(text)) offenders.push(file);
  }
}

if (offenders.length > 0) {
  console.error("[check-no-network] FAIL — CDN host or off-origin worker/cmap URL found:");
  for (const f of offenders) console.error("  " + f);
  console.error("PRIV-01: the PDF worker/cmap must stay self-hosted (/pdf.worker.min.mjs). No CDN.");
  process.exit(1);
}

console.log("[check-no-network] OK — no CDN host or off-origin worker/cmap URL in lib/ or components/");
