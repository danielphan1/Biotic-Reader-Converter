import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

// The highest-value security assertion of Phase 2: adding pdfjs-dist must NOT
// break PRIV-01 (no upload / no network). This durable test asserts no source
// file under lib/extract pulls the worker/cmap from a CDN or off-origin URL —
// 02-04 must keep it green when it wires workerSrc = "/pdf.worker.min.mjs".

const CDN_HOST = /\b(cdnjs|unpkg|jsdelivr)\b/i;
const OFF_ORIGIN_ASSET = /https?:\/\/[^\s'"`]*(pdf\.worker|cmap)/i;

function extractSourceFiles(): string[] {
  const dir = "lib/extract";
  return readdirSync(dir)
    .filter((f) => /\.(ts|tsx)$/.test(f) && !/\.test\./.test(f))
    .map((f) => join(dir, f));
}

describe("no-network guard — PRIV-01 holds after adding pdfjs", () => {
  it("no lib/extract source references a CDN host or off-origin worker/cmap URL", () => {
    const files = extractSourceFiles();
    expect(files.length).toBeGreaterThan(0); // sanity: we are actually scanning something
    for (const f of files) {
      const text = readFileSync(f, "utf8");
      expect(CDN_HOST.test(text), `${f} references a CDN host`).toBe(false);
      expect(OFF_ORIGIN_ASSET.test(text), `${f} references an off-origin worker/cmap URL`).toBe(false);
    }
  });

  it("the build-time no-network guard is wired (script file + npm script)", () => {
    expect(existsSync("scripts/check-no-network.mjs")).toBe(true);
    const pkg = JSON.parse(readFileSync("package.json", "utf8"));
    expect(pkg.scripts["check:no-network"]).toContain("check-no-network.mjs");
  });

  it("pdf.ts uses the local self-hosted worker — no CDN, no new URL() worker", () => {
    const src = readFileSync("lib/extract/pdf.ts", "utf8");
    // The worker must be the root-relative local asset...
    expect(src).toContain("/pdf.worker.min.mjs");
    // ...and never a CDN host, off-origin worker/cmap URL, or the new URL() pattern
    // that breaks the Next production build.
    expect(CDN_HOST.test(src)).toBe(false);
    expect(OFF_ORIGIN_ASSET.test(src)).toBe(false);
    expect(/new URL\(/.test(src)).toBe(false);
  });
});
