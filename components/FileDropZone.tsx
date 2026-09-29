"use client";

import { useRef, useState } from "react";
import { UploadIcon } from "@/components/icons";

// FileDropZone — the unified drop affordance (D-11). It WRAPS the paste card so
// the whole region accepts both pasted text and a dropped file ("put your text
// here, however you have it"); it never replaces the textarea. A hidden
// <input type="file"> is triggered by a keyboard-focusable "browse" control
// (>=44px hit area). Drag-over lifts an accent ring and a label over the panel
// — the reserved accent token, no new colors, and no dashed-box costume.
//
// `disabled` is set while a file is already being parsed: drops are ignored and
// the browse row steps aside for the progress UI.

export function FileDropZone({
  onFile,
  disabled = false,
  children,
}: {
  onFile: (file: File) => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (file) onFile(file);
  }

  return (
    <div
      onDragOver={(e) => {
        if (disabled) return;
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        if (disabled) return;
        e.preventDefault();
        setDragOver(false);
        handleFiles(e.dataTransfer.files);
      }}
      className={`relative rounded-2xl border bg-surface shadow-panel transition-colors ${
        dragOver ? "border-accent" : "border-border-hairline"
      }`}
    >
      <div className="p-3 sm:p-4">{children}</div>

      {!disabled && (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-border-hairline px-4 py-2 text-[14px] text-text-muted sm:px-5">
          <UploadIcon className="size-4 shrink-0" />
          <span className="sm:hidden">Drop a file here, or</span>
          <span className="hidden sm:inline">Drop a .txt, .pdf or .docx file here, or</span>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="-my-1 min-h-11 rounded-md px-1 font-medium text-accent underline underline-offset-4 transition-colors hover:text-accent-hover"
          >
            browse
          </button>
        </div>
      )}

      {dragOver && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-2xl bg-accent-soft/85 text-[15px] font-medium text-text-primary"
        >
          Drop to read it
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".txt,.pdf,.docx,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          // Reset so re-picking the same file fires onChange again.
          e.target.value = "";
        }}
      />
    </div>
  );
}
