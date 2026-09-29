import type { Metadata } from "next";
import { Geist, Instrument_Serif } from "next/font/google";
import "./globals.css";

// Self-hosted at build time by next/font — no runtime request to Google, so
// PRIV-01 (nothing leaves the device) still holds at page load.
const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

// The display voice. A reading tool earns a reading face for its headlines.
const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-instrument-serif",
  display: "swap",
});

// LAND-03 / D-08: the trademarked term must NOT appear in title or meta.
export const metadata: Metadata = {
  title: "biotic — Read with less effort.",
  description:
    "biotic bolds the first part of each word to give your eyes a fixation point. Paste your text and read it with less effort — everything happens in your browser, nothing is uploaded.",
};

// Applies the stored theme before first paint so a pinned light theme never
// flashes the dark default. Runs from the document head; touches nothing else.
const THEME_BOOTSTRAP = `try{var t=localStorage.getItem("biotic-theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geist.variable} ${instrumentSerif.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
