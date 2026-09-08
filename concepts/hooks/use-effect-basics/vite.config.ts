import { defineReactAppConfig } from "../../../tooling/vite-react.config";

// Fixed dev port — keep in sync with tooling/concept-manifest.ts (read by
// gallery/) and CLAUDE.md's port scheme.
export default defineReactAppConfig({ server: { port: 5312, strictPort: true } });
