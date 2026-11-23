import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { parseIdentity } from "./identity.js";
import {
  BrandStyle,
  identityToCss,
  identityToCssVars,
  revealCss,
} from "./theme.js";

describe("identityToCssVars", () => {
  it("sets no variables for an undefined, null or empty identity", () => {
    expect(identityToCssVars(undefined)).toEqual({});
    expect(identityToCssVars(null)).toEqual({});
    expect(identityToCssVars(parseIdentity(undefined))).toEqual({});
    expect(identityToCss(undefined)).toBe("");
  });

  it("maps each identity field to a --brand- variable", () => {
    const vars = identityToCssVars(
      parseIdentity({
        palette: { ink: "#111", signal: "oklch(80% 0.15 90)" },
        type: { display: "Fraunces", body: "Inter, sans-serif" },
        icon: { stroke: 2, corner: "chamfer", fill: "duotone" },
        pattern: { tile: "brand/pattern.svg", scale: 1.5, opacity: 0.1 },
      }),
      { base: "/site" },
    );
    expect(vars).toEqual({
      "--brand-ink": "#111",
      "--brand-signal": "oklch(80% 0.15 90)",
      "--brand-font-display": '"Fraunces", system-ui, sans-serif',
      "--brand-font-body": '"Inter", sans-serif',
      "--brand-icon-stroke": "2",
      "--brand-icon-linecap": "butt",
      "--brand-icon-linejoin": "bevel",
      "--brand-icon-fill": "currentColor",
      "--brand-icon-fill-opacity": "0.2",
      "--brand-pattern-tile": 'url("/site/brand/pattern.svg")',
      "--brand-pattern-scale": "1.5",
      "--brand-pattern-size": "72px",
      "--brand-pattern-opacity": "0.1",
    });
  });

  it("quotes every family name, including ones starting with a digit", () => {
    expect(
      identityToCssVars(
        parseIdentity({ type: { body: "Source Serif 4, ui-serif, serif" } }),
      ),
    ).toEqual({
      "--brand-font-body": '"Source Serif 4", ui-serif, serif',
    });
  });

  it("sets only the fields present", () => {
    expect(identityToCssVars({ pattern: { opacity: 0.05 } })).toEqual({
      "--brand-pattern-opacity": "0.05",
    });
  });
});

describe("BrandStyle", () => {
  it("renders the variables on :root plus the reveal rules", () => {
    const html = renderToStaticMarkup(
      <BrandStyle identity={{ palette: { ink: "#111" } }} />,
    );
    expect(html).toBe(
      `<style data-brand-kit="">:root{--brand-ink:#111;}${revealCss}</style>`,
    );
  });

  it("renders no variables for an undefined identity, and nothing without reveal rules", () => {
    expect(
      renderToStaticMarkup(<BrandStyle identity={undefined} />),
    ).not.toContain("--brand-");
    expect(
      renderToStaticMarkup(<BrandStyle identity={undefined} reveal={false} />),
    ).toBe("");
  });
});
