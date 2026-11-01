import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap, onMotionPreferenceChange, prefersReducedMotion } from "../lib/gsap";
import { isIntroActive } from "./Intro";

/**
 * Hero spatial scene — architectural floor plates seen at an angle.
 *
 * Plates assemble from farthest to nearest, start at translate(-80px, 80px),
 * lime edges draw with DrawSVG, and lime dot pulses once.
 *
 * Three plane depth layers follow the pointer: front 14px, middle 8px, back 3px,
 * smoothed with a lerp of 0.08.
 *
 * Hero scroll-out scales 1 to 0.86, moves up 4vh, fades to opacity 0.15.
 */
type DepthLayer = "back" | "middle" | "front";

type Plate = {
  w: number;
  h: number;
  top: number;
  left: number;
  layer: DepthLayer;
  edge: boolean;
};

const PLATES: Plate[] = [
  { w: 62, h: 28, top: 14, left: 24, layer: "back", edge: false },
  { w: 58, h: 27, top: 22, left: 14, layer: "middle", edge: true },
  { w: 52, h: 25, top: 36, left: 30, layer: "middle", edge: false },
  { w: 44, h: 21, top: 51, left: 16, layer: "front", edge: true },
  { w: 34, h: 17, top: 64, left: 40, layer: "front", edge: false },
];

const SIGNAL_PLATE = 2;

