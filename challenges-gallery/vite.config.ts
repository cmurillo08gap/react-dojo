import { defineReactAppConfig } from "../tooling/vite-react.config";

// Fixed dev port, deliberately outside the 5300+ concept-manifest blocks
// (see tooling/concept-manifest.ts) — this package isn't a concept and
// nothing in that manifest links to it. Sits between playground (5200)
// and the concepts gallery (5300).
export default defineReactAppConfig({ server: { port: 5250, strictPort: true } });
