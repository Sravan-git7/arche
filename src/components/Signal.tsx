import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "../lib/gsap";
import { signal, registerSignalElement } from "../lib/signal";
import { ScrollTrigger } from "../motion/gsap";

export function Signal() {
  const dotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const dot = dotRef.current;
    if (!dot) return;

    registerSignalElement(dot);

    let travelSt: ScrollTrigger | null = null;

    // Small delay to ensure Hero and Problem have mounted and measured
    const timer = setTimeout(() => {
      travelSt = signal.travel("hero-dot", "problem-website", {
        id: "signal-hero-to-problem",
        start: 0,
        end: () => {
          const pinSt = ScrollTrigger.getById("problem-pin");
          if (pinSt) {
            return pinSt.start + (pinSt.end - pinSt.start) * 0.18;
          }
          const prob = document.getElementById("problem");
          return prob ? prob.offsetTop + window.innerHeight * 2.6 * 0.18 : window.innerHeight * 1.4;
        },
        scrub: 0.6,
      });
    }, 100);

    return () => {
      clearTimeout(timer);
      travelSt?.kill();
      registerSignalElement(null);
    };
  }, []);

  return (
    <div
      ref={dotRef}
      id="signal-dot"
      className="pointer-events-none fixed top-0 left-0 z-[60]"
      style={{
        width: 6,
        height: 6,
        borderRadius: "999px",
        background: "var(--accent)",
        boxShadow:
          "0 0 12px 2px color-mix(in srgb, var(--accent) 70%, transparent), 0 0 0 1px color-mix(in srgb, var(--accent-deep) 45%, transparent)",
        marginLeft: -3,
        marginTop: -3,
        opacity: 0,
        willChange: "transform, opacity",
      }}
      aria-hidden="true"
    />
  );
}
