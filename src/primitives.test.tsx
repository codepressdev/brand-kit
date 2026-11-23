import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { fontsHref } from "./fonts.js";
import { BrandIcon, makeIcon } from "./icon.js";
import { Depth, Frame, Grain, MotifPattern } from "./texture.js";

describe("decorative primitives", () => {
  it.each([
    ["Grain", <Grain />],
    ["MotifPattern", <MotifPattern />],
    ["unlabelled BrandIcon", <BrandIcon d="M4 12h16" />],
  ])("%s is hidden from assistive technology", (_name, node) => {
    expect(renderToStaticMarkup(node)).toMatch(/^<\w+[^>]* aria-hidden="true"/);
  });

  it("MotifPattern reads the identity variables unless props override them", () => {
    expect(renderToStaticMarkup(<MotifPattern />)).toContain(
      "background-image:var(--brand-pattern-tile, none)",
    );
    const html = renderToStaticMarkup(
      <MotifPattern tile="brand/p.svg" scale={2} opacity={0.2} />,
    );
    expect(html).toContain("background-image:url(&quot;/brand/p.svg&quot;)");
    expect(html).toContain("background-size:96px");
    expect(html).toContain("opacity:0.2");
  });

  it("a labelled icon is an image with a name; makeIcon keeps the paths", () => {
    const Van = makeIcon(["M2 7h12v9H2z", "M14 10h4l3 3v3h-7"], {
      name: "Van",
    });
    const html = renderToStaticMarkup(<Van label="Delivery" />);
    expect(html).toContain('role="img"');
    expect(html).toContain('aria-label="Delivery"');
    expect(html.match(/<path/g)).toHaveLength(2);
    expect(Van.displayName).toBe("Van");
  });

  it("Frame and Depth keep their content and pass props through", () => {
    expect(
      renderToStaticMarkup(
        <Frame as="section" id="a">
          hi
        </Frame>,
      ),
    ).toMatch(/^<section id="a" style="[^"]*box-shadow[^"]*">hi<\/section>$/);
    expect(renderToStaticMarkup(<Depth level={3}>hi</Depth>)).toContain(
      ">hi</div>",
    );
  });
});

describe("fontsHref", () => {
  it("builds a display=optional Google Fonts URL for named families", () => {
    expect(
      fontsHref(
        { type: { display: "Instrument Serif", body: "Inter, sans-serif" } },
        { weights: { body: "400;600" } },
      ),
    ).toBe(
      "https://fonts.googleapis.com/css2?family=Instrument+Serif&family=Inter:wght@400;600&display=optional",
    );
  });

  it("gives nothing for no fonts or generic families", () => {
    expect(fontsHref(undefined)).toBeUndefined();
    expect(fontsHref({ type: { body: "system-ui" } })).toBeUndefined();
  });
});
