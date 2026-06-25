import { PasteTool } from "@/components/PasteTool";

// Single scrolling page (D-01 — no routing). This is the skeleton later plans
// extend in place: Plan 01-02 inserts the explainer + Before/After demo ABOVE the
// PasteTool, Plan 01-03 inserts Copy/Download export controls below the reader.
export default function Home() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-16">
      <header className="flex flex-col gap-1">
        <h1 className="text-[28px] font-semibold leading-[1.2] text-text-primary">
          biotic
        </h1>
        <p className="text-[14px] leading-[1.4] text-text-muted">
          Read with less effort.
        </p>
      </header>

      <PasteTool />
    </main>
  );
}
