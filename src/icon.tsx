import type { CSSProperties } from "react";

export interface BrandIconProps {
  /** Path data in a 24×24 grid; several paths draw one icon. */
  d: string | readonly string[];
  /** Default 24. */
  size?: number | string;
  /** An accessible name. Without one the icon is decorative and hidden. */
  label?: string;
  viewBox?: string;
  className?: string;
  style?: CSSProperties;
}

/**
 * One parametric icon base: the firm's paths plug in, and stroke width,
 * corners and fill come from the identity's CSS variables
 * (`--brand-icon-stroke`, `--brand-icon-linecap`, `--brand-icon-linejoin`,
 * `--brand-icon-fill`, `--brand-icon-fill-opacity`).
 */
export function BrandIcon({
  d,
  size = 24,
  label,
  viewBox = "0 0 24 24",
  className,
  style,
}: BrandIconProps) {
  const paths = typeof d === "string" ? [d] : d;
  return (
    <svg
      viewBox={viewBox}
      width={size}
      height={size}
      stroke="currentColor"
      className={className}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
      style={{
        fill: "var(--brand-icon-fill, none)",
        fillOpacity: "var(--brand-icon-fill-opacity, 0)",
        strokeWidth: "var(--brand-icon-stroke, 1.75)",
        strokeLinecap:
          "var(--brand-icon-linecap, round)" as CSSProperties["strokeLinecap"],
        strokeLinejoin:
          "var(--brand-icon-linejoin, round)" as CSSProperties["strokeLinejoin"],
        flexShrink: 0,
        ...style,
      }}
    >
      {paths.map((p, i) => (
        <path key={i} d={p} />
      ))}
    </svg>
  );
}

export type IconComponent = ((
  props: Omit<BrandIconProps, "d">,
) => ReturnType<typeof BrandIcon>) & {
  displayName?: string;
};

/** Makes a named icon component from the firm's paths: `const Van = makeIcon([...])`. */
export function makeIcon(
  paths: string | readonly string[],
  defaults: Omit<BrandIconProps, "d"> & { name?: string } = {},
): IconComponent {
  const { name, ...rest } = defaults;
  const Icon: IconComponent = (props) => (
    <BrandIcon {...rest} {...props} d={paths} />
  );
  if (name) Icon.displayName = name;
  return Icon;
}
