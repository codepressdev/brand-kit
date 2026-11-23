# @codepress/brand-kit

> **This repository is a mirror.** `@codepress/brand-kit` is developed in
> CodePress's monorepo and synced here, one commit per upstream change. Issues and pull
> requests are welcome: a maintainer lands an accepted pull request upstream,
> and the next sync brings it here. See [CONTRIBUTING.md](./CONTRIBUTING.md).

Brand mechanics for React sites. It turns a firm's `identity` (the JSON the CodePress `brand-design` skill generates) into CSS variables, grain, the firm's own motif pattern, frames, depth, parametric icons and scroll reveals that respect reduced motion.

It holds mechanics only, with no built-in look or palette: everything you see comes from the identity.

- React 18 or 19 as a peer dependency, no other runtime dependencies.
- ESM, `sideEffects: false`, one module per primitive, so a bundler keeps only what you import.
- The whole kit adds under 6 KB gzipped (`pnpm run size` measures it).

```sh
npm install @codepress/brand-kit
```

## Example

<!-- prettier-ignore -->
```tsx
import brand from "../brand.json"; // { "identity": { ... }, "colors": { ... } }
import {
  parseIdentity, BrandStyle, BrandFonts, Grain, MotifPattern, Frame, makeIcon, useReveal,
} from "@codepress/brand-kit";

const identity = parseIdentity(brand, { colors: brand.colors }); // never throws
const Van = makeIcon(["M2 7h12v9H2z", "M14 10h4l3 3v3h-7"], { name: "Van" });

export function Home() {
  const reveal = useReveal<HTMLElement>();
  return (
    <>
      <BrandStyle identity={identity} />
      <BrandFonts identity={identity} />
      <header style={{ position: "relative", isolation: "isolate", overflow: "clip" }}>
        <MotifPattern /> <Grain />
        <h1 style={{ fontFamily: "var(--brand-font-display)" }}>Same-day delivery</h1>
      </header>
      <section ref={reveal}><Frame><Van label="Delivery van" /> Routes</Frame></section>
    </>
  );
}
```

## API

### Identity

- `parseIdentity(raw, { colors })` reads an identity from untrusted JSON: the identity object, a `{ identity }` wrapper such as a whole `brand.json`, or JSON text. Fields of the wrong type, out of range, or unknown are dropped, and it never throws; unusable input gives `{}`. Colours are kept when they are hex, a colour function (`oklch()`, `rgb()`, `hsl()`, `color-mix()`, …), `transparent`, `currentColor`, `black` or `white`; other named colours are dropped, so the server and the browser read the same identity. Font stacks are normalised to unquoted names and quoted again when they become CSS. `colors` are a site's older colour settings: their `ink`, `surface`, `primary`, `accent` and `signal` win over `identity.palette`, key by key.
- `identity.schema.json` (exported as `@codepress/brand-kit/identity.schema.json`) is the JSON Schema for the identity object.

### Theming

`identityToCssVars(identity, { base, patternSize })` returns only the variables the identity sets; an undefined or empty identity sets none, so the site keeps its look. The result works as a React `style`. `identityToCss(identity, selector)` gives the same as stylesheet text, and `<BrandStyle identity selector reveal nonce>` renders it in a `<style>` along with the `useReveal()` rules (`revealCss`).

| Variable                                                                            | From                                                          |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `--brand-ink` `--brand-surface` `--brand-primary` `--brand-accent` `--brand-signal` | `palette`                                                     |
| `--brand-font-display` `--brand-font-body`                                          | `type` (a single family gets a fallback stack)                |
| `--brand-icon-stroke`                                                               | `icon.stroke`                                                 |
| `--brand-icon-linecap` `--brand-icon-linejoin`                                      | `icon.corner`: round, square/miter, butt/bevel for chamfer    |
| `--brand-icon-fill` `--brand-icon-fill-opacity`                                     | `icon.fill`: none, duotone (0.2), solid                       |
| `--brand-pattern-tile`                                                              | `pattern.tile`, as `url("<base><tile>")`, base `/` by default |
| `--brand-pattern-scale` `--brand-pattern-size`                                      | `pattern.scale` (size is 48px × scale)                        |
| `--brand-pattern-opacity`                                                           | `pattern.opacity`                                             |

### Primitives

Decorative layers (`Grain`, `MotifPattern`, unlabelled icons) are `aria-hidden` and ignore the pointer. Layers fill the nearest positioned ancestor; give it `position: relative; isolation: isolate; overflow: clip` so a layer never widens the page.

- `<Grain opacity frequency blend>`: film grain from an SVG `feTurbulence` tile inlined as a data URI.
- `<MotifPattern tile base scale opacity>`: the firm's own tile, repeated. Without props it reads `--brand-pattern-tile`, `--brand-pattern-size` and `--brand-pattern-opacity`.
- `<Frame variant="offset | layered | soft" as>`: a border and shadow frame in the brand ink.
- `<Depth level={1 | 2 | 3} as>`: layered soft shadows tinted by the brand ink.
- `makeIcon(paths, { name, size })` and `<BrandIcon d size label>`: one icon base for the firm's paths in a 24×24 grid. Stroke, corners and fill come from the icon variables. With `label` the icon is an image with that name; without it, it is decorative.

### Motion and input

- `useReveal({ rootMargin })` returns a ref. The element is opaque on first paint; after mount, only an element below the fold is hidden (`data-reveal-pending`) until it scrolls in. Under reduced motion, or without IntersectionObserver, nothing is hidden or animated.
- `hoverFine(css)` wraps rules in `@media (hover: hover) and (pointer: fine)` so touch never sticks in a hover state; `HOVER_FINE` is the query, `useHoverFine()` its live value. `useReducedMotion()` and `prefersReducedMotion()` read the motion preference.

### Fonts

`<BrandFonts identity weights href>` preconnects and loads a Google Fonts stylesheet for the identity's families with `display=optional`: the brand font is used only when it arrives before first render, so text never reflows. `fontsHref(identity, { weights })` builds the URL, and `loadFonts(url)` adds it to `<head>` once outside React.

## License

MIT
