import { useLayoutEffect, useRef } from "react";
import { gsap, ScrollTrigger, prefersReducedMotion } from "../lib/gsap";

/**
 * ServiceHandoff — Problem-to-Services 4-dot hand-off and Arch Aperture.
 *
 * Occupies the 70vh scroll range after Problem unpins:
 * - 4 Problem dots (compact diagram line) travel to the 4 rail dots in Services.
 * - Dot 0 is the single persistent signal dot (hands off to rail-1).
 * - Single-dot visibility invariant: never visible twice at once.
 * - Arch aperture reveals #services-stage from bottom center.
 * - Header "Every business starts somewhere." reveals through masks after 60% progress.
 */
export function ServiceHandoff() {
  const layerRef = useRef<HTMLDivElement>(null);
  const dot0Ref = useRef<HTMLSpanElement>(null);
  const dot1Ref = useRef<HTMLSpanElement>(null);
  const dot2Ref = useRef<HTMLSpanElement>(null);
  const dot3Ref = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    if (prefersReducedMotion() || typeof window === "undefined") return;
    if (!window.matchMedia("(min-width: 900px)").matches) return;

    const layer = layerRef.current;
    const dotEls = [dot0Ref.current, dot1Ref.current, dot2Ref.current, dot3Ref.current];
    if (!layer || dotEls.some((d) => !d)) return;

    const ctx = gsap.context(() => {
      let rectsA: { x: number; y: number }[] = [];
      let rectsB: { x: number; y: number }[] = [];
      let problemDots: HTMLElement[] = [];
      let railDots: HTMLElement[] = [];

      const measure = () => {
        const probSlots = Array.from(
          document.querySelectorAll<HTMLElement>('#problem [data-thread-slot="problem"]')
        );
        const probMorph = Array.from(
          document.querySelectorAll<HTMLElement>('#problem .pf-morph-node')
        );
        problemDots = probMorph.length ? probMorph : probSlots;

        railDots = Array.from(
          document.querySelectorAll<HTMLElement>('#services-stage [data-rail-dot]')
        );

        if (problemDots.length >= 4 && railDots.length >= 4) {
          rectsA = problemDots.slice(0, 4).map((el) => {
            const r = el.getBoundingClientRect();
            return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
          });
          rectsB = railDots.slice(0, 4).map((el) => {
            const r = el.getBoundingClientRect();
            return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
          });
        }
      };

      const stageEl = document.getElementById("services-stage");
      const headerLine = document.querySelector<HTMLElement>("#services-home .d4");

      const applyProgress = (t: number) => {
        // --- 1. Carrier Dots Handoff & Single-Dot Visibility Invariant ---
        if (t <= 0.005) {
          layer.style.opacity = "0";
          problemDots.forEach((el) => {
            el.style.opacity = "1";
          });
        } else if (t >= 0.995) {
          layer.style.opacity = "0";
          problemDots.forEach((el) => {
            el.style.opacity = "0";
          });
        } else {
          layer.style.opacity = "1";
          problemDots.forEach((el) => {
            el.style.opacity = "0";
          });

          if (rectsA.length >= 4 && rectsB.length >= 4) {
            for (let i = 0; i < 4; i++) {
              const a = rectsA[i];
              const b = rectsB[i];
              let x = a.x + (b.x - a.x) * t;
              let y = a.y + (b.y - a.y) * t;

              // Dot 0 (signal) travels along quadratic arc with 18% perpendicular offset
              if (i === 0) {
                const dx = b.x - a.x;
                const dy = b.y - a.y;
                const dist = Math.hypot(dx, dy);
                if (dist > 1) {
                  const perpX = -dy / dist;
                  const perpY = dx / dist;
                  const offset = dist * 0.18;
                  const midX = (a.x + b.x) / 2 + perpX * offset;
                  const midY = (a.y + b.y) / 2 + perpY * offset;
                  const mt = 1 - t;
                  x = mt * mt * a.x + 2 * mt * t * midX + t * t * b.x;
                  y = mt * mt * a.y + 2 * mt * t * midY + t * t * b.y;
                }
              }

              const dot = dotEls[i];
              if (dot) {
                dot.style.transform = `translate(${x}px, ${y}px)`;
              }
            }
          }
        }

        // --- 2. Arch Aperture on #services-stage ---
        if (stageEl) {
          if (t >= 0.999) {
            stageEl.style.clipPath = "";
          } else if (t <= 0.001) {
            stageEl.style.clipPath = "inset(100% 50% 0% 50% round 0px)";
          } else {
            const topInset = (1 - t) * 100;
            const xInset = (1 - t) * 50;
            const stageW = stageEl.offsetWidth || 600;
            const curW = stageW * t;
            let topR = curW / 2;
            if (t > 0.6) {
              const u = (t - 0.6) / 0.4;
              const eased = u * u;
              topR = (curW / 2) * (1 - eased) + 4 * eased;
            }
            stageEl.style.clipPath = `inset(${topInset.toFixed(2)}% ${xInset.toFixed(2)}% 0% ${xInset.toFixed(2)}% round ${Math.round(topR)}px ${Math.round(topR)}px 4px 4px)`;
          }
        }

        // --- 3. Header Masked Reveal when Aperture Passes 60% ---
        if (headerLine) {
          if (t >= 0.6) {
            const hp = Math.min(1, (t - 0.6) / 0.35);
            const eased = 1 - Math.pow(1 - hp, 3);
            headerLine.style.transform = `translateY(${(1 - eased) * 100}%)`;
            headerLine.style.opacity = `${eased}`;
          } else {
            headerLine.style.transform = "translateY(100%)";
            headerLine.style.opacity = "0";
          }
        }
      };

      const servSec = document.getElementById("services-home");
      if (!servSec) return;

      const st = ScrollTrigger.create({
        id: "problem-services-handoff",
        trigger: servSec,
        start: () => {
          const pPin = ScrollTrigger.getById("problem-pin");
          return pPin ? pPin.end : 3168;
        },
        end: () => {
          const pPin = ScrollTrigger.getById("problem-pin");
          const s = pPin ? pPin.end : 3168;
          return s + Math.round(window.innerHeight * 0.7);
        },
        scrub: 0.6,
        invalidateOnRefresh: true,
        onRefresh: (self) => {
          measure();
          applyProgress(self.progress);
        },
        onUpdate: (self) => {
          applyProgress(self.progress);
        },
        onLeave: () => {
          applyProgress(1);
        },
        onLeaveBack: () => {
          applyProgress(0);
        },
      });

      measure();
      applyProgress(st.progress);
    });

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={layerRef}
      className="pointer-events-none fixed inset-0 z-[60]"
      style={{ opacity: 0 }}
      aria-hidden
    >
      {/* Dot 0: Persistent Signal Carrier */}
      <span
        ref={dot0Ref}
        className="signal-dot absolute -ml-[3px] -mt-[3px] block h-[6px] w-[6px]"
        style={{ willChange: "transform" }}
      />
      {/* Dots 1, 2, 3: Carrier Dots */}
      <span
        ref={dot1Ref}
        className="signal-dot absolute -ml-[3px] -mt-[3px] block h-[6px] w-[6px]"
        style={{ willChange: "transform" }}
      />
      <span
        ref={dot2Ref}
        className="signal-dot absolute -ml-[3px] -mt-[3px] block h-[6px] w-[6px]"
        style={{ willChange: "transform" }}
      />
      <span
        ref={dot3Ref}
        className="signal-dot absolute -ml-[3px] -mt-[3px] block h-[6px] w-[6px]"
        style={{ willChange: "transform" }}
      />
    </div>
  );
}
