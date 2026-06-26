import { describe, it, expect } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
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

// A real ZIP magic header (PK\x03\x04) — validateFile must reject this as
// 'unsupported' by content even though it is named .txt.
const ZIP_HEADER = "PK" + String.fromCharCode(3, 4) + " not real text";

describe("PasteTool — TXT file input slice (D-11/12/13, INPUT-07)", () => {
  it("picking a .txt shows a filename chip and never dumps the text into a textarea (D-12)", async () => {
    const { container } = render(<PasteTool />);
    pickFile(container, makeFile("Alpha line.\n\nBeta line.", "notes.txt"));

    expect(await screen.findByText("notes.txt")).toBeTruthy();
    // The extracted text appears in no input value...
    expect(screen.queryByDisplayValue(/Alpha line/)).toBeNull();
    // ...and the textarea is replaced by the chip in the loaded state.
    expect(screen.queryByLabelText("Paste your text")).toBeNull();
  });

  it("pressing the existing Convert with a loaded .txt renders the biotic result (D-13)", async () => {
    const { container } = render(<PasteTool />);
    pickFile(container, makeFile("Reading helps focus.", "doc.txt"));
    await screen.findByText("doc.txt");

    fireEvent.click(screen.getByRole("button", { name: /convert/i }));

    const reader = await screen.findByLabelText("Converted text");
    await waitFor(() => expect(reader.textContent).toContain("Reading"));
    // Bolding is real semantic <b>, conveyed by the shared transform engine.
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
    // The reader stays in its empty placeholder — no converted output rendered.
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