export function HeroEnvironment() {
  const root = useRef<HTMLDivElement>(null);
  const [reduced, setReduced] = useState(prefersReducedMotion);
  useEffect(() => onMotionPreferenceChange(setReduced), []);

  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;

    const plates = gsap.utils.toArray<HTMLElement>(".hp-plate", el);
    const limeEdges = gsap.utils.toArray<SVGElement>(".hp-lime-edge", el);
    const signal = el.querySelector<HTMLElement>(".hp-signal");
    const pulse = el.querySelector<HTMLElement>(".hp-signal-pulse");

    // Architectural isometric angle is fixed on plates
    gsap.set(plates, { rotationX: 58, rotationZ: -34, transformOrigin: "50% 50%" });

    const reduce = reduced || prefersReducedMotion();
    if (reduce) {
      gsap.set(plates, { x: 0, y: 0, opacity: 1 });
      gsap.set(limeEdges, { drawSVG: "100%" });
      gsap.set(signal, { opacity: 1, scale: 1 });
      return;
    }

    const ctx = gsap.context(() => {
      // HERO SCROLL-OUT (scrubbed, scrub 0.6, over the first 100vh, no pin):
      // - Planes scale 1 to 0.86, move up 4vh, fade to opacity 0.15
      const scrollOut = gsap.timeline({
        scrollTrigger: {
          trigger: el.parentElement,
          start: "top top",
          end: "+=100%",
          scrub: 0.6,
          invalidateOnRefresh: true,
        },
      });
      scrollOut.to(el, { scale: 0.86, y: "-4vh", opacity: 0.15, ease: "none" }, 0);

      // HERO IDLE: desktop only (min-width: 768px with fine pointer).
      // Three plane depth layers follow the pointer: front 14px, middle 8px, back 3px, smoothed with a lerp of 0.08.
      const mm = gsap.matchMedia();
      mm.add("(min-width: 768px) and (hover: hover) and (pointer: fine)", () => {
        const frontEls = el.querySelectorAll<HTMLElement>(".hp-layer-front");
        const midEls = el.querySelectorAll<HTMLElement>(".hp-layer-middle");
        const backEls = el.querySelectorAll<HTMLElement>(".hp-layer-back");

        const frontX = gsap.quickSetter(frontEls, "x", "px");
        const frontY = gsap.quickSetter(frontEls, "y", "px");
        const midX = gsap.quickSetter(midEls, "x", "px");
        const midY = gsap.quickSetter(midEls, "y", "px");
        const backX = gsap.quickSetter(backEls, "x", "px");
        const backY = gsap.quickSetter(backEls, "y", "px");

        let targetX = 0;
        let targetY = 0;
        let currentX = 0;
        let currentY = 0;

        const onPointerMove = (e: PointerEvent) => {
          targetX = (e.clientX / window.innerWidth - 0.5) * 2;
          targetY = (e.clientY / window.innerHeight - 0.5) * 2;
        };

        const tickerCb = () => {
          currentX += (targetX - currentX) * 0.08;
          currentY += (targetY - currentY) * 0.08;

          frontX(currentX * 14);
          frontY(currentY * 14 * 0.6);
          midX(currentX * 8);
          midY(currentY * 8 * 0.6);
          backX(currentX * 3);
          backY(currentY * 3 * 0.6);
        };

        window.addEventListener("pointermove", onPointerMove, { passive: true });
        gsap.ticker.add(tickerCb);

        return () => {
          window.removeEventListener("pointermove", onPointerMove);
          gsap.ticker.remove(tickerCb);
          gsap.set([frontEls, midEls, backEls], { x: 0, y: 0 });
        };
      });

      // Initial state before reveal
      gsap.set(plates, { x: -80, y: 80, opacity: 0 });
      gsap.set(limeEdges, { drawSVG: "0%" });
      gsap.set(signal, { opacity: 0, scale: 0 });
      gsap.set(pulse, { scale: 1, opacity: 0 });

      const entrance = gsap.timeline({ paused: true });

      // Planes assemble from farthest to nearest, stagger 0.12, 1.4s power3.out
      entrance.to(
        plates,
        {
          x: 0,
          y: 0,
          opacity: 1,
          duration: 1.4,
          ease: "power3.out",
          stagger: 0.12,
        },
        0
      );

      // Lime edge on each plane draws over 0.6s
      entrance.to(
        limeEdges,
        {
          drawSVG: "100%",
          duration: 0.6,
          ease: "power2.inOut",
          stagger: 0.12,
        },
        0.3
      );

      // Lime dot appears last and pulses once (scale 1 to 1.8, opacity 0.6 to 0, 0.7s)
      entrance.to(
        signal,
        {
          opacity: 1,
          scale: 1,
          duration: 0.35,
          ease: "back.out(2)",
        },
        1.35
      );

      entrance.fromTo(
        pulse,
        { scale: 1, opacity: 0.6 },
        { scale: 1.8, opacity: 0, duration: 0.7, ease: "power2.out" },
        1.5
      );

      // Idle subtle bobbing on signal dot
      entrance.to(
        signal,
        {
          y: -6,
          duration: 2.4,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
        },
        1.9
      );

      let cleanupReveal = () => {};
      if (!isIntroActive()) {
        // Same-session reload: planes already in resting position
        gsap.set(plates, { x: 0, y: 0, opacity: 1 });
        gsap.set(limeEdges, { drawSVG: "100%" });
        gsap.set(signal, { opacity: 1, scale: 1 });
        gsap.to(signal, {
          y: -6,
          duration: 2.4,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
        });
      } else {
        const onHeroReveal = () => {
          entrance.play();
        };
        window.addEventListener("arche:hero-reveal-start", onHeroReveal, { once: true });
        const failsafe = window.setTimeout(onHeroReveal, 3200);
        cleanupReveal = () => {
          window.removeEventListener("arche:hero-reveal-start", onHeroReveal);
          window.clearTimeout(failsafe);
        };
      }

      return () => {
        cleanupReveal();
      };
    }, el);

    return () => {
      ctx.revert();
    };
  }, [reduced]);

  const sp = PLATES[SIGNAL_PLATE];

  return (
    <div
      ref={root}
      className="pointer-events-none absolute top-0 right-0 h-full w-full md:w-[58%]"
      style={{ perspective: 1400, transformStyle: "preserve-3d", opacity: 0.95 }}
      aria-hidden="true"
    >
      {PLATES.map((p, i) => (
        <div
          key={i}
          className={`hp-layer hp-layer-${p.layer} absolute inset-0`}
          style={{ transformStyle: "preserve-3d" }}
        >
          <div className="hp-par absolute inset-0" style={{ transformStyle: "preserve-3d" }}>
            <div
              className="hp-plate absolute"
              style={{
                left: `${p.left}%`,
                top: `${p.top}%`,
                width: `${p.w}%`,
                height: `${p.h}%`,
                border: `1px solid ${p.edge ? "color-mix(in srgb, var(--accent-deep) 75%, transparent)" : "rgba(12,12,13,0.11)"}`,
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.62), rgba(235,232,225,0.22)), repeating-linear-gradient(90deg, rgba(12,12,13,0.045) 0 1px, transparent 1px 44px)",
                boxShadow: "0 30px 60px -40px rgba(12,12,13,0.25)",
              }}
            >
              {/* Lime edge along top edge of each plate that draws over 0.6s */}
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
                fill="none"
                aria-hidden="true"
              >
                <line
                  className="hp-lime-edge"
                  x1="0"
                  y1="0"
                  x2="100%"
                  y2="0"
                  stroke="var(--accent)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>

              {i === SIGNAL_PLATE && (
                <span
                  data-signal="hero-dot"
                  className="hp-signal signal-dot absolute"
                  style={{
                    left: `${sp.left + sp.w / 2}%`,
                    top: `${sp.top + sp.h / 2}%`,
                    marginLeft: -3,
                    marginTop: -3,
                  }}
                >
                  <span
                    className="hp-signal-pulse absolute inset-0 rounded-full"
                    style={{
                      background: "var(--accent)",
                      pointerEvents: "none",
                    }}
                  />
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
      {/* keep the headline side clean */}
      <div
        className="absolute inset-y-0 left-0 w-[45%] max-md:hidden"
        style={{ background: "linear-gradient(90deg, var(--bg) 0%, transparent 100%)", opacity: 0.55 }}
      />
    </div>
  );
}
