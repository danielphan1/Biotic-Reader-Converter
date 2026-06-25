<!-- GSD:project-start source:PROJECT.md -->

## Project

**Biotic Reader Converter**

A web app that converts documents into "biotic reading" (Bionic Reading) format — bolding the first portion of each word to create fixation points that help the eye move faster and stay focused. Users land on a page that explains the technique and shows a live example, then upload a document (PDF, Word/DOCX, plain text, pasted text, or a scanned image/photo). The app extracts the text — using OCR for scans — applies the bolding transformation, and returns a clean, readable version they can read on-screen and download. It is built primarily as an accessibility and focus aid for people with ADHD, dyslexia, or anyone who struggles to stay focused while reading.

**Core Value:** A user can take a document — in almost any common form, including a photo of a printed page — and get back readable, biotic-formatted text that genuinely helps them focus.

### Constraints

- **Platform**: Web app — runs in the browser, nothing to install.
- **Auth**: None — anonymous usage, no persistence of user documents.
- **Privacy**: Users upload personal documents; uploads should not be retained beyond the conversion.
- **Accessibility**: Output and UI should be readable/usable for the target audience (focus/dyslexia aid).

<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->

## Technology Stack

## Headline Recommendation: Go fully client-side

- The privacy requirement ("uploads should not be retained beyond the conversion") is **trivially and provably satisfied** if files never leave the device. There is no upload to retain, no server-side data-handling policy to write, no compliance surface.
- Every required capability has a mature, browser-capable library: `pdfjs-dist` (PDF), `mammoth` (DOCX), `tesseract.js` (OCR via WASM), native `File`/`FileReader` (TXT/paste), and `docx`/Blob download (output).
- It is also **cheaper and simpler to operate**: a static/edge-hosted single-page app with no backend compute, no per-request OCR cost, no Lambda memory tuning. Server-side Tesseract on serverless is a known pain point (read-only `/tmp`, 500–700 MB memory for large images, cold starts) — see Sources. Avoiding a backend sidesteps all of it.

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **Next.js** | 16.2.x | App framework / build + hosting | Industry-default React meta-framework in 2025/26. Use it in **static-export / SPA mode** (no server-side document handling). Gives routing, bundling, and easy Vercel/Netlify/static hosting. App Router + React Server Components are fine for the *marketing/landing* content; all document work is client components. |
| **React** | 19.2.x | UI rendering | Standard. The Bionic output is just HTML with `<b>` spans — React renders it directly via controlled state. Live demo, upload UI, progress, and on-screen result are all ordinary React state. |
| **TypeScript** | 5.x | Language | Non-negotiable for a multi-library pipeline (PDF/DOCX/OCR types). Catches the format-branching bugs (wrong reader for wrong MIME type) at compile time. |
| **Tailwind CSS** | 4.x | Styling | Fast to build the landing/demo and an accessible reading surface. Accessibility framing (dyslexia/ADHD) means you'll want easy control over line-height, max-width measure, font choice — Tailwind makes that trivial. Pair with a dyslexia-friendly font option (e.g. system + optional OpenDyslexic). |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **text-vide** | 1.8.6 | Bionic-reading transform | **Use this, do not roll your own.** MIT-licensed, browser+Node, zero-dependency. Implements the "bold leading fraction of each word" algorithm with tunable `fixationPoint`/`sep` options. It's the de-facto open-source Bionic implementation (powers several clones). Wrap its output in your reader component. |
| **pdfjs-dist** | 6.0.x (6.0.227) | PDF text extraction | Mozilla PDF.js, the browser-native standard. Use `getDocument()` → per-page `getTextContent()` to pull text. Runs entirely client-side; PDF never leaves the device. Ship the worker (`pdf.worker.min.mjs`) as a static asset. Note: extracts text from *digital* PDFs only — image-only/scanned PDFs yield no text and must be routed to OCR. |
| **mammoth** | 1.12.0 | DOCX extraction | The standard `.docx`→HTML/text converter. Use `extractRawText()` for clean reflowed text (matches the "clean reflowed text" output goal) or `convertToHtml()` if you want to preserve headings/paragraphs as semantic HTML before applying Bionic. Works in-browser from an ArrayBuffer. **Security note:** mammoth does not sanitize — sanitize its HTML before injecting (see Pitfalls). |
| **tesseract.js** | 7.0.0 | OCR for scanned images/photos | The standard pure-JS/WASM OCR engine (wraps Tesseract 5). Runs in a Web Worker, 100+ languages. v7 cut runtime ~15–35% vs v6 via relaxed-SIMD WASM. Load `eng` traineddata (lazy/CDN). This is the differentiator capability — keep it client-side for privacy. |
| **docx** | 9.7.1 | Generate downloadable .docx | `dolanmiu/docx` — declarative, works in the browser, produces a real Word file. Build paragraphs with bold `TextRun`s so the **Bionic bolding survives in the downloaded file** (a plain-text download would lose the effect). |
| **file-saver** | 2.x | Trigger client download | Tiny, reliable Blob→download helper. Or use a native `<a download>` + `URL.createObjectURL` and skip the dependency. |
| **dompurify** | 3.x | Sanitize HTML | Required if you take mammoth's or any HTML path and inject it. Also sanitize before generating an HTML download. |

