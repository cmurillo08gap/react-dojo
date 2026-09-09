import { defineReactAppConfig } from "../tooling/vite-react.config";

// Fixed dev port so it doesn't collide with any concept/challenge/gallery
// port (those live in the 5300+ blocks — see tooling/concept-manifest.ts).
// This package isn't part of that manifest: it's a standalone sandbox, not
// a concept, so nothing else needs to link to it.
export default defineReactAppConfig({ server: { port: 5200, strictPort: true } });
