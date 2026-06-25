// Explainer — honest, plain-language explanation of biotic reading (LAND-01).
// Static (server component). Efficacy framing is deliberately honest per D-08:
// "some readers find it helps … evidence is mixed" — no efficacy-as-fact claims,
// no medical-condition names.
export function Explainer() {
  return (
    <section aria-labelledby="explainer-heading" className="flex flex-col gap-2">
      <h2
        id="explainer-heading"
        className="text-[20px] font-semibold leading-[1.3] text-text-primary"
      >
        What is biotic reading?
      </h2>
      <p className="max-w-[70ch] text-[16px] leading-[1.5] text-text-primary">
        Biotic reading bolds the first part of each word, giving your eyes a
        fixation point so they can move through text faster and stay on track.{" "}
        <strong>Some readers find it helps them focus; the evidence is mixed</strong>{" "}
        — so try it on your own text and see if it works for you.
      </p>
    </section>
  );
}
