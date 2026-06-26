// Self-host the PDF.js Web Worker (THE static-export spike from RESEARCH).
//
// Copies pdf.worker.min.mjs from the INSTALLED pdfjs-dist package into public/
// so the static export serves it at the root-absolute /pdf.worker.min.mjs — no
// CDN (PRIV-01) and always version-matched to the installed API (Pitfall 2:
// worker/API version mismatch). Wired into predev/prebuild so it regenerates on
// every dev start and build. Cross-platform Node fs — never a shell `cp` (this
// repo runs on a Windows host).

import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { mkdirSync, copyFileSync, statSync } from "node:fs";

const require = createRequire(import.meta.url);

// Resolve the installed package root, then the worker build artifact next to it.
const pkgJson = require.resolve("pdfjs-dist/package.json");
const pkgRoot = dirname(pkgJson);
const src = join(pkgRoot, "build", "pdf.worker.min.mjs");

const destDir = "public";
const dest = join(destDir, "pdf.worker.min.mjs");

mkdirSync(destDir, { recursive: true });
copyFileSync(src, dest);

const { size } = statSync(dest);
console.log(`[copy-pdf-worker] ${src} -> ${dest} (${size} bytes)`);
