import { useEffect, useRef, useState } from "react";
import { Wordmark } from "./Wordmark";
import { gsap, prefersReducedMotion } from "../lib/gsap";

/** Evaluated once at module load — before the intro marks the session as booted. */
export const INTRO_ACTIVE: boolean = (() => {
  try {
    return !sessionStorage.getItem("arche:booted");
  } catch {
    return true;
  }
})();

let introFinished = false;

const finishIntro = () => {
  introFinished = true;
  window.dispatchEvent(new Event("arche:intro-done"));
};

/** Run `fn` once the boot sequence has handed off (or immediately if none). */
export function whenIntroDone(fn: () => void): () => void {
  let ran = false;
  const run = () => {
    if (ran) return;
    ran = true;
    fn();
  };
  if (!INTRO_ACTIVE || introFinished) {
    const t = window.setTimeout(run, 40);
    return () => window.clearTimeout(t);
  }
  window.addEventListener("arche:intro-done", run, { once: true });
  const failsafe = window.setTimeout(run, 2800);
  return () => {
    window.removeEventListener("arche:intro-done", run);
    window.clearTimeout(failsafe);
  };
}

/**
 * Lightweight boot sequence. It runs once per browser session, lasts ~1.6s,
 * and uses only SVG/DOM transforms: fragment -> connection -> stable system.
 */
export function Intro() {
  const root = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(INTRO_ACTIVE);

  useEffect(() => {
    if (!visible) return;
    try {
      sessionStorage.setItem("arche:booted", "1");
    } catch {
      /* storage unavailable */
    }

    if (prefersReducedMotion()) {
      const t = window.setTimeout(() => {
        setVisible(false);
        finishIntro();
      }, 250);
      return () => window.clearTimeout(t);
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: () => {
          setVisible(false);
          finishIntro();
        },
      });
      tl.set(".boot-node", { opacity: 0, scale: 0, transformOrigin: "50% 50%" })
        .set(".boot-line", { scaleX: 0, transformOrigin: "left center" })
        .set(".boot-mark", { opacity: 0, filter: "blur(8px)", scale: 0.96 })
        .to(".boot-node", { opacity: 1, scale: 1, duration: 0.35, stagger: 0.07, ease: "back.out(2)" })
        .to(".boot-line", { scaleX: 1, duration: 0.45, stagger: 0.06, ease: "power2.inOut" }, "-=0.12")
        .to(".boot-mark", { opacity: 1, filter: "blur(0px)", scale: 1, duration: 0.5, ease: "power3.out" }, "-=0.25")
        .to(".boot-status", { opacity: 1, duration: 0.2 }, "-=0.1")
        .to(root.current, { clipPath: "inset(0 0 100% 0)", duration: 0.65, ease: "power4.inOut", delay: 0.2 });
    }, root);

    return () => ctx.revert();
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      ref={root}
      className="fixed inset-0 z-[10000] grid place-items-center overflow-hidden"
      style={{ background: "#0c0c0d", color: "#f4f2ed", clipPath: "inset(0 0 0% 0)" }}
      aria-hidden
    >
      <div className="relative grid h-[210px] w-[330px] place-items-center">
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 330 210" fill="none">
          <line className="boot-line" x1="38" y1="42" x2="165" y2="105" stroke="#c8f14f" strokeOpacity=".65" />
          <line className="boot-line" x1="292" y1="42" x2="165" y2="105" stroke="#c8f14f" strokeOpacity=".65" />
          <line className="boot-line" x1="48" y1="174" x2="165" y2="105" stroke="#c8f14f" strokeOpacity=".65" />
          <line className="boot-line" x1="282" y1="174" x2="165" y2="105" stroke="#c8f14f" strokeOpacity=".65" />
          {[
            [38, 42],
            [292, 42],
            [48, 174],
            [282, 174],
            [165, 105],
          ].map(([x, y], i) => (
            <circle key={i} className="boot-node" cx={x} cy={y} r={i === 4 ? 5 : 3} fill={i === 4 ? "#c8f14f" : "#f4f2ed"} />
          ))}
        </svg>
        <div className="boot-mark relative z-[2]">
          <Wordmark size={28} />
        </div>
        <p className="boot-status mono absolute bottom-0 opacity-0" style={{ color: "rgba(244,242,237,.55)" }}>
          System ready
        </p>
      </div>
    </div>
  );
}