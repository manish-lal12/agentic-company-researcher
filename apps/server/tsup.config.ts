import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  outDir: "dist",
  clean: true,
  sourcemap: true,
  noExternal: [/@agentic-company-researcher\/.*/],
  treeshake: true,
  minify: false,
  splitting: false,
});
