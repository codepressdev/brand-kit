import type { CSSProperties, ElementType, ReactNode } from "react";
import { safePath } from "./identity.js";
import { resolveTile } from "./theme.js";

interface LayerProps {
  className?: string;
  style?: CSSProperties;
}

/** Fills the nearest positioned ancestor without widening it or catching clicks. */
const LAYER: CSSProperties = {
  position: "absolute",
  inset: 0,
  pointerEvents: "none",
  zIndex: -1,
};

export interface GrainProps extends LayerProps {
  /** Default 0.12. */
  opacity?: number;
  /** feTurbulence baseFrequency. Default 0.8. */
  frequency?: number;
  /** Default `multiply`. */
  blend?: CSSProperties["mixBlendMode"];
}

/**
 * A film-grain layer from an SVG `feTurbulence` noise tile, inlined as a data
 * URI (no request). Put it inside an element with `position: relative` and
 * `isolation: isolate`. Decorative, so hidden from assistive technology.
 */
export function Grain({
  opacity = 0.12,
  frequency = 0.8,
  blend = "multiply",
  className,
  style,
}: GrainProps) {
  const f = Number.isFinite(frequency) ? frequency : 0.8;
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='${f}' numOctaves='3' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>`;
  return (
    <span
      aria-hidden="true"
      className={className}
      style={{
        ...LAYER,
        opacity,
        mixBlendMode: blend,
        backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(svg)}")`,
        ...style,
      }}
    />
  );
}

export interface MotifPatternProps extends LayerProps {
  /** Tile path, relative to `base`. Default: the identity's `--brand-pattern-tile`. */
  tile?: string;
  base?: string;
  /** Multiplies the 48px tile. Default: `--brand-pattern-size`. */
  scale?: number;
  /** Default: `--brand-pattern-opacity`, else 0.08. */
  opacity?: number;
}

/**
 * The firm's own SVG tile, repeated behind content. Reads the identity's CSS
 * variables (`--brand-pattern-tile`, `--brand-pattern-size`,
 * `--brand-pattern-opacity`) unless props override them. Clip the parent
 * (`overflow: clip`) so the layer never widens the page. Decorative.
 */
export function MotifPattern({
  tile,
  base,
  scale,
  opacity,
  className,
  style,
}: MotifPatternProps) {
  const path = safePath(tile);
  return (
    <span
      aria-hidden="true"
      className={className}
      style={{
        ...LAYER,
        backgroundImage: path
          ? `url("${resolveTile(path, base)}")`
          : "var(--brand-pattern-tile, none)",
        backgroundRepeat: "repeat",
        backgroundSize:
          scale !== undefined
            ? `${48 * scale}px`
            : "var(--brand-pattern-size, 48px)",
        opacity: opacity ?? "var(--brand-pattern-opacity, 0.08)",
        ...style,
      }}
    />
  );
}

type Polymorphic = {
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
} & Record<string, unknown>;

const INK = "var(--brand-ink, currentColor)";
const mix = (pct: number) => `color-mix(in oklab, ${INK} ${pct}%, transparent)`;

export type FrameVariant = "offset" | "layered" | "soft";

const FRAMES: Record<FrameVariant, CSSProperties> = {
  offset: {
    border: `1.5px solid ${INK}`,
    boxShadow: `var(--brand-frame-offset, 6px) var(--brand-frame-offset, 6px) 0 0 ${INK}`,
  },
  layered: {
    border: `1.5px solid ${INK}`,
    boxShadow: `5px 5px 0 -1.5px var(--brand-surface, Canvas), 5px 5px 0 0 ${INK}, 10px 10px 0 -1.5px var(--brand-surface, Canvas), 10px 10px 0 0 ${INK}`,
  },
  soft: {
    border: `1px solid ${mix(12)}`,
    boxShadow: `0 1px 2px ${mix(10)}, 0 14px 32px -16px ${mix(35)}`,
  },
};

export interface FrameProps extends Polymorphic {
  /** `offset` (hard offset shadow), `layered` (stacked plates) or `soft`. Default `offset`. */
  variant?: FrameVariant;
}

/** A border-and-shadow frame drawn in the brand ink. Content stays accessible. */
export function Frame({
  as: As = "div",
  variant = "offset",
  style,
  ...rest
}: FrameProps) {
  return <As {...rest} style={{ ...FRAMES[variant], ...style }} />;
}

export interface DepthProps extends Polymorphic {
  /** 1 (resting) to 3 (lifted). Default 2. */
  level?: 1 | 2 | 3;
}

const DEPTH = [
  `0 1px 2px ${mix(8)}, 0 4px 10px -6px ${mix(20)}`,
  `0 1px 2px ${mix(8)}, 0 8px 18px -10px ${mix(25)}, 0 24px 48px -28px ${mix(30)}`,
  `0 2px 4px ${mix(8)}, 0 14px 28px -14px ${mix(30)}, 0 40px 80px -40px ${mix(40)}`,
];

/** Layered soft shadows tinted by the brand ink, for depth through layering. */
export function Depth({
  as: As = "div",
  level = 2,
  style,
  ...rest
}: DepthProps) {
  return (
    <As
      {...rest}
      style={{ boxShadow: DEPTH[level - 1] ?? DEPTH[1], ...style }}
    />
  );
}
