// Explainer — honest, plain-language explanation of biotic reading (LAND-01).
// Static (server component). Efficacy framing is deliberately honest per D-08:
// "some readers find it helps … evidence is mixed" — no efficacy-as-fact claims,
// no medical-condition names.
//
// Laid out as editorial text, not a card: a short heading in the margin on wide
// screens, the argument at reading size beside it.
export function Explainer() {
  return (
    <section
      aria-labelledby="explainer-heading"
      className="mx-auto max-w-5xl px-6 py-20 sm:py-24"
    >
      <div className="grid gap-8 md:grid-cols-[minmax(0,14rem)_minmax(0,1fr)] md:gap-16">
        <h2
          id="explainer-heading"
          className="font-display text-[clamp(1.75rem,3.5vw,2.25rem)] leading-[1.1] tracking-[-0.02em] text-text-primary md:pt-1"
        >
          What is biotic reading?
        </h2>

        <div className="max-w-[56ch]">
          <p className="text-[1.25rem] leading-[1.6] text-text-primary">
            Biotic reading bolds the first part of each word, giving your eyes a
            fixation point so they can move through text faster and stay on
            track.
          </p>
          <p className="mt-6 border-t border-border-hairline pt-6 text-[1rem] leading-[1.65] text-text-secondary">
            <strong className="font-semibold text-text-primary">
              Some readers find it helps them focus; the evidence is mixed
            </strong>{" "}
            — so try it on your own text and see if it works for you.
          </p>
        </div>
      </div>
    </section>
  );
}
