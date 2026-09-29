import { bioticHtml } from "@/lib/biotic";
import { ArrowDownIcon, ShieldIcon } from "@/components/icons";

// Hero — the product argues for itself before it explains itself. The lead
// sentence runs through the SAME bioticHtml engine as the tool (D-02), and its
// fixation points fade in left to right on load: one authored moment, no
// decorative motion anywhere else on the page.

const LEAD =
  "Bolding the first part of each word gives your eyes an anchor to land on, so they move forward instead of backtracking.";

// Number the engine's own <b> tags so CSS can stagger them. Operates strictly on
// bioticHtml's output tags — user text is already escaped and is never touched.
function withStagger(html: string): string {
  let i = 0;
  return html.replace(/<b>/g, () => `<b style="--i:${i++}">`);
}

export function Hero() {
  const lead = withStagger(bioticHtml(LEAD));

  return (
    <section className="relative isolate overflow-hidden border-b border-border-hairline">
      <div
        aria-hidden="true"
        className="hero-glow pointer-events-none absolute inset-x-0 -top-40 h-[560px]"
      />

      <div className="mx-auto max-w-5xl px-6 pt-20 pb-16 sm:pt-28 sm:pb-24">
        <h1 className="max-w-[16ch] font-display text-[clamp(3rem,9vw,5rem)] leading-[0.95] tracking-[-0.03em] text-text-primary text-balance">
          Read with less effort.
        </h1>

        <p
          className="fixation-sweep mt-7 max-w-[52ch] text-[clamp(1.125rem,2.2vw,1.375rem)] leading-[1.55] text-text-secondary"
          // SAFE: bioticHtml escapes every user character; only its own <b> is raw,
          // and withStagger only adds an index to those same tags.
          dangerouslySetInnerHTML={{ __html: lead }}
        />

        <div className="mt-10 flex flex-wrap items-center gap-x-4 gap-y-5">
          <a
            href="#tool"
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-accent px-6 text-[15px] font-medium text-accent-contrast shadow-accent transition-colors hover:bg-accent-hover"
          >
            Convert your text
            <ArrowDownIcon className="size-4" />
          </a>
          <a
            href="#demo"
            className="inline-flex min-h-11 items-center rounded-full border border-border-strong px-6 text-[15px] font-medium text-text-primary transition-colors hover:bg-surface-secondary"
          >
            See the effect
          </a>
        </div>

        <p className="mt-8 inline-flex items-center gap-2 text-[14px] text-text-muted">
          <ShieldIcon className="size-4 shrink-0" />
          Runs entirely in your browser. Nothing is uploaded.
        </p>
      </div>
    </section>
  );
}
