// Disclaimer + privacy footer.
// LAND-03: this is the ONLY place in the app where "Bionic Reading®" may appear,
// and only to disclaim affiliation. The pre-release `grep -rio bionic app components`
// gate must match nothing outside this file.
// PRIV-02: visible statement that all work is local — backs the PRIV-01 architecture.
export function Disclaimer() {
  return (
    <footer className="flex flex-col gap-4 rounded-xl bg-surface-secondary p-6 text-[14px] leading-[1.4] text-text-muted">
      <p>
        Your text never leaves your device. Everything — reading the text,
        converting it, and downloading — happens right here in your browser.
        Nothing is uploaded, stored, or sent to a server.
      </p>
      <p>
        <em>biotic</em> is an independent, open tool. It is{" "}
        <strong>not affiliated with, endorsed by, or connected to</strong>{" "}
        Bionic Reading® or its makers.
      </p>
    </footer>
  );
}