### Output / Download strategy

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Vite or Next build | Bundling | Next 16 includes its own toolchain; if you drop Next for a pure SPA, Vite 5+ is the standard. Either is fine. |
| Web Workers | Off-main-thread OCR/parsing | Tesseract.js manages its own worker; consider also running PDF parse off-thread for large files to keep the UI responsive. Configure bundler to emit `.worker` and WASM assets correctly. |
| ESLint + Prettier | Lint/format | Standard. |
| Vitest + Playwright | Test transform + e2e upload flows | Unit-test the Bionic transform and format-routing; Playwright to validate real PDF/DOCX/image uploads end-to-end. |

## Installation

# Core framework

# Document pipeline

# Output + safety

# Dev/test

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Fully client-side pipeline | Server-side extraction/OCR | Only if you must support very large scanned files or low-end client devices where in-browser OCR is too slow, or need OCR quality beyond Tesseract. Then run OCR in a single ephemeral serverless/edge function that streams result and **writes nothing to disk** — preserving the no-retention promise. |
| text-vide | Roll-your-own bolding | Only if you need behavior text-vide can't express. Its algorithm + `fixationPoint` covers the "fixed 40–50% bold" spec. Rolling your own is unnecessary risk. |
| tesseract.js (client) | Cloud OCR (Google Vision, AWS Textract, Azure) | If OCR accuracy on messy photos becomes the product's weak point. Cloud OCR is markedly more accurate on real-world photos — but it **breaks the privacy story** (documents go to a third party) and adds per-call cost. Treat as a deliberate, disclosed upgrade, not a default. |
| Next.js (static/SPA mode) | Plain Vite + React SPA | If you want zero framework opinion and no server runtime at all. Vite SPA is lighter; Next gives you nicer landing-page SSG and a clearer upgrade path if you later add an OCR-fallback function. |
| mammoth | docx-preview / officeparser | mammoth is best for *clean reflowed* text/HTML (your stated goal). Use a renderer like docx-preview only if you wanted faithful layout — which is explicitly out of scope. |
| HTML/DOCX download | PDF download (jsPDF/pdf-lib) | Only if users explicitly need PDF output. Requires font embedding + manual bold runs. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| The official **bionic-reading.com API** | Paid/proprietary, sends user text to a third-party server (privacy violation), external dependency for a core feature | `text-vide` locally |
| **Server-side file uploads as the default** | Directly conflicts with the no-retention privacy constraint; adds infra, cost, and a data-handling liability for personal documents | Client-side extraction/OCR; files never leave the device |
| **Tesseract.js on AWS Lambda / generic serverless** as the primary OCR path | Known operational pain: read-only `/tmp` blocks traineddata download, 500–700 MB memory for large images, cold-start latency, timeouts | Client-side tesseract.js in a Web Worker |
| **`pdf-parse` / scraping PDFs server-side** | Pulls processing to a backend you don't need and reintroduces the retention problem | `pdfjs-dist` in-browser |
| `dangerouslySetInnerHTML` on raw mammoth output | mammoth performs **no sanitization** of untrusted docx | Sanitize with DOMPurify first |
| Assuming PDF extraction "just works" for all PDFs | Scanned/image-only PDFs contain no text layer — `getTextContent()` returns empty | Detect empty text → route those pages through tesseract.js OCR |

