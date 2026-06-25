import type { NextConfig } from "next";

// PRIV-01: static export — no server runtime, nothing leaves the device.
// Every transform/export operation runs in the browser (CONTEXT D-07).
const nextConfig: NextConfig = {
  output: "export",
  // Static export cannot use the on-demand Image Optimization server.
  images: { unoptimized: true },
};

export default nextConfig;
