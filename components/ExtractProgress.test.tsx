import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// ExtractProgress has two modes: the determinate PDF bar (page N of M, D-14) and
// an indeterminate DOCX indicator ("Reading document…", D-19). The indeterminate
// mode must NOT expose a false percentage (no aria-valuenow, no "page … of …"),
// and Cancel must work identically in both modes.
import { ExtractProgress } from "./ExtractProgress";

describe("ExtractProgress — determinate vs indeterminate (D-14/D-19)", () => {
  it("indeterminate mode shows 'Reading document…' and no determinate page text", () => {
    render(<ExtractProgress indeterminate onCancel={() => {}} />);
    expect(screen.getByText(/Reading document/i)).toBeTruthy();
    expect(screen.queryByText(/page \d+ of \d+/i)).toBeNull();
  });

  it("indeterminate mode sets no aria-valuenow (activity, not a false percentage)", () => {
    render(<ExtractProgress indeterminate onCancel={() => {}} />);
    const bar = screen.getByRole("progressbar");
    expect(bar.getAttribute("aria-valuenow")).toBeNull();
  });

  it("indeterminate Cancel invokes onCancel", () => {
    const onCancel = vi.fn();
    render(<ExtractProgress indeterminate onCancel={onCancel} />);
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("determinate mode still shows 'Extracting page 1 of 3' with aria-valuenow=1 (regression)", () => {
    render(<ExtractProgress page={1} total={3} onCancel={() => {}} />);
    expect(screen.getByText(/Extracting page 1 of 3/i)).toBeTruthy();
    const bar = screen.getByRole("progressbar");
    expect(bar.getAttribute("aria-valuenow")).toBe("1");
  });
});
