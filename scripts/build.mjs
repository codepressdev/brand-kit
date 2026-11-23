#!/usr/bin/env node
/**
 * Builds dist/: ESM modules (one per source file, so bundlers can drop what a
 * site does not import) and their .d.ts files. React stays an import, never
 * bundled.
 */
import { execFileSync } from "node:child_process";
import { readdirSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const root = fileURLToPath(new URL("..", import.meta.url));
const require = createRequire(import.meta.url);
rmSync(`${root}/dist`, { recursive: true, force: true });

await build({
  absWorkingDir: root,
  entryPoints: readdirSync(`${root}/src`)
    .filter((f) => /\.tsx?$/.test(f) && !f.includes(".test."))
    .map((f) => `src/${f}`),
  outdir: "dist",
  format: "esm",
  target: "es2020",
  jsx: "automatic",
  bundle: false,
  logLevel: "warning",
});

execFileSync(
  process.execPath,
  [
    require.resolve("typescript/bin/tsc"),
    "-p",
    "tsconfig.json",
    "--emitDeclarationOnly",
  ],
  { cwd: root, stdio: "inherit" },
);

// Tests share the source tsconfig so they typecheck; their declarations are not shipped.
for (const f of readdirSync(`${root}/dist`))
  if (f.includes(".test.")) rmSync(`${root}/dist/${f}`);
