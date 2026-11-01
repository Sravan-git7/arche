import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "./gsap";
import { useRoute } from "../lib/router";

export const LenisContext = createContext<Lenis | null>(null);

let globalLenisInstance: Lenis | null = null;

export const getLenis = (): Lenis | null => globalLenisInstance;

export function useLenisInstance(): Lenis | null {
  return useContext(LenisContext);
}

export const useLenis = useLenisInstance;

export const prefersReducedMotion = (): boolean =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export interface SmoothScrollProps {
  children: React.ReactNode;
}

export function SmoothScroll({ children }: SmoothScrollProps) {
  const [lenis, setLenis] = useState<Lenis | null>(null);
  const lenisRef = useRef<Lenis | null>(null);
  const route = useRoute();

  useEffect(() => {
    // Under prefers-reduced-motion: reduce, Lenis is disabled per R7
    if (prefersReducedMotion()) {
      if (lenisRef.current) {
        lenisRef.current.destroy();
        lenisRef.current = null;
        globalLenisInstance = null;
        setLenis(null);
      }
      return;
    }

    const instance = new Lenis({
      duration: 1.15,
      smoothWheel: true,
      syncTouch: false,
      autoRaf: false,
    });

    lenisRef.current = instance;
    globalLenisInstance = instance;
    setLenis(instance);

    // Sync Lenis with GSAP ticker & ScrollTrigger exactly per R8
    instance.on("scroll", ScrollTrigger.update);

    const tickerCb = (time: number) => {
      instance.raf(time * 1000);
    };

    gsap.ticker.add(tickerCb);
    gsap.ticker.lagSmoothing(0);

    const onMediaChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        // Switched to reduced motion: disable Lenis
        gsap.ticker.remove(tickerCb);
        instance.destroy();
        lenisRef.current = null;
        globalLenisInstance = null;
        setLenis(null);
      }
    };

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    mediaQuery.addEventListener?.("change", onMediaChange);

    return () => {
      mediaQuery.removeEventListener?.("change", onMediaChange);
      gsap.ticker.remove(tickerCb);
      instance.destroy();
      if (lenisRef.current === instance) {
        lenisRef.current = null;
      }
      if (globalLenisInstance === instance) {
        globalLenisInstance = null;
      }
    };
  }, []);

  // On route change, reset scroll position immediately
  useEffect(() => {
    if (lenisRef.current) {
      lenisRef.current.scrollTo(0, { immediate: true });
    } else {
      window.scrollTo(0, 0);
    }
  }, [route]);

  // Ensure scrollable inner regions carry data-lenis-prevent
  useEffect(() => {
    const applyLenisPrevent = () => {
      const scrollables = document.querySelectorAll<HTMLElement>(
        '.overflow-y-auto, .overflow-x-auto, [data-chat], [aria-label*="chat" i], [aria-label*="transcript" i]'
      );
      scrollables.forEach((el) => {
        if (!el.hasAttribute("data-lenis-prevent")) {
          el.setAttribute("data-lenis-prevent", "true");
        }
      });
    };

    applyLenisPrevent();

    const observer = new MutationObserver(applyLenisPrevent);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, [route]);

  return (
    <LenisContext.Provider value={lenis}>
      {children}
    </LenisContext.Provider>
  );
}

export default SmoothScroll;
