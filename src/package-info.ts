import { createRequire } from "node:module";

/**
 * Package metadata read from package.json.
 *
 * This module lives at the top of `src/` on purpose: `../package.json`
 * resolves to the package root both from `src/` (tsx, vitest) and from the
 * bundled `dist/index.js`. Requiring it from a nested directory breaks once
 * tsup bundles everything into a single file.
 */
const require = createRequire(import.meta.url);

export const packageJson = require("../package.json") as {
  version: string;
  name: string;
  description: string;
};
