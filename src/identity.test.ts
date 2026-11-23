import { describe, expect, it } from "vitest";
import { parseIdentity } from "./identity.js";

const full = {
  direction: "Industrial calm: workshop light on raw steel.",
  motif: "a rivet line",
  palette: {
    ink: "oklch(22% 0.02 260)",
    surface: "#f6f3ec",
    primary: "oklch(55% 0.18 35)",
    accent: "rgb(20 120 140)",
    signal: "hsl(48 95% 55%)",
  },
  type: { display: "Fraunces", body: "Inter, system-ui, sans-serif" },
  icon: { stroke: 1.75, corner: "chamfer", fill: "duotone" },
  pattern: { tile: "brand/pattern.svg", scale: 1.5, opacity: 0.08 },
  texture: ["grain", "pattern", "depth"],
  signature_interaction: "the rivet line draws in on load",
  fingerprint: "industrial / steel+rust / Fraunces+Inter / rivets",
};

describe("parseIdentity", () => {
  it("keeps every valid field, typed", () => {
    expect(parseIdentity(full)).toEqual(full);
  });

  it("unwraps a { identity } wrapper and parses JSON text", () => {
    expect(parseIdentity({ identity: full, colors: {} })).toEqual(full);
    expect(parseIdentity(JSON.stringify({ identity: full }))).toEqual(full);
  });

  it("drops invalid and unknown fields without throwing", () => {
    const parsed = parseIdentity({
      direction: 42,
      motif: "   ",
      unknown: "x",
      palette: {
        ink: "red; } body { display: none",
        surface: "url(https://evil.example/x.png)",
        primary: "</style><script>",
        accent: "oklch(60% 0.1 200)",
        extra: "#fff",
      },
      type: { display: ["Fraunces"], body: "Inter; color: red" },
      icon: { stroke: Number.NaN, corner: "rounded", fill: "solid" },
      pattern: { tile: "javascript:alert(1)", scale: -1, opacity: 4 },
      texture: ["grain", "sparkles", 3, "grain"],
      signature_interaction: null,
    });
    expect(parsed).toEqual({
      palette: { accent: "oklch(60% 0.1 200)" },
      icon: { fill: "solid" },
      texture: ["grain"],
    });
  });

  it("drops colours that are not a hex, a colour function or a known keyword", () => {
    const parsed = parseIdentity({
      palette: {
        ink: "notacolor",
        surface: "12px",
        primary: "oklch(55% 0.18 35 / 0.9)",
        accent: "#abcd",
        signal: "currentColor",
      },
    });
    expect(parsed.palette).toEqual({
      primary: "oklch(55% 0.18 35 / 0.9)",
      accent: "#abcd",
      signal: "currentColor",
    });
    expect(
      parseIdentity({
        palette: { ink: "color-mix(in oklab, #111 40%, white)" },
      }).palette,
    ).toEqual({
      ink: "color-mix(in oklab, #111 40%, white)",
    });
  });

  it("normalises font stacks and drops ones with stray quotes", () => {
    expect(
      parseIdentity({
        type: {
          display: "'Source Serif 4', serif",
          body: 'Fraunces, "Playfair',
        },
      }).type,
    ).toEqual({
      display: "Source Serif 4, serif",
    });
  });

  it("rejects tile paths that climb out of the base or name another host", () => {
    for (const tile of [
      "../secret.svg",
      "//evil.example/p.svg",
      'p.svg")',
      "https://x/p.svg",
    ])
      expect(parseIdentity({ pattern: { tile } })).toEqual({});
  });

  it.each([undefined, null, 7, "not json", [], { identity: "x" }])(
    "gives an empty identity for %j",
    (raw) => {
      expect(parseIdentity(raw)).toEqual({});
    },
  );

  it("lets explicit colors win over the palette, key by key", () => {
    const parsed = parseIdentity(
      { palette: { ink: "#111", primary: "#c00", accent: "#0a0" } },
      {
        colors: {
          primary: "#00f",
          signal: "#fc0",
          background: "#fff",
          ink: "bad;",
        },
      },
    );
    expect(parsed.palette).toEqual({
      ink: "#111",
      primary: "#00f",
      accent: "#0a0",
      signal: "#fc0",
    });
  });

  it("uses colors alone when there is no identity", () => {
    expect(parseIdentity(undefined, { colors: { ink: "#222" } })).toEqual({
      palette: { ink: "#222" },
    });
  });
});
