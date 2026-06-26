import { describe, it, expect } from "vitest";
import { splitParagraphs } from "./split";

// splitParagraphs is the single source of truth for paragraph splitting — its
// semantics MUST match PasteTool's original toDoc byte-for-byte (02-03 rewires
// PasteTool to call this), so paste, TXT, and PDF all reflow identically.
describe("splitParagraphs — single source of truth (parity with PasteTool toDoc)", () => {
  it("splits blank-line-separated blocks into trimmed paragraphs", () => {
    expect(splitParagraphs("a\n\nb")).toEqual(["a", "b"]);
  });

  it("drops empty / whitespace-only blocks and trims each kept block", () => {
    expect(splitParagraphs("  one  \n\n\n  \n\n two ")).toEqual(["one", "two"]);
  });

  it("keeps a single block (with soft single newlines) as one paragraph", () => {
    expect(splitParagraphs("just one block\nwith a soft break")).toEqual([
      "just one block\nwith a soft break",
    ]);
  });

  it("returns [] for all-whitespace input", () => {
    expect(splitParagraphs("   \n\n  ")).toEqual([]);
  });
});
