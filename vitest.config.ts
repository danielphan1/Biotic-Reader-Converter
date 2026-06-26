import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

// Resolve the "@/..." path alias (matches tsconfig `paths`) so component tests
// can import "@/lib/..." / "@/components/..." the same way the app does.
const root = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": root,
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
  },
});
