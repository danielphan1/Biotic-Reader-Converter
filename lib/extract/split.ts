// THE single source of truth for paragraph splitting. Paste (02-03 rewires
// PasteTool to this), TXT, and PDF all reflow text through this one function so
// every input produces identical clean paragraphs. Semantics are byte-for-byte
// the original PasteTool `toDoc` body: split on blank lines, trim, drop empties.
export function splitParagraphs(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}
