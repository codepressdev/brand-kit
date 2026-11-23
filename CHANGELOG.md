# @codepress/brand-kit

## 0.1.0

### Minor Changes

- a6ab578: First release of `@codepress/brand-kit`: brand mechanics for React sites. `parseIdentity()` reads the brand-design identity tolerantly (explicit `colors` win over the palette), `identityToCssVars()` and `<BrandStyle>` turn it into `--brand-*` CSS variables, and `<Grain>`, `<MotifPattern>`, `<Frame>`, `<Depth>`, `makeIcon()`/`<BrandIcon>`, `useReveal()`, `hoverFine()` and `<BrandFonts>` supply texture, icons, motion and fonts without layout shift. React is the only peer dependency; the whole kit is under 6 KB gzipped.
