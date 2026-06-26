import { describe, it, expect } from "vitest";
import { reflowPage } from "./reflow";

// Stub the pdfjs TextItem shape used by reflow: str + transform [a,b,c,d,x,y]
// (x=transform[4], y=transform[5] baseline) + width + height + hasEOL.
type Item = {
  str: string;
  transform: number[];
  width: number;
  height: number;
  hasEOL?: boolean;
};
const item = (
  str: string,
  x: number,
  y: number,
  width = str.length * 6,
  height = 10,
  hasEOL = false,
): Item => ({ str, transform: [1, 0, 0, 1, x, y], width, height, hasEOL });

describe("reflowPage — TextItem[] -> clean single-column text (INPUT-03)", () => {
  it("joins same-baseline fragments with a space across a horizontal gap", () => {
    const out = reflowPage([item("Hello", 72, 700, 30), item("world", 110, 700, 30)]);
    expect(out).toBe("Hello world");
  });

  it("does not insert a space when fragments are adjacent (no gap)", () => {
    const out = reflowPage([item("Hel", 72, 700, 18), item("lo", 90, 700, 12)]);
    expect(out).toBe("Hello");
  });

  it("starts a new line when the baseline y changes", () => {
    const out = reflowPage([item("Line one", 72, 700, 48), item("Line two", 72, 680, 48)]);
    expect(out).toBe("Line one\nLine two");
  });

  it("treats hasEOL as a hard line break even on the same baseline", () => {
    const out = reflowPage([item("First", 72, 700, 30, 10, true), item("Second", 72, 700, 36)]);
    expect(out).toBe("First\nSecond");
  });

  it("de-hyphenates a word split across lines (exam-\\nple -> example)", () => {
    const out = reflowPage([item("exam-", 72, 700, 30), item("ple", 72, 680, 18)]);
    expect(out).toBe("example");
  });

  it("skips marked-content items that have no str", () => {
    const items = [{ type: "beginMarkedContent" } as unknown as Item, item("Text", 72, 700, 24)];
    expect(reflowPage(items)).toBe("Text");
  });
});