## Stack Patterns by Variant

- Add a single stateless serverless/edge OCR endpoint as an *opt-in fallback*
- Stream the image in, return text, persist nothing — keep the no-retention guarantee explicit in code (no disk writes, no logging of content)
- Offer an optional cloud-OCR toggle (Google Vision / Azure Read), clearly disclosing that the image is sent to a third party
- Keep tesseract.js as the private default
- Drop Next server features; ship a Vite + React SPA to static hosting (Netlify/Cloudflare Pages/GitHub Pages)
- All libraries above run unchanged client-side

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| next@16.2 | react@19.2, react-dom@19.2 | Next 16 requires React 19; matched majors. |
| pdfjs-dist@6 | Modern bundlers (ESM) | v6 is ESM-first; ensure the worker is served as a static asset and `workerSrc` is set. Use `.mjs` worker build. |
| tesseract.js@7 | Browsers with WASM + SIMD | Relaxed-SIMD build needs a reasonably modern browser; falls back otherwise. Host or CDN the core/worker/traineddata assets. |
| mammoth@1.12 | Browser (ArrayBuffer input) | Pass `{ arrayBuffer }`; sanitize HTML output downstream. |
| docx@9.7 | Browser (Blob output) | Use `Packer.toBlob()` in-browser for download. |

## Confidence by Area

| Area | Confidence | Reason |
|------|------------|--------|
| Client-side architecture decision | HIGH | Multiple sources confirm browser-capable libs exist for every step; privacy constraint makes the choice clear-cut; serverless Tesseract downsides well-documented. |
| Library choices + versions | HIGH | Versions pulled from npm registry on 2026-06-24 (text-vide 1.8.6, tesseract.js 7.0.0, mammoth 1.12.0, pdfjs-dist 6.0.227, docx 9.7.1, next 16.2.9, react 19.2.7). |
| Bionic transform (text-vide) | HIGH | Verified MIT, browser+Node, de-facto standard implementation. |
| OCR accuracy on real photos | MEDIUM | tesseract.js is solid for clean Latin text; messy phone photos benefit from preprocessing (grayscale/contrast/upscale) and may still trail cloud OCR. Flag as a phase risk. |

## Sources

- npm registry (registry.npmjs.org) — verified current versions: text-vide@1.8.6, tesseract.js@7.0.0, mammoth@1.12.0, pdfjs-dist@6.0.227, docx@9.7.1, next@16.2.9, react@19.2.7 — HIGH
- https://github.com/Gumball12/text-vide — text-vide (Bionic transform), MIT, browser+Node — HIGH
- https://github.com/naptha/tesseract.js — Tesseract.js OCR, v6→v7 perf, Web Worker model — HIGH
- https://www.npmjs.com/package/mammoth — DOCX extraction, extractRawText/convertToHtml, no sanitization warning — HIGH
- https://www.nutrient.io/blog/how-to-extract-text-from-a-pdf-using-javascript/ — PDF.js client-side extraction pattern — MEDIUM
- https://github.com/dolanmiu/docx + https://docx.js.org/ — DOCX generation in browser — HIGH
- https://transloadit.com/devtips/integrating-ocr-in-the-browser-with-tesseract-js/ — browser OCR privacy/perf tradeoffs — MEDIUM
- https://aalvarez.me/posts/building-an-ocr-service-with-tesseractjs-in-aws-lambda/ — serverless Tesseract memory/`/tmp` constraints — MEDIUM
- https://journals.sagepub.com/doi/10.1177/21582440251376158 — Bionic Reading usability eye-tracking study (domain context) — MEDIUM

<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->

## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->

## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->

## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->

## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:

- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->

## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
