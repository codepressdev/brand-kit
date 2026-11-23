/**
 * The `identity` schema from the brand-design skill (section 4), and a
 * tolerant parser for it. Every field is optional: a missing block keeps the
 * site's current look.
 */

export type PaletteKey = "ink" | "surface" | "primary" | "accent" | "signal";
export type IconCorner = "round" | "square" | "chamfer";
export type IconFill = "none" | "duotone" | "solid";
export type TextureLayer =
  | "grain"
  | "pattern"
  | "frames"
  | "linework"
  | "blur-fields"
  | "depth";

/** CSS colours, `oklch()` preferred. */
export type BrandPalette = Partial<Record<PaletteKey, string>>;

export interface BrandType {
  /** Font family for display type, e.g. `"Fraunces"`. */
  display?: string;
  /** Font family for body text. */
  body?: string;
}

export interface BrandIconStyle {
  /** Stroke width in a 24px icon grid. */
  stroke?: number;
  corner?: IconCorner;
  fill?: IconFill;
}

export interface BrandPattern {
  /** The firm's own tile, relative to the site's base, e.g. `brand/pattern.svg`. */
  tile?: string;
  /** Multiplies the 48px base tile size. */
  scale?: number;
  /** 0 to 1. */
  opacity?: number;
}

export interface Identity {
  direction?: string;
  motif?: string;
  palette?: BrandPalette;
  type?: BrandType;
  icon?: BrandIconStyle;
  pattern?: BrandPattern;
  texture?: TextureLayer[];
  signature_interaction?: string;
  fingerprint?: string;
}

export interface ParseIdentityOptions {
  /**
   * Older `colors` settings for the site. They win over `identity.palette`
   * key by key; keys other than the five palette names are ignored.
   */
  colors?: unknown;
}

export const PALETTE_KEYS: readonly PaletteKey[] = [
  "ink",
  "surface",
  "primary",
  "accent",
  "signal",
];
const CORNERS: readonly IconCorner[] = ["round", "square", "chamfer"];
const FILLS: readonly IconFill[] = ["none", "duotone", "solid"];
const TEXTURES: readonly TextureLayer[] = [
  "grain",
  "pattern",
  "frames",
  "linework",
  "blur-fields",
  "depth",
];

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj =>
  typeof v === "object" && v !== null && !Array.isArray(v);

function text(v: unknown, max = 2000): string | undefined {
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  return t && t.length <= max ? t : undefined;
}

const HEX = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const KEYWORD = /^(?:transparent|currentcolor|black|white)$/i;
const FN =
  /^(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color|color-mix)\((?:[a-z0-9#.,%\s/+-]|\([a-z0-9#.,%\s/+-]*\))*\)$/i;

/**
 * A CSS colour in a form that reads the same on the server and in the
 * browser: hex, a colour function (`oklch()`, `rgb()`, `color-mix()`, …),
 * `transparent`, `currentColor`, `black` or `white`. Other named colours are
 * dropped. Nothing that could close a declaration or a `<style>` passes.
 */
export function cssColor(v: unknown): string | undefined {
  const t = text(v, 160);
  return t && (HEX.test(t) || KEYWORD.test(t) || FN.test(t)) ? t : undefined;
}

export const GENERIC_FONT =
  /^(?:serif|sans-serif|monospace|cursive|fantasy|math|emoji|system-ui|ui-(?:serif|sans-serif|monospace|rounded))$/;

/**
 * A font family or comma-separated stack, normalised to unquoted names
 * (`'Source Serif 4', serif` → `Source Serif 4, serif`); quoting happens
 * when it becomes CSS. Names hold letters, digits, spaces, dots and hyphens.
 */
function fontFamily(v: unknown): string | undefined {
  const t = text(v, 200);
  if (!t) return undefined;
  const names = t.split(",").map((n) =>
    n
      .trim()
      .replace(/^(["'])(.*)\1$/, "$2")
      .trim(),
  );
  return names.every((n) => /^[a-z0-9][a-z0-9 .-]*$/i.test(n))
    ? names.join(", ")
    : undefined;
}

function num(v: unknown, min: number, max: number): number | undefined {
  return typeof v === "number" && Number.isFinite(v) && v >= min && v <= max
    ? v
    : undefined;
}

function oneOf<T extends string>(
  v: unknown,
  list: readonly T[],
): T | undefined {
  return list.includes(v as T) ? (v as T) : undefined;
}

/** A relative path or root-relative path: no scheme, no `..`, no quotes. */
export function safePath(v: unknown): string | undefined {
  const t = text(v, 300);
  return t && /^[\w\-./@~]+$/.test(t) && !t.includes("..") && !t.includes("//")
    ? t
    : undefined;
}

/** Drops undefined fields; returns undefined when nothing is left. */
function compact<T extends object>(o: T): T | undefined {
  const out: Obj = {};
  for (const [k, v] of Object.entries(o)) if (v !== undefined) out[k] = v;
  return Object.keys(out).length ? (out as T) : undefined;
}

function palette(v: unknown): BrandPalette | undefined {
  if (!isObj(v)) return undefined;
  const out: BrandPalette = {};
  for (const k of PALETTE_KEYS) out[k] = cssColor(v[k]);
  return compact(out);
}

/**
 * Reads an identity from untrusted JSON. Accepts the identity object or a
 * `{ identity }` wrapper (such as a whole `brand.json`). Fields of the wrong
 * type or out of range are dropped, unknown fields are dropped, and it never
 * throws: anything unusable gives `{}`, which sets nothing.
 */
export function parseIdentity(
  raw: unknown,
  options: ParseIdentityOptions = {},
): Identity {
  let src: unknown = raw;
  if (typeof src === "string") {
    try {
      src = JSON.parse(src);
    } catch {
      src = undefined;
    }
  }
  if (isObj(src) && isObj(src.identity)) src = src.identity;
  const o: Obj = isObj(src) ? src : {};

  const type = isObj(o.type)
    ? compact<BrandType>({
        display: fontFamily(o.type.display),
        body: fontFamily(o.type.body),
      })
    : undefined;
  const icon = isObj(o.icon)
    ? compact<BrandIconStyle>({
        stroke: num(o.icon.stroke, 0.25, 8),
        corner: oneOf(o.icon.corner, CORNERS),
        fill: oneOf(o.icon.fill, FILLS),
      })
    : undefined;
  const pattern = isObj(o.pattern)
    ? compact<BrandPattern>({
        tile: safePath(o.pattern.tile),
        scale: num(o.pattern.scale, 0.05, 20),
        opacity: num(o.pattern.opacity, 0, 1),
      })
    : undefined;
  const texture = Array.isArray(o.texture)
    ? [...new Set(o.texture.filter((t) => oneOf(t, TEXTURES)))]
    : undefined;

  const merged = { ...palette(o.palette), ...palette(options.colors) };

  return (
    compact<Identity>({
      direction: text(o.direction),
      motif: text(o.motif),
      palette: compact(merged),
      type,
      icon,
      pattern,
      texture: texture?.length ? (texture as TextureLayer[]) : undefined,
      signature_interaction: text(o.signature_interaction),
      fingerprint: text(o.fingerprint),
    }) ?? {}
  );
}
