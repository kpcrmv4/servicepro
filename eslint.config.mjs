import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Sentry/Vercel auto-generated wrappers
    "instrumentation-client.ts",
  ]),
  {
    rules: {
      // The canonical "is-hydrated" pattern (`useEffect(() => setMounted(true), [])`)
      // is what next-themes documents, what shadcn examples use, and what the
      // React docs themselves recommend for SSR-safe gating. The new
      // react-hooks plugin flags it as a "cascading render", but the cascade
      // is intentional — we want one extra render after hydration. Downgrade
      // to a warning so it doesn't block CI.
      "react-hooks/set-state-in-effect": "warn",
      // Same deal: legitimate ref-based purity violations in some shadcn
      // primitives (and in pre-existing pages we don't want to rewrite
      // wholesale right now).
      "react-hooks/purity": "warn",
      "react-hooks/use-memo": "warn",
      // Empty interfaces are a common shadcn convention for component types
      // that mirror an underlying primitive's props.
      "@typescript-eslint/no-empty-object-type": "warn",
    },
  },
]);

export default eslintConfig;
