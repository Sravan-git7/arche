import { useLayoutEffect, useRef } from "react";
import { gsap, prefersReducedMotion } from "../lib/gsap";
import { hasFinePointer } from "../lib/interact";
import { whenIntroDone } from "./Intro";

/**
 * Hero spatial scene — architectural floor plates seen at an angle.
 *
 * Structure per plate (outer → inner):
 *   .hp-layer  scroll choreography (camera forward + fragmentation)
 *   .hp-par    pointer parallax (differential: far 3px → near 14px)
 *   .hp-plate  entrance from depth + fixed architectural rotation
 *
 * Plates are ordered far → near so the entrance stagger lands the
 * foreground last, which makes depth legible on arrival.
 * CSS 3D only — no WebGL dependency.
 */
type Plate = { w: number; h: number; top: number; left: number; par: number; edge: boolean };

const PLATES: Plate[] = [
  { w: 62, h: 28, top: 14, left: 24, par: 3, edge: false },
  { w: 58, h: 27, top: 22, left: 14, par: 6, edge: true },
  { w: 52, h: 25, top: 36, left: 30, par: 9, edge: false },
  { w: 44, h: 21, top: 51, left: 16, par: 12, edge: true },
  { w: 34, h: 17, top: 64, left: 40, par: 14, edge: false },
];

const SIGNAL_PLATE = 2;

export function HeroEnvironment() {
  const root = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;

    const plates = gsap.utils.toArray<HTMLElement>(".hp-plate", el);
    const pars = gsap.utils.toArray<HTMLElement>(".hp-par", el);
    const layers = gsap.utils.toArray<HTMLElement>(".hp-layer", el);
    const signal = el.querySelector<HTMLElement>(".hp-signal");

    // Architectural angle is owned by GSAP so it composes with z/x tweens.
    gsap.set(plates, { rotationX: 58, rotationZ: -34, transformOrigin: "50% 50%" });

    const reduce = prefersReducedMotion();
    const fine = hasFinePointer();
    if (reduce) return;

    let cleanupPointer = () => {};

    const ctx = gsap.context(() => {
      // Scroll exit — the camera pulls back through the planes.
      // Desktop recedes in Z; mobile substitutes a scale-down (no true 3D).
      // NB: element ref, not a selector — selector strings are scoped to the
      // gsap.context root, so "#hero" (an ancestor) would never resolve.
      const exit = gsap.timeline({
        scrollTrigger: { trigger: el.parentElement, start: "top top", end: "bottom top", scrub: 0.6 },
      });
      exit.to(el, { opacity: 0.15, ease: "none" }, 0);
      if (fine) {
        // (the signal's hand-off to the travelling bridge dot is owned by
        // BridgeDot, on the same trigger, so the two can never both show)
        exit.to(layers, { z: (i: number) => -240 - i * 110, ease: "none" }, 0);
      } else {
        exit.to(el, { scale: 0.88, ease: "none" }, 0);
      }

      if (!fine) return;

      gsap.set(plates, { z: -320, x: 36, opacity: 0 });
      gsap.set(signal, { opacity: 0, scale: 0.4 });

      const entrance = gsap.timeline({ paused: true });
      entrance
        .to(plates, { z: 0, x: 0, opacity: 1, duration: 1.1, ease: "expo.out", stagger: 0.12 })
        .to(signal, { opacity: 1, scale: 1, duration: 0.6, ease: "back.out(2)" }, "-=0.45")
        .to(signal, { y: -6, duration: 2.4, ease: "sine.inOut", yoyo: true, repeat: -1 });

      // Pointer parallax — damped, slight overshoot, differential by depth.
      const xs = pars.map((p) => gsap.quickTo(p, "x", { duration: 0.55, ease: "back.out(1.25)" }));
      const ys = pars.map((p) => gsap.quickTo(p, "y", { duration: 0.55, ease: "back.out(1.25)" }));
      const onMove = (e: PointerEvent) => {
        const nx = (e.clientX / window.innerWidth - 0.5) * 2;
        const ny = (e.clientY / window.innerHeight - 0.5) * 2;
        PLATES.forEach((p, i) => {
          xs[i](nx * p.par);
          ys[i](ny * p.par * 0.6);
        });
      };
      window.addEventListener("pointermove", onMove, { passive: true });
      cleanupPointer = () => window.removeEventListener("pointermove", onMove);

      const cancel = whenIntroDone(() => entrance.play());
      return () => cancel();
    }, el);

    return () => {
      cleanupPointer();
      ctx.revert();
    };
  }, []);

  const sp = PLATES[SIGNAL_PLATE];

  return (
    <div
      ref={root}
      className="pointer-events-none absolute top-0 right-0 h-full w-full md:w-[58%]"
      style={{ perspective: 1400, transformStyle: "preserve-3d", opacity: 0.95 }}
      aria-hidden
    >
      {PLATES.map((p, i) => (
        <div key={i} className="hp-layer absolute inset-0" style={{ transformStyle: "preserve-3d" }}>
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
            />
            {i === SIGNAL_PLATE && (
              <span
                className="hp-signal signal-dot absolute"
                style={{ left: `${sp.left + sp.w / 2}%`, top: `${sp.top + sp.h / 2}%`, marginLeft: -3, marginTop: -3 }}
              />
            )}
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
