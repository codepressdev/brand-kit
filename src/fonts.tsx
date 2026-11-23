import type { Identity } from "./identity.js";

const GOOGLE_CSS = "https://fonts.googleapis.com";
const GOOGLE_FILES = "https://fonts.gstatic.com";

export interface FontsHrefOptions {
  /** Weights per family, e.g. `{ display: "400;700" }` or a range `"300..800"` for variable fonts. */
  weights?: { display?: string; body?: string };
}

const familyName = (f: string) =>
  f.split(",")[0]?.replace(/["']/g, "").trim() ?? "";
const GENERIC =
  /^(serif|sans-serif|monospace|cursive|fantasy|system-ui|ui-[\w-]+)$/;

/**
 * A Google Fonts stylesheet URL for the identity's display and body families,
 * with `display=optional`: the brand font is used only if it arrives before
 * first render, otherwise the fallback stays for that page view, so text
 * never reflows. Undefined when the identity names no font.
 */
export function fontsHref(
  identity: Identity | undefined | null,
  options: FontsHrefOptions = {},
): string | undefined {
  const parts: string[] = [];
  for (const role of ["display", "body"] as const) {
    const name = familyName(identity?.type?.[role] ?? "");
    if (!name || GENERIC.test(name)) continue;
    const w = options.weights?.[role];
    const spec =
      encodeURIComponent(name).replace(/%20/g, "+") +
      (w && /^[\d.;]+$/.test(w) ? `:wght@${w}` : "");
    if (!parts.includes(spec)) parts.push(spec);
  }
  if (!parts.length) return undefined;
  return `${GOOGLE_CSS}/css2?${parts.map((p) => `family=${p}`).join("&")}&display=optional`;
}

export interface BrandFontsProps extends FontsHrefOptions {
  identity?: Identity | null;
  /** A stylesheet URL to load instead of the Google Fonts one. */
  href?: string;
}

/**
 * Loads the brand fonts without layout shift: preconnects, then a
 * `display=optional` stylesheet. Render it once, in the document head when
 * the framework allows. Renders nothing when there is no font to load.
 */
export function BrandFonts({ identity, href, weights }: BrandFontsProps) {
  const url = href ?? fontsHref(identity, { weights });
  if (!url) return null;
  const google = url.startsWith(GOOGLE_CSS);
  return (
    <>
      {google && <link rel="preconnect" href={GOOGLE_CSS} />}
      {google && <link rel="preconnect" href={GOOGLE_FILES} crossOrigin="" />}
      <link rel="stylesheet" href={url} />
    </>
  );
}

/** Adds the font stylesheet to `<head>` once, outside React. Returns the link element. */
export function loadFonts(
  url: string | undefined,
): HTMLLinkElement | undefined {
  if (!url || typeof document === "undefined") return undefined;
  for (const el of document.head.querySelectorAll<HTMLLinkElement>(
    "link[data-brand-fonts]",
  ))
    if (el.dataset.brandFonts === url) return el;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = url;
  link.dataset.brandFonts = url;
  document.head.append(link);
  return link;
}
