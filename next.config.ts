import type { NextConfig } from "next";

// PRIV-01: static export — no server runtime, nothing leaves the device.
// Every transform/export operation runs in the browser (CONTEXT D-07).
//
// PAGES_BASE_PATH is set to "/Biotic-Reader-Converter" in CI (GitHub Actions)
// so asset paths resolve correctly under the repo-name subpath on GitHub Pages.
// Empty string locally keeps dev/preview behaviour unchanged.
const base = process.env.PAGES_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  basePath: base,
  assetPrefix: base,
  // Static export cannot use the on-demand Image Optimization server.
  images: { unoptimized: true },
};

export default nextConfig;
