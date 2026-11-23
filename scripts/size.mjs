#!/usr/bin/env node
/**
 * Measures what @codepress/brand-kit adds to a consumer: bundles dist/ as a
 * site would (every export used, React external, minified) and gzips it.
 * Fails when the full kit is over the budget (6 KB gzipped). Run `build` first.
 */
import { gzipSync } from "node:zlib";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const BUDGET = 6 * 1024;
const root = fileURLToPath(new URL("..", import.meta.url));

async function measure(contents) {
  const out = await build({
    absWorkingDir: root,
    stdin: { contents, resolveDir: root, loader: "js" },
    bundle: true,
    minify: true,
    format: "esm",
    target: "es2020",
    write: false,
    external: ["react", "react/jsx-runtime", "react-dom"],
    logLevel: "error",
  });
  const code = out.outputFiles[0].contents;
  return { raw: code.length, gzip: gzipSync(code, { level: 9 }).length };
}

const full = await measure(
  `import * as kit from "./dist/index.js"; console.log(kit);`,
);
const theming = await measure(
  `import { parseIdentity, BrandStyle } from "./dist/index.js"; console.log(parseIdentity, BrandStyle);`,
);
const kb = (n) => `${(n / 1024).toFixed(2)} KB`;
console.log(
  `full kit:        ${kb(full.raw)} minified, ${kb(full.gzip)} gzipped (budget ${kb(BUDGET)})`,
);
console.log(
  `theming only:    ${kb(theming.raw)} minified, ${kb(theming.gzip)} gzipped`,
);
if (full.gzip > BUDGET) {
  console.error(
    `The full kit is ${kb(full.gzip)} gzipped, over the ${kb(BUDGET)} budget.`,
  );
  process.exit(1);
}
