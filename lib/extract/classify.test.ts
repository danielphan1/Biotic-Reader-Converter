import { describe, it, expect } from "vitest";
import { classifyDensity, classifyPdfError } from "./classify";

describe("classifyDensity — whole-document density (INPUT-07, Pitfall 4)", () => {
  it("flags a low-density document as scanned using the AGGREGATE, not page 1", () => {
    // 10 pages, ~1 char total -> 0.1 chars/page < 8 -> scanned (proves it is not a
    // page-1-only check: page 1 alone could look fine).
    expect(classifyDensity(["x"], 10)).toEqual({ error: true, reason: "scanned" });
  });

  it("returns ok with the doc for a healthy text density", () => {
    const paras = ["This page has plenty of selectable body text to read."];
    expect(classifyDensity(paras, 1)).toEqual({ ok: true, doc: { paragraphs: paras } });
  });

  it("returns empty for a truly blank document (0 pages / no paragraphs)", () => {
    expect(classifyDensity([], 0)).toEqual({ error: true, reason: "empty" });
  });
});

describe("classifyPdfError — exception name -> reason (INPUT-07)", () => {
  it("maps PasswordException to password", () => {
    expect(classifyPdfError({ name: "PasswordException" })).toEqual({
      error: true,
      reason: "password",
    });
  });

  it("maps InvalidPDFException to corrupt", () => {
    expect(classifyPdfError({ name: "InvalidPDFException" })).toEqual({
      error: true,
      reason: "corrupt",
    });
  });

  it("maps any other / unnamed error to unknown", () => {
    expect(classifyPdfError({ name: "WeirdError" })).toEqual({ error: true, reason: "unknown" });
    expect(classifyPdfError(null)).toEqual({ error: true, reason: "unknown" });
  });
});
