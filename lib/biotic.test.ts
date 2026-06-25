import { describe, it, expect } from "vitest";
import { bioticHtml, bioticDoc } from "./biotic";

// Reconstruct the original user text from transform output by removing the
// engine's own <b>/<p> tags and un-escaping the HTML entities. Used to prove
// content is preserved while only the leading fraction is wrapped.
const stripTags = (s: string): string =>
  s.replace(/<\/?b>/g, "").replace(/<\/?p>/g, "\n");
const unescape = (s: string): string =>
  s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
const plain = (s: string): string => unescape(stripTags(s));
const boldCount = (s: string): number => (s.match(/<b>/g) || []).length;

describe("bioticHtml — bolds leading fraction (XFORM-01)", () => {
  it("wraps the leading ~45% of a word in a single <b> and leaves the rest", () => {
    const out = bioticHtml("reading");
    expect(out.startsWith("<b>")).toBe(true); // leading fraction is bold
    expect(boldCount(out)).toBe(1); // exactly one bold run for one word
    expect(/<\/b>\w/.test(out)).toBe(true); // a non-empty unbolded tail follows
    expect(plain(out)).toBe("reading"); // every letter preserved
  });

  it("short words still get at least one bold char (boldCount = max(1, round(n*0.45)))", () => {
    const a = bioticHtml("a");
    expect(boldCount(a)).toBe(1);
    expect(plain(a)).toBe("a");

    const to = bioticHtml("to");
    expect(boldCount(to)).toBe(1);
    expect(plain(to)).toBe("to");
  });
});

describe("bioticHtml — escapes html (XSS, Pitfall 1 / V5 HIGH)", () => {
  // The security invariant: after removing only the engine's own <b> tags,
  // NO raw angle brackets from user input may remain — every < and > the user
  // pasted must be escaped. This is the one HIGH-severity gate for the phase.
  const onlyEngineTagsAreRaw = (out: string) => {
    const userPortion = out.replace(/<\/?b>/g, "").replace(/<\/?p>/g, "");
    expect(userPortion).not.toContain("<");
    expect(userPortion).not.toContain(">");
  };

  it("escapes an <img onerror> payload — no raw tag executes", () => {
    const out = bioticHtml("<img src=x onerror=alert(1)>");
    expect(out).not.toContain("<img");
    expect(out).toContain("&lt;");
    expect(out).toContain("&gt;");
    onlyEngineTagsAreRaw(out);
  });

  it("escapes a <script> payload — no raw <script> substring", () => {
    const out = bioticHtml("<script>alert(1)</script>");
    expect(out).not.toContain("<script");
    expect(out).toContain("&lt;");
    expect(out).toContain("&gt;");
    onlyEngineTagsAreRaw(out);
  });

  it("escapes a bare ampersand", () => {
    const out = bioticHtml("Tom & Jerry");
    expect(out).toContain("&amp;");
    expect(out).not.toMatch(/&(?!amp;|lt;|gt;)/); // no unescaped & survives
  });
});

describe("bioticHtml — unicode edge cases (XFORM-02)", () => {
  it("skips pure numbers", () => {
    const out = bioticHtml("1234");
    expect(out).not.toContain("<b>");
    expect(plain(out)).toBe("1234");
  });

  it("skips alphanumeric segments containing a digit (e.g. 3rd)", () => {
    const out = bioticHtml("3rd");
    expect(out).not.toContain("<b>");
    expect(plain(out)).toBe("3rd");
  });

  it("passes non-Latin scripts through unchanged (CJK)", () => {
    const out = bioticHtml("日本語");
    expect(out).not.toContain("<b>");
    expect(out).toContain("日本語");
  });

  it("passes non-Latin scripts through unchanged (Arabic)", () => {
    const out = bioticHtml("مرحبا");
    expect(out).not.toContain("<b>");
    expect(out).toContain("مرحبا");
  });

  it("keeps a contraction as one bolded word", () => {
    const out = bioticHtml("don't");
    expect(out).toContain("<b>");
    expect(plain(out)).toBe("don't");
  });

  it("bolds accented words with combining marks intact", () => {
    const cafe = bioticHtml("café");
    expect(cafe).toContain("<b>");
    expect(plain(cafe)).toBe("café");

    const naive = bioticHtml("naïve");
    expect(naive).toContain("<b>");
    expect(plain(naive)).toBe("naïve");
  });

  it("bolds the two pieces of a hyphenated word separately", () => {
    const out = bioticHtml("co-op");
    expect(boldCount(out)).toBe(2);
    expect(plain(out)).toBe("co-op");
  });

  it("does not bold punctuation or whitespace", () => {
    const out = bioticHtml("hi, there");
    expect(plain(out)).toBe("hi, there");
    // comma and space are untouched between the two bolded words
    expect(out).toContain(", ");
  });
});

describe("bioticDoc — paragraph fan-in", () => {
  it("wraps each paragraph in a <p>", () => {
    const out = bioticDoc({ paragraphs: ["one", "two"] });
    expect(boldCountP(out)).toBe(2);
    expect(out).toContain("<b>"); // words inside paragraphs are still transformed
  });

  it("returns an empty string for no paragraphs", () => {
    expect(bioticDoc({ paragraphs: [] })).toBe("");
  });
});

function boldCountP(s: string): number {
  return (s.match(/<p>/g) || []).length;
}
