import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// Separate from vite.config.js: Vitest reads its own config file instead of
// vite.config.js once one exists, and tooling/vite-react.config.ts's factory
// has no `test` option to extend — so the test runner gets its own minimal
// config here rather than hand-rolling a second dev-server config.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/setupTests.js"],
  },
});
