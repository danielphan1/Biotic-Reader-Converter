# Biotic Reader Converter

## What This Is

A web app that converts documents into "biotic reading" (Bionic Reading) format — bolding the first portion of each word to create fixation points that help the eye move faster and stay focused. Users land on a page that explains the technique and shows a live example, then upload a document (PDF, Word/DOCX, plain text, pasted text, or a scanned image/photo). The app extracts the text — using OCR for scans — applies the bolding transformation, and returns a clean, readable version they can read on-screen and download. It is built primarily as an accessibility and focus aid for people with ADHD, dyslexia, or anyone who struggles to stay focused while reading.

## Core Value

A user can take a document — in almost any common form, including a photo of a printed page — and get back readable, biotic-formatted text that genuinely helps them focus.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Landing experience explains what biotic/Bionic reading is
- [ ] A built-in live example demonstrates the effect before the user uploads anything
- [ ] User can upload a PDF and have its text extracted
- [ ] User can upload a Word/DOCX file and have its text extracted
- [ ] User can upload a plain-text (.txt) file or paste raw text
- [ ] User can upload a scanned image/photo and have its text extracted via OCR
- [ ] Extracted text is transformed into biotic reading (first portion of each word bolded)
- [ ] User can read the converted result on-screen
- [ ] User can download the converted result as a file
- [ ] Output is presented as clean, reflowed, readable text (paragraphs/headings preserved)

### Out of Scope

- User accounts / login — anonymous one-shot tool; nothing is saved between sessions
- Saved conversion history — no persistence of user documents
- Pixel-perfect layout reproduction (columns, exact positioning, embedded images) — output is clean reflowed text, not a faithful copy of the source layout
- User-tunable bolding (adjusting how much of each word is bolded, spacing) — fixed algorithm for v1
- Desktop/native app — web-first
- Mobile native app — web-first

## Context

- Greenfield project — no existing code.
- "Biotic reading" here means Bionic Reading: bolding the leading ~40–50% of each word's letters to guide eye fixation.
- The mix of accepted inputs is deliberately broad. Scanned images/photos require OCR (image text recognition), which is a meaningfully harder capability than text extraction from digital PDFs/DOCX. Reliable OCR is a core differentiator vs. the simpler "paste text" tools that already exist.
- Output fidelity is intentionally relaxed to "clean reflowed text" so the bolding transformation works consistently across all input types (including OCR results, where original layout cannot be reliably reconstructed).
- Accessibility is the framing audience (ADHD, dyslexia, focus), which raises the bar on readability of the output itself.

## Constraints

- **Platform**: Web app — runs in the browser, nothing to install.
- **Auth**: None — anonymous usage, no persistence of user documents.
- **Privacy**: Users upload personal documents; uploads should not be retained beyond the conversion.
- **Accessibility**: Output and UI should be readable/usable for the target audience (focus/dyslexia aid).

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Bionic-style first-letter bolding, fixed algorithm | Matches the well-known technique; keeps v1 simple | — Pending |
| Accept PDF, DOCX, TXT, paste, and scanned images | Broad input support (incl. OCR) is the main value over paste-only tools | — Pending |
| Clean reflowed text output (not pixel-perfect layout) | Works consistently across all inputs, including OCR | — Pending |
| Anonymous, no accounts, nothing saved | Simplest v1; reduces privacy surface for user documents | — Pending |
| Web app | No install; broadest reach for a demo/accessibility tool | — Pending |
| Download format (HTML page vs generated PDF) | Open — settle during requirements/roadmap | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-06-24 after initialization*
