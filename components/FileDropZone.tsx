"use client";

import { useRef, useState } from "react";

// FileDropZone — the unified drop affordance (D-11). It sits INSIDE the existing
// paste card so the same region accepts both pasted text and a dropped file
// ("put your text here, however you have it"). It never replaces the textarea.
// A hidden <input type="file"> is triggered by a keyboard-focusable "browse"
// control (>=44px hit area); drag-over switches the dashed border to a solid
// 2px accent (the reserved token — no new colors). All styling consumes the
// inherited --color-* tokens; no hex literals.

export function FileDropZone({ onFile }: { onFile: (file: File) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (file) onFile(file);
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        handleFiles(e.dataTransfer.files);
      }}
      className={`flex flex-wrap items-center justify-center gap-1 rounded-lg border-2 border-dashed px-4 py-3 text-[14px] leading-[1.4] text-text-muted transition-colors ${
        dragOver ? "border-solid border-accent" : "border-border-hairline"
      }`}
    >
      <span>Drop a .txt or PDF here ·</span>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="min-h-[44px] rounded-md px-2 text-accent underline underline-offset-2 hover:text-accent-hover"
      >
        browse
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".txt,.pdf,text/plain,application/pdf"
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
