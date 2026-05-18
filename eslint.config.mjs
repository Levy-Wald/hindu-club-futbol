import { defineConfig, globalIgnores } from "eslint/config";
import { createRequire } from "module";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const require = createRequire(import.meta.url);

const clubcorePlugin = {
  rules: {
    "no-cross-module-imports": require("./eslint-rules/no-cross-module-imports.js"),
    "no-module-importing-from-app": require("./eslint-rules/no-module-importing-from-app.js"),
    "troncal-cannot-import-modules": require("./eslint-rules/troncal-cannot-import-modules.js"),
  },
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "scripts/**",
  ]),
  {
    plugins: { clubcore: clubcorePlugin },
    rules: {
      "clubcore/no-cross-module-imports": "warn",
      "clubcore/no-module-importing-from-app": "error",
      "clubcore/troncal-cannot-import-modules": "error",
      // Downgraded to warn — preexisting across codebase, fix incrementally
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-require-imports": "warn",
      "react/no-unescaped-entities": "warn",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/static-components": "warn",
    },
  },
]);

export default eslintConfig;
