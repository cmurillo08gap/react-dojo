import { defineConfig } from "vite";
import { GALLERY_PORT } from "../tooling/concept-manifest";

// Deliberately not the shared tooling/vite-react.config.ts factory — this
// package has no JSX/React (see src/main.ts), so pulling in
// @vitejs/plugin-react here just adds dependency-resolution noise for a
// plugin nothing uses.
export default defineConfig({
  server: {
    port: GALLERY_PORT,
    strictPort: true,
  },
});
