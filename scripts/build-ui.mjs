import { build } from "esbuild";

await build({
  entryPoints: ["client/main.tsx"],
  outdir: "public/assets",
  bundle: true,
  format: "iife",
  target: ["es2020"],
  jsx: "automatic",
  minify: false,
  sourcemap: false,
  entryNames: "app",
  loader: {
    ".css": "css",
  },
});
