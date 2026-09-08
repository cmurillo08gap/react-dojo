// Shared Vite config factory for every `concepts/*/*` package.
// Keeps each package's own vite.config.ts to a couple of lines:
//
//   import { defineReactAppConfig } from "../../../tooling/vite-react.config";
//   export default defineReactAppConfig();
//
import { defineConfig, type UserConfig, mergeConfig } from "vite";
import react from "@vitejs/plugin-react";

export function defineReactAppConfig(overrides: UserConfig = {}) {
  return mergeConfig(
    defineConfig({
      plugins: [react()],
      server: {
        port: 5173,
        strictPort: false,
      },
    }),
    overrides,
  );
}
