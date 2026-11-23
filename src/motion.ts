import { useEffect, useRef, useSyncExternalStore, type RefObject } from "react";

/** The media query for a real hovering pointer, so touch never sticks in hover. */
export const HOVER_FINE = "(hover: hover) and (pointer: fine)";
export const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

/** Wraps CSS rules so they apply only with a fine, hovering pointer. */
export function hoverFine(css: string): string {
  return `@media ${HOVER_FINE}{${css}}`;
}

function matches(query: string): boolean {
  return typeof matchMedia === "function" && matchMedia(query).matches;
}

export function prefersReducedMotion(): boolean {
  return matches(REDUCED_MOTION);
}

function useMedia(query: string): boolean {
  return useSyncExternalStore(
    (cb) => {
      if (typeof matchMedia !== "function") return () => {};
      const mql = matchMedia(query);
      mql.addEventListener?.("change", cb);
      return () => mql.removeEventListener?.("change", cb);
    },
    () => matches(query),
    () => false,
  );
}

/** True with a fine, hovering pointer (false on the server and on touch). */
export function useHoverFine(): boolean {
  return useMedia(HOVER_FINE);
}

/** True when the visitor asked for reduced motion (false on the server). */
export function useReducedMotion(): boolean {
  return useMedia(REDUCED_MOTION);
}

export const REVEAL = "data-reveal";
export const REVEAL_PENDING = "data-reveal-pending";

export interface RevealOptions {
  /** IntersectionObserver rootMargin. Default `200% 0px -8% 0px`. */
  rootMargin?: string;
}

/**
 * Reveals an element as it scrolls in. The element is opaque on first paint:
 * nothing is hidden in the HTML, so no-JS, crawlers and the first screen
 * always show content. After mount, only an element below the fold is marked
 * `data-reveal-pending` (hidden by `revealCss`, which `<BrandStyle>` emits)
 * until it intersects. Under reduced motion, or without IntersectionObserver,
 * nothing is ever hidden or animated.
 */
export function useReveal<T extends Element = HTMLElement>(
  options: RevealOptions = {},
): RefObject<T | null> {
  const ref = useRef<T | null>(null);
  const rootMargin = options.rootMargin ?? "200% 0px -8% 0px";
  useEffect(() => {
    const el = ref.current;
    if (
      !el ||
      typeof IntersectionObserver === "undefined" ||
      prefersReducedMotion()
    )
      return;
    if (el.getBoundingClientRect().top <= window.innerHeight) return;
    el.setAttribute(REVEAL, "");
    el.setAttribute(REVEAL_PENDING, "");
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          el.removeAttribute(REVEAL_PENDING);
          io.disconnect();
        }
      },
      { rootMargin },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      el.removeAttribute(REVEAL_PENDING);
    };
  }, [rootMargin]);
  return ref;
}
