import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";

// Controllable extractPdf mock: it captures the onProgress emitter, the abort
// signal, and a resolve handle so each test can emit progress and settle the
// result deterministically (no real pdfjs in the component test).
const pdfCtl = vi.hoisted(() => ({
  onProgress: null as null | ((p: number, t: number) => void),
  signal: null as null | AbortSignal,
  resolve: null as null | ((r: unknown) => void),
}));

vi.mock("@/lib/extract/pdf", () => ({
  extractPdf: (
    _buf: ArrayBuffer,
    onProgress: (p: number, t: number) => void,
    signal: AbortSignal,
  ) =>
    new Promise((resolve) => {
      pdfCtl.onProgress = onProgress;
      pdfCtl.signal = signal;
      pdfCtl.resolve = resolve;
    }),
}));

import { PasteTool } from "./PasteTool";

function makeFile(content: string, name: string, type = "text/plain"): File {
  return new File([content], name, { type });
}

function fileInput(container: HTMLElement): HTMLInputElement {
  const el = container.querySelector('input[type="file"]');
  if (!el) throw new Error("file input not found");
  return el as HTMLInputElement;
}

// jsdom doesn't allow assigning a non-empty value to a file input; define the
// FileList directly, then fire change so PasteTool's onFile runs.
function pickFile(container: HTMLElement, file: File) {
  const input = fileInput(container);
  Object.defineProperty(input, "files", { value: [file], configurable: true });
  fireEvent.change(input);
}

const ZIP_HEADER = "PK" + String.fromCharCode(3, 4) + " not real text";
const PDF_HEADER = "%PDF-1.4 minimal";

beforeEach(() => {
  pdfCtl.onProgress = null;
  pdfCtl.signal = null;
  pdfCtl.resolve = null;
});

describe("PasteTool — TXT file input slice (D-11/12/13, INPUT-07)", () => {
  it("picking a .txt shows a filename chip and never dumps the text into a textarea (D-12)", async () => {
    const { container } = render(<PasteTool />);
    pickFile(container, makeFile("Alpha line.\n\nBeta line.", "notes.txt"));

    expect(await screen.findByText("notes.txt")).toBeTruthy();
    expect(screen.queryByDisplayValue(/Alpha line/)).toBeNull();
    expect(screen.queryByLabelText("Paste your text")).toBeNull();
  });

  it("pressing the existing Convert with a loaded .txt renders the biotic result (D-13)", async () => {
    const { container } = render(<PasteTool />);
    pickFile(container, makeFile("Reading helps focus.", "doc.txt"));
    await screen.findByText("doc.txt");

    fireEvent.click(screen.getByRole("button", { name: /convert/i }));

    const reader = await screen.findByLabelText("Converted text");
    await waitFor(() => expect(reader.textContent).toContain("Reading"));
    expect(reader.querySelector("b")).toBeTruthy();
  });

  it("remove on the chip returns the card to the plain paste state", async () => {
    const { container } = render(<PasteTool />);
    pickFile(container, makeFile("Some text.", "x.txt"));
    await screen.findByText("x.txt");

    fireEvent.click(screen.getByRole("button", { name: /remove/i }));

    expect(screen.queryByText("x.txt")).toBeNull();
    expect(screen.getByLabelText("Paste your text")).toBeTruthy();
  });

  it("an unsupported file surfaces a calm INPUT-07 message and Convert yields no output", async () => {
    const { container } = render(<PasteTool />);
    pickFile(container, makeFile(ZIP_HEADER, "fake.txt"));

    expect(await screen.findByText(/isn't supported yet/i)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /convert/i }));
    expect(screen.queryByText("Your converted text")).toBeNull();
    expect(screen.getByText(/will appear here/i)).toBeTruthy();
  });

  it("the pasted-text path still converts (regression — shared splitParagraphs)", async () => {
    render(<PasteTool />);
    fireEvent.change(screen.getByLabelText("Paste your text"), {
      target: { value: "Focus mode.\n\nSecond block." },
    });
    fireEvent.click(screen.getByRole("button", { name: /convert/i }));

    const reader = await screen.findByLabelText("Converted text");
    await waitFor(() => expect(reader.textContent).toContain("Focus"));
    expect(reader.querySelectorAll("p").length).toBe(2);
  });
});

describe("PasteTool — PDF dispatch slice (D-14/D-15, INPUT-07)", () => {
  it("shows a determinate progress bar, then a chip on success, then converts", async () => {
    const { container } = render(<PasteTool />);
    pickFile(container, makeFile(PDF_HEADER, "report.pdf", "application/pdf"));

    // extractPdf was dispatched (captured the emitter); emit per-page progress (D-14).
    await waitFor(() => expect(typeof pdfCtl.onProgress).toBe("function"));
    act(() => pdfCtl.onProgress!(2, 5));

    expect(await screen.findByRole("progressbar")).toBeTruthy();
    expect(screen.getByText(/Extracting page 2 of 5/i)).toBeTruthy();

    // Resolve success -> progress clears, chip appears, textarea stays untouched (D-12).
    await act(async () => {
      pdfCtl.resolve!({ ok: true, doc: { paragraphs: ["Pdf body text here."] } });
    });
    expect(await screen.findByText("report.pdf")).toBeTruthy();
    expect(screen.queryByRole("progressbar")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /convert/i }));
    const reader = await screen.findByLabelText("Converted text");
    await waitFor(() => expect(reader.textContent).toContain("Pdf"));
  });

  it("a scanned PDF shows the calm 'no selectable text' message and Convert yields no output", async () => {
    const { container } = render(<PasteTool />);
    pickFile(container, makeFile(PDF_HEADER, "scan.pdf", "application/pdf"));

    await waitFor(() => expect(typeof pdfCtl.resolve).toBe("function"));
    await act(async () => {
      pdfCtl.resolve!({ error: true, reason: "scanned" });
    });

    expect(await screen.findByText(/no selectable text/i)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /convert/i }));
    expect(screen.queryByText("Your converted text")).toBeNull();
  });

  it("Cancel aborts the signal and resets the card to the empty drop-zone (D-15)", async () => {
    const { container } = render(<PasteTool />);
    pickFile(container, makeFile(PDF_HEADER, "big.pdf", "application/pdf"));

    await waitFor(() => expect(pdfCtl.signal).toBeTruthy());
    act(() => pdfCtl.onProgress!(1, 50));

    const cancel = await screen.findByRole("button", { name: /cancel/i });
    fireEvent.click(cancel);
    expect(pdfCtl.signal!.aborted).toBe(true);

    // The real extractPdf resolves cancelled once aborted; settle the mock the same way.
    await act(async () => {
      pdfCtl.resolve!({ error: true, reason: "cancelled" });
    });

    expect(await screen.findByLabelText("Paste your text")).toBeTruthy();
    expect(screen.queryByRole("progressbar")).toBeNull();
    expect(screen.queryByText("big.pdf")).toBeNull();
  });
});
