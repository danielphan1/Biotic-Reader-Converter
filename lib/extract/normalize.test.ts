import { describe, it, expect } from "vitest";
import { normalize } from "./normalize";

// All non-ASCII expressed as explicit code points so the assertions prove the
// transform rather than depending on how the editor stores composed glyphs.
const FF = "ﬀ"; // ligature ff
const FI = "ﬁ"; // ligature fi
const FFI = "ﬃ"; // ligature ffi
const FFL = "ﬄ"; // ligature ffl
const E_ACUTE_NFD = "é"; // 'e' + combining acute
const E_ACUTE_NFC = "é"; // precomposed 'é'

describe("normalize — ligature expansion + NFC (clean reflowed text)", () => {
  it("expands common typographic ligatures to ASCII letters", () => {
    expect(normalize(FI)).toBe("fi");
    expect(normalize(FF)).toBe("ff");
    expect(normalize(FFL)).toBe("ffl");
  });

  it("expands ligatures embedded inside words (fi-ligature + le -> file)", () => {
    expect(normalize(FI + "le")).toBe("file");
    expect(normalize("e" + FFI + "cient")).toBe("efficient");
  });

  it("returns NFC-normalized output (combining marks precompose)", () => {
    expect(normalize(E_ACUTE_NFD)).toBe(E_ACUTE_NFC);
  });

  it("leaves plain ASCII unchanged", () => {
    expect(normalize("hello world 123")).toBe("hello world 123");
  });
});
