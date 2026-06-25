import { describe, it, expect } from "vitest";
import { buildExportHtml } from "./export-html";

// OUT-01 / D-05: the downloaded file must be a single, self-contained, dependency-free
// HTML document that reads identically OFFLINE in any browser, with the biotic bolding
// preserved as semantic font-weight. These structure tests lock that contract.
describe("buildExportHtml", () => {
  const body = "<p><b>Hi</b> there</p>";

  it("produces a well-formed document embedding the body html", () => {
    const out = buildExportHtml(body);
    expect(out.toLowerCase()).toMatch(/^\s*<!doctype html/);
    expect(out).toContain("<html");
    expect(out).toContain("<head");
    expect(out.toLowerCase()).toContain("<meta charset");
    expect(out).toContain("<style");
    expect(out).toContain("<body");
    expect(out).toContain("<b>Hi</b> there");
  });

  it("is self-contained: inline styling, no external/remote dependencies", () => {
    const out = buildExportHtml(body);
    // inline <style> with a system font stack and a background color
    expect(out).toContain("<style");
    expect(out).toMatch(/font-family\s*:/i);
    expect(out).toMatch(/background/i);
    // no external resources, no script
    expect(out.toLowerCase()).not.toContain("<link ");
    expect(out.toLowerCase()).not.toContain("<script");
    expect(out).not.toMatch(/https?:\/\//);
  });

  it("preserves the biotic bold tags", () => {
    expect(buildExportHtml(body)).toContain("<b>Hi</b>");
  });

  it("does not leak the trademarked term in the title", () => {
    const out = buildExportHtml(body);
    const title = /<title>([\s\S]*?)<\/title>/i.exec(out)?.[1] ?? "";
    expect(title.toLowerCase()).not.toContain("bionic");
  });
});
