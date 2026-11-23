# Contributing to @codepress/brand-kit

Thanks for helping. Issues and pull requests are welcome here.

## How changes land

`@codepress/brand-kit` is developed in CodePress's monorepo, and this
repository is a one-way mirror of it. Every change made upstream arrives here
as a commit of its own, with the upstream commit's subject and a
`Source-Commit:` trailer. Each version is tagged `v<version>` and has a GitHub
Release with its changelog. Nothing is merged on this repository directly, so
a sync never overwrites your work:

1. Open a pull request here as usual. CI runs the unit tests and the build on
   Node 20 and 22.
2. A maintainer reviews it here. Once it is accepted, they port the change
   into the monorepo with you credited as co-author there.
3. The next sync brings the change here. The maintainer then closes your pull
   request with a link to the mirror commit that carries your change.

Bug reports and feature requests go in issues.

## Developing

```bash
npm install
npm test               # unit tests (Vitest, happy-dom)
npm run build          # dist/: ESM modules and .d.ts files
npm run typecheck
npm run size           # the whole kit must stay under 6 KB gzipped
npm run lint
npm run format:check
```

Use npm 11 or later (`npm install -g npm@11`): the npm 10 that ships with
Node 22 fails `npm install` here with "Cannot read properties of null
(reading 'edgesOut')". CI does the same on Node 20 and 22.

pnpm works too (`pnpm install`, `pnpm test`); `pnpm-workspace.yaml` allows
esbuild's install script.

React 18 or 19 is the only peer dependency; the kit has no other runtime
dependencies.

## License

By contributing you agree that your contribution is licensed under the MIT
License in [LICENSE](./LICENSE).
