import { SiteHeader } from "@/components/SiteHeader";
import { Hero } from "@/components/Hero";
import { Explainer } from "@/components/Explainer";
import { DemoToggle } from "@/components/DemoToggle";
import { PasteTool } from "@/components/PasteTool";
import { Disclaimer } from "@/components/Disclaimer";

// Single scrolling page (D-01 — no routing), now composed as three distinct
// registers rather than four identical cards: a full-bleed hero that argues,
// an editorial explainer that reads, and an elevated work surface that does.
export default function Home() {
  return (
    <>
      <SiteHeader />
      <main id="top">
        <Hero />
        <Explainer />
        <DemoToggle />
        <PasteTool />
      </main>
      <Disclaimer />
    </>
  );
}
