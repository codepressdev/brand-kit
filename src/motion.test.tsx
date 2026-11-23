import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { hoverFine, useReveal } from "./motion.js";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

let observed: Element[] = [];
let callback: IntersectionObserverCallback | undefined;
class FakeObserver {
  constructor(cb: IntersectionObserverCallback) {
    callback = cb;
  }
  observe(el: Element) {
    observed.push(el);
  }
  disconnect() {}
  unobserve() {}
}

function mockMedia(reduced: boolean) {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: reduced && query.includes("prefers-reduced-motion"),
    media: query,
    addEventListener() {},
    removeEventListener() {},
  }));
}

function Section({ top }: { top: number }) {
  const ref = useReveal<HTMLDivElement>();
  return (
    <div
      ref={(el) => {
        ref.current = el;
        if (el) el.getBoundingClientRect = () => ({ top }) as DOMRect;
      }}
    >
      content
    </div>
  );
}

function mount(top: number) {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  act(() => root.render(<Section top={top} />));
  return { el: host.firstElementChild as HTMLElement, root };
}

beforeEach(() => {
  observed = [];
  callback = undefined;
  vi.stubGlobal("IntersectionObserver", FakeObserver);
  vi.stubGlobal("innerHeight", 800);
});
afterEach(() => {
  vi.unstubAllGlobals();
  document.body.innerHTML = "";
});

describe("useReveal", () => {
  it("under reduced motion leaves a below-the-fold element visible and never animates it", () => {
    mockMedia(true);
    const { el, root } = mount(2000);
    expect(el.hasAttribute("data-reveal-pending")).toBe(false);
    expect(el.hasAttribute("data-reveal")).toBe(false);
    expect(observed).toEqual([]);
    act(() => root.unmount());
  });

  it("leaves an element on the first screen visible", () => {
    mockMedia(false);
    const { el, root } = mount(100);
    expect(el.hasAttribute("data-reveal-pending")).toBe(false);
    expect(observed).toEqual([]);
    act(() => root.unmount());
  });

  it("hides a below-the-fold element until it intersects", () => {
    mockMedia(false);
    const { el, root } = mount(2000);
    expect(el.hasAttribute("data-reveal-pending")).toBe(true);
    expect(observed).toEqual([el]);
    act(() =>
      callback?.(
        [
          {
            isIntersecting: true,
            target: el,
          } as unknown as IntersectionObserverEntry,
        ],
        {} as IntersectionObserver,
      ),
    );
    expect(el.hasAttribute("data-reveal-pending")).toBe(false);
    act(() => root.unmount());
  });

  it("does nothing without IntersectionObserver", () => {
    mockMedia(false);
    vi.stubGlobal("IntersectionObserver", undefined);
    const { el, root } = mount(2000);
    expect(el.hasAttribute("data-reveal-pending")).toBe(false);
    act(() => root.unmount());
  });
});

describe("hoverFine", () => {
  it("wraps rules in the fine-pointer hover query", () => {
    expect(hoverFine(".a:hover{color:red}")).toBe(
      "@media (hover: hover) and (pointer: fine){.a:hover{color:red}}",
    );
  });
});
