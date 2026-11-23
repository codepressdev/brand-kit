import {
  GENERIC_FONT,
  PALETTE_KEYS,
  safePath,
  type Identity,
} from "./identity.js";

export type CssVars = Record<`--${string}`, string>;

export interface CssVarOptions {
  /** Base the pattern tile path resolves against. Default `/`. */
  base?: string;
  /** Pattern tile size at scale 1, in px. Default 48. */
  patternSize?: number;
}

/**
 * Quotes each family name and keeps generic keywords bare; a single family
 * gets a fallback: `Fraunces` → `"Fraunces", system-ui, sans-serif`.
 */
function fontStack(family: string): string {
  const names = family.split(",").map((n) => n.trim());
  const css = names.map((n) => (GENERIC_FONT.test(n) ? n : `"${n}"`));
  if (names.length === 1 && !GENERIC_FONT.test(names[0] ?? ""))
    css.push("system-ui", "sans-serif");
  return css.join(", ");
}

const ICON_CORNER = {
  round: ["round", "round"],
  square: ["square", "miter"],
  chamfer: ["butt", "bevel"],
} as const;
const ICON_FILL = {
  none: ["none", "0"],
  duotone: ["currentColor", "0.2"],
  solid: ["currentColor", "1"],
} as const;

/** Joins a base and a relative tile path: `/` + `brand/p.svg` → `/brand/p.svg`. */
export function resolveTile(tile: string, base = "/"): string {
  if (tile.startsWith("/")) return tile;
  const b = safePath(base) ?? "/";
  return (b.endsWith("/") ? b : `${b}/`) + tile;
}

/**
 * The identity as CSS custom properties, all prefixed `--brand-`. Only fields
 * the identity sets produce a variable, so an undefined or empty identity
 * gives `{}` and the site keeps its current look. Works as a React `style`.
 */
export function identityToCssVars(
  identity: Identity | undefined | null,
  options: CssVarOptions = {},
): CssVars {
  const vars: CssVars = {};
  if (!identity) return vars;
  for (const k of PALETTE_KEYS) {
    const c = identity.palette?.[k];
    if (c) vars[`--brand-${k}`] = c;
  }
  if (identity.type?.display)
    vars["--brand-font-display"] = fontStack(identity.type.display);
  if (identity.type?.body)
    vars["--brand-font-body"] = fontStack(identity.type.body);

  const icon = identity.icon;
  if (icon?.stroke !== undefined)
    vars["--brand-icon-stroke"] = String(icon.stroke);
  if (icon?.corner) {
    const [cap, join] = ICON_CORNER[icon.corner];
    vars["--brand-icon-linecap"] = cap;
    vars["--brand-icon-linejoin"] = join;
  }
  if (icon?.fill) {
    const [fill, opacity] = ICON_FILL[icon.fill];
    vars["--brand-icon-fill"] = fill;
    vars["--brand-icon-fill-opacity"] = opacity;
  }

  const p = identity.pattern;
  if (p?.tile)
    vars["--brand-pattern-tile"] =
      `url("${resolveTile(p.tile, options.base)}")`;
  if (p?.scale !== undefined) {
    vars["--brand-pattern-scale"] = String(p.scale);
    vars["--brand-pattern-size"] =
      `${round((options.patternSize ?? 48) * p.scale)}px`;
  }
  if (p?.opacity !== undefined)
    vars["--brand-pattern-opacity"] = String(p.opacity);
  return vars;
}

const round = (n: number) => Math.round(n * 100) / 100;

/** Declarations block text: `{ --brand-ink: …; }`. `<` never reaches a `<style>`. */
function declarations(vars: CssVars): string {
  return Object.entries(vars)
    .map(([k, v]) => `${k}:${v.replace(/</g, "\\3c ")};`)
    .join("");
}

/**
 * Motion rules for `useReveal()`: elements are visible unless the hook has
 * marked them pending, and reduced motion shows them at once.
 */
export const revealCss =
  "[data-reveal]{transition:opacity .6s ease,transform .6s cubic-bezier(.22,1,.36,1)}" +
  "[data-reveal-pending]{opacity:0;transform:translateY(16px)}" +
  "@media (prefers-reduced-motion:reduce){[data-reveal]{transition:none}[data-reveal-pending]{opacity:1;transform:none}}";

/** The identity as a stylesheet string, for SSR or plain HTML. Empty when nothing is set. */
export function identityToCss(
  identity: Identity | undefined | null,
  selector = ":root",
  options?: CssVarOptions,
): string {
  const body = declarations(identityToCssVars(identity, options));
  return body ? `${selector.replace(/</g, "")}{${body}}` : "";
}

export interface BrandStyleProps extends CssVarOptions {
  identity: Identity | undefined | null;
  /** Where the variables apply. Default `:root`. */
  selector?: string;
  /** Include the `useReveal()` motion rules. Default true. */
  reveal?: boolean;
  nonce?: string;
}

/**
 * Renders a `<style>` with the identity's CSS variables (and the reveal
 * rules). An undefined identity renders the reveal rules only, and no
 * variables; with `reveal={false}` it renders nothing.
 */
export function BrandStyle({
  identity,
  selector,
  reveal = true,
  nonce,
  ...options
}: BrandStyleProps) {
  const css =
    identityToCss(identity, selector, options) + (reveal ? revealCss : "");
  if (!css) return null;
  return (
    <style
      nonce={nonce}
      data-brand-kit=""
      dangerouslySetInnerHTML={{ __html: css }}
    />
  );
}
