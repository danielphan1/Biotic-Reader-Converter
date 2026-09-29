// Disclaimer + privacy footer.
// LAND-03: this is the ONLY place in the app where "Bionic Reading®" may appear,
// and only to disclaim affiliation. The pre-release `grep -rio bionic app components`
// gate must match nothing outside this file.
// PRIV-02: visible statement that all work is local — backs the PRIV-01 architecture.
export function Disclaimer() {
  return (
    <footer className="border-t border-border-hairline bg-surface-secondary">
      <div className="mx-auto max-w-5xl px-6 py-14">
        <div className="grid gap-10 md:grid-cols-[minmax(0,10rem)_minmax(0,1fr)] md:gap-16">
          <p className="font-display text-[22px] leading-none tracking-[-0.02em] text-text-primary">
            biotic
          </p>

          <div className="grid max-w-[62ch] gap-6 text-[14px] leading-[1.65] text-text-secondary sm:grid-cols-2">
            <p>
              Your text never leaves your device. Everything — reading the text,
              converting it, and downloading — happens right here in your
              browser. Nothing is uploaded, stored, or sent to a server.
            </p>
            <p className="text-text-muted">
              <em>biotic</em> is an independent, open tool. It is{" "}
              <strong className="font-semibold text-text-secondary">
                not affiliated with, endorsed by, or connected to
              </strong>{" "}
              Bionic Reading® or its makers.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
