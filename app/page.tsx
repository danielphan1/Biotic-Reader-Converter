import { Explainer } from "@/components/Explainer";
import { DemoToggle } from "@/components/DemoToggle";
import { PasteTool } from "@/components/PasteTool";
import { Disclaimer } from "@/components/Disclaimer";

// Single scrolling page (D-01 — no routing). Composed top-to-bottom per the
// UI-SPEC interaction contract: title → explainer → live demo → paste tool
// (with the reader rendering below it) → disclaimer/privacy footer.
// Plan 01-03 inserts Copy/Download export controls below the reader.
export default function Home() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-12 px-6 py-16">
      <header className="flex flex-col gap-1">
        <h1 className="text-[28px] font-semibold leading-[1.2] text-text-primary">
          biotic
        </h1>
        <p className="text-[14px] leading-[1.4] text-text-muted">
          Read with less effort.
        </p>
      </header>

      <Explainer />
      <DemoToggle />
      <PasteTool />
      <Disclaimer />
    </main>
  );
}
