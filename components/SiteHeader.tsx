import { ThemeToggle } from "@/components/ThemeToggle";

// A thin sticky bar so the wordmark and the theme control stay reachable down a
// long single page. The backdrop blur is functional here — content genuinely
// scrolls beneath it — not applied as surface decoration.
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border-hairline bg-canvas/72 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
        <a
          href="#top"
          className="font-display text-[22px] leading-none tracking-[-0.02em] text-text-primary"
        >
          biotic
        </a>
        <ThemeToggle />
      </div>
    </header>
  );
}
