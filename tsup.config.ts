import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "node22",
  outDir: "dist",
  clean: true,
  dts: true,
  sourcemap: true,
  splitting: false,
  shims: false,
  // Keep `node:` specifiers intact: `node:sqlite` has no un-prefixed alias, so
  // stripping the prefix produces `import "sqlite"`, which fails at startup.
  removeNodeProtocol: false,
});
