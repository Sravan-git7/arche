import { useEffect } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger, prefersReducedMotion } from "./gsap";

/**
 * The reference is a Framer site with "Smooth Scrolling" enabled — content
 * has a short inertia tail rather than snapping to the native wheel delta.
 * We reproduce that with Lenis, driven by the GSAP ticker so it stays in
 * lockstep with every ScrollTrigger-based reveal in the page.
 */
/** The live instance, for the few places that need to drive scroll themselves. */
let instance: Lenis | null = null;
export const getLenis = (): Lenis | null => instance;

export function useLenis() {
  useEffect(() => {
    if (prefersReducedMotion()) return;

    const lenis = new Lenis({
      duration: 1.05,
      easing: (t: number) => 1 - Math.pow(1 - t, 3),
      smoothWheel: true,
      touchMultiplier: 1,
      // Lenis intercepts native anchor-jump scrolling by default — opt back
      // in so every `href="#section"` link (nav, CTAs, FAQ) keeps working,
      // landing just below the fixed header instead of flush with the top.
      anchors: { offset: -96 },
    });

    instance = lenis;
    lenis.on("scroll", ScrollTrigger.update);

    const tick = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener("load", refresh);
    const t = setTimeout(refresh, 400);

    return () => {
      clearTimeout(t);
      window.removeEventListener("load", refresh);
      gsap.ticker.remove(tick);
      lenis.destroy();
      if (instance === lenis) instance = null;
    };
  }, []);
}
