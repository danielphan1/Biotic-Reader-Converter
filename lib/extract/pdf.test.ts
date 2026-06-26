// @vitest-environment node
//
// Integration spec for the PDF runtime. Headless-pdfjs decision: we exercise the
// REAL pdfjs parser (no stubbing of reflow/classify) by mocking the "pdfjs-dist"
// import to the legacy build with `disableWorker: true` — verified to parse on
// the main thread under Node (no Web Worker, no DOMMatrix needed). The mock also
// wraps loadingTask.destroy() with a spy so D-15 teardown is assertable. This
// runs in the node environment (see directive above), not jsdom.
//
// Fixtures (test/fixtures/*.pdf) are minimal hand-built PDFs with a correct xref,
// produced by scratchpad/gen-fixtures.mjs:
//   - digital.pdf:   2 pages, real Helvetica text layer
//   - scanned.pdf:   1 page, empty content stream (no text layer) -> 0 chars
//   - encrypted.pdf: Standard (RC4 V1/R2) security handler -> PasswordException
import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// destroy() spies are collected per getDocument() call so the cancel test can
// assert the worker/document was torn down.
const destroySpies: Array<ReturnType<typeof vi.fn>> = [];

vi.mock("pdfjs-dist", async () => {
  const real = (await import("pdfjs-dist/legacy/build/pdf.mjs")) as typeof import("pdfjs-dist");
  return {
    ...real,
    // Decoupled from the real module: pdf.ts assigns workerSrt here, but the real
    // legacy parser keeps its own (empty) workerSrc and runs the built-in fake
    // worker via disableWorker — so it never tries to import the local worker path.
    GlobalWorkerOptions: { workerSrc: "" },
    getDocument: (opts: Parameters<typeof real.getDocument>[0]) => {
      // disableWorker forces main-thread parse for the headless test env; it is a
      // runtime-honored pdfjs option not present in the public option types.
      const params = {
        ...(opts as Record<string, unknown>),
        disableWorker: true,
        isEvalSupported: false,
      } as Parameters<typeof real.getDocument>[0];
      const task = real.getDocument(params);
      const origDestroy = task.destroy.bind(task);
      const spy = vi.fn(() => origDestroy());
      task.destroy = spy;
      destroySpies.push(spy);
      return task;
    },
  };
});

import { extractPdf } from "./pdf";

function pdfBuffer(name: string): ArrayBuffer {
  const b = readFileSync(resolve(process.cwd(), `test/fixtures/${name}.pdf`));
  return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
}
const liveSignal = () => new AbortController().signal;

beforeEach(() => {
  destroySpies.length = 0;
});

describe("extractPdf — digital PDF runtime (INPUT-03/06/07, D-14/15, PRIV-01)", () => {
  it("extracts a digital PDF to real reflowed paragraphs", async () => {
    const r = await extractPdf(pdfBuffer("digital"), () => {}, liveSignal());
    expect("ok" in r && r.ok).toBe(true);
    if ("ok" in r && r.ok) {
      const all = r.doc.paragraphs.join(" ");
      expect(all).toContain("Reading helps focus");
      expect(all).toContain("Second page");
    }
  });

  it("classifies an image-only / no-text PDF as scanned (whole-document density)", async () => {
    const r = await extractPdf(pdfBuffer("scanned"), () => {}, liveSignal());
    expect(r).toEqual({ error: true, reason: "scanned" });
  });

  it("maps a password-protected PDF to reason:password", async () => {
    const r = await extractPdf(pdfBuffer("encrypted"), () => {}, liveSignal());
    expect(r).toEqual({ error: true, reason: "password" });
  });

  it("fires onProgress (page n of M) for every page (D-14)", async () => {
    const calls: Array<[number, number]> = [];
    await extractPdf(pdfBuffer("digital"), (p, t) => calls.push([p, t]), liveSignal());
    expect(calls).toEqual([
      [1, 2],
      [2, 2],
    ]);
  });

  it("aborting mid-loop stops early, returns cancelled, and destroys the task (D-15)", async () => {
    const controller = new AbortController();
    const calls: Array<[number, number]> = [];
    const r = await extractPdf(
      pdfBuffer("digital"),
      (p, t) => {
        calls.push([p, t]);
        controller.abort(); // abort right after page 1's progress
      },
      controller.signal,
    );
    expect(r).toEqual({ error: true, reason: "cancelled" });
    expect(calls).toEqual([[1, 2]]); // page 2 work never started
    expect(destroySpies.some((s) => s.mock.calls.length > 0)).toBe(true);
  });

  it("makes no network/fetch call during extraction (PRIV-01)", async () => {
    const fetchSpy = vi.fn();
    const original = globalThis.fetch;
    globalThis.fetch = fetchSpy as unknown as typeof fetch;
    try {
      await extractPdf(pdfBuffer("digital"), () => {}, liveSignal());
    } finally {
      globalThis.fetch = original;
    }
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
