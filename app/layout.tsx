import type { Metadata } from "next";
import "./globals.css";

// LAND-03 / D-08: the trademarked term must NOT appear in title or meta.
export const metadata: Metadata = {
  title: "biotic — Read with less effort.",
  description:
    "biotic bolds the first part of each word to give your eyes a fixation point. Paste your text and read it with less effort — everything happens in your browser, nothing is uploaded.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
