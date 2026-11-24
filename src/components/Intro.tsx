import { useEffect, useRef, useState } from "react";
import { gsap, prefersReducedMotion } from "../lib/gsap";
import { getLenis } from "../motion/SmoothScroll";
import { AcMonogram } from "./AcMonogram";

export const INTRO_KEY = "arche_intro";

/** Evaluated dynamically — before the intro marks the session as booted. */
export const isIntroActive = (): boolean => {
  if (typeof window === "undefined") return false;
  try {
    return !sessionStorage.getItem(INTRO_KEY);
  } catch {
    return false;
  }
};

/**
 * ARCHÉ — Dark Obsidian Opening Preloader Curtain with Cinematic Reveal Transition.
 *
 * Visual Architecture:
 * - Solid matte obsidian curtain: fixed inset-0 z-[100] bg-[#0D0E0C] flex flex-col items-center justify-center
 * - Subtle radial #9EE41A ambient glow behind center mark
 * - Center mark: white A + #9EE41A C logo + "Arche Creative Studios" with generous padding & ZERO clipping
 * - Razor-thin 2px #9EE41A progress line filling below
 * - After ~1.0s, smoothly animates obsidian curtain upward (translateY: -100%, 0.8s, ease: 'power4.inOut'),
 *   revealing light-green fluted-glass hero and triggering hero entrance.
 * - pointer-events: none once exited so it never blocks clicks.
 */
export function Intro() {
  const curtainRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(() => isIntroActive());

  useEffect(() => {
    if (!visible) {
      document.documentElement.classList.remove("arche-intro-loading");
      document.body.classList.remove("arche-intro-loading");
      window.dispatchEvent(new CustomEvent("arche:hero-reveal-start", { detail: { isIntroMode: false } }));
      window.dispatchEvent(new CustomEvent("arche:nav-reveal-start"));
      window.dispatchEvent(new CustomEvent("arche:intro-done"));
      return;
    }

    // Set loading class to keep page stable during curtain
    document.documentElement.classList.add("arche-intro-loading");
    document.body.classList.add("arche-intro-loading");

    // Lock scroll with Lenis
    const lockScroll = () => {
      const lenis = getLenis();
      if (lenis) {
        lenis.stop();
      } else {
        setTimeout(() => getLenis()?.stop(), 60);
      }
    };
    lockScroll();

    let cancelled = false;
    let completed = false;
    let tl: gsap.core.Timeline | null = null;

    // Fast-path font readiness check
    const fontsReady = Promise.race([
      typeof document !== "undefined" && document.fonts ? document.fonts.ready : Promise.resolve(),
      new Promise((res) => setTimeout(res, 800)),
    ]);

    fontsReady.then(() => {
      if (cancelled) return;

      const prefersReduced = prefersReducedMotion();
      const curtain = curtainRef.current;
      const content = contentRef.current;
      const bar = progressBarRef.current;
      if (!curtain) return;

      if (prefersReduced) {
        // Immediate exit without animation
        completed = true;
        document.documentElement.classList.remove("arche-intro-loading");
        document.body.classList.remove("arche-intro-loading");
        getLenis()?.start();
        try {
          sessionStorage.setItem(INTRO_KEY, "1");
          sessionStorage.setItem("arche:booted", "1");
        } catch {}
        window.dispatchEvent(new CustomEvent("arche:hero-reveal-start", { detail: { isIntroMode: false } }));
        window.dispatchEvent(new CustomEvent("arche:nav-reveal-start"));
        window.dispatchEvent(new CustomEvent("arche:intro-done"));
        setVisible(false);
        return;
      }

      tl = gsap.timeline({
        onComplete: () => {
          completed = true;
          document.documentElement.classList.remove("arche-intro-loading");
          document.body.classList.remove("arche-intro-loading");
          getLenis()?.start();
          try {
            sessionStorage.setItem(INTRO_KEY, "1");
            sessionStorage.setItem("arche:booted", "1");
          } catch {}
          window.dispatchEvent(new CustomEvent("arche:intro-done"));
          setVisible(false);
        },
      });

      // Initial state
      gsap.set(curtain, { yPercent: 0, opacity: 1, pointerEvents: "auto" });
      gsap.set(content, { opacity: 0, scale: 0.96, y: 8 });
      gsap.set(bar, { scaleX: 0, transformOrigin: "left center" });

      // Step 1: Content fades in and scales smoothly (t0.0 -> 0.45s)
      tl.to(
        content,
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.45,
          ease: "power2.out",
        },
        0.05
      );

      // Step 2: 2px lime progress line fills (t0.1 -> 0.85s)
      tl.to(
        bar,
        {
          scaleX: 1,
          duration: 0.75,
          ease: "power2.inOut",
        },
        0.1
      );

      // Step 3: Logo content gently fades and lifts (t0.95 -> 1.15s)
      tl.to(
        content,
        {
          opacity: 0,
          y: -10,
          duration: 0.22,
          ease: "power2.in",
        },
        0.95
      );

      // Step 4: Solid obsidian curtain slides smoothly upward (t1.05 -> 1.85s, duration: 0.8s, ease: 'power4.inOut')
      tl.to(
        curtain,
        {
          yPercent: -100,
          duration: 0.8,
          ease: "power4.inOut",
          pointerEvents: "none",
        },
        1.05
      );

      // Step 5: Trigger Hero headline entrance while curtain wipes away
      tl.add(() => {
        window.dispatchEvent(new CustomEvent("arche:hero-reveal-start", { detail: { isIntroMode: true } }));
      }, 1.25);

      // Step 6: Trigger Navbar reveal
      tl.add(() => {
        window.dispatchEvent(new CustomEvent("arche:nav-reveal-start"));
      }, 1.45);
    });

    return () => {
      cancelled = true;
      if (!completed) {
        tl?.kill();
      }
      document.documentElement.classList.remove("arche-intro-loading");
      document.body.classList.remove("arche-intro-loading");
      getLenis()?.start();
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      ref={curtainRef}
      data-arche-curtain="true"
      className="fixed inset-0 z-[100] bg-[#0D0E0C] flex flex-col items-center justify-center select-none overflow-hidden"
      style={{
        willChange: "transform",
      }}
      aria-hidden="true"
    >
      {/* Subtle radial #9EE41A ambient glow behind center mark */}
      <div
        className="pointer-events-none absolute w-[480px] h-[480px] rounded-full blur-[100px] opacity-[0.14]"
        style={{
          background: "radial-gradient(circle at center, #9EE41A 0%, rgba(158,228,26,0.3) 45%, transparent 70%)",
        }}
      />

      {/* Centered Brand Mark + Wordmark with generous padding and ZERO overflow-hidden clipping */}
      <div
        ref={contentRef}
        className="relative z-10 flex flex-col items-center justify-center px-6 text-center max-w-full"
      >
        {/* Brand Symbol + Wordmark Row */}
        <div className="flex items-center justify-center gap-3.5 sm:gap-4.5 mb-6">
          {/* Crisp obsidian rounded badge */}
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-[12px] bg-[#141413] flex items-center justify-center shadow-lg border border-[#9EE41A]/35 flex-shrink-0">
            <AcMonogram size={26} onDark={true} />
          </div>

          {/* Wordmark with generous line-height and no clipping */}
          <div className="flex items-center gap-2">
            <span
              className="font-display text-[22px] sm:text-[28px] md:text-[32px] font-bold tracking-[-0.035em] text-[#F4F4EE] whitespace-nowrap"
              style={{ lineHeight: 1.2 }}
            >
              Arche Creative Studios
            </span>
            <span className="h-2 w-2 rounded-full bg-[#9EE41A] shadow-[0_0_8px_#9EE41A] flex-shrink-0" />
          </div>
        </div>

        {/* Razor-thin 2px #9EE41A progress line filling smoothly below */}
        <div className="w-56 sm:w-72 h-[2px] bg-white/10 rounded-full overflow-hidden">
          <div
            ref={progressBarRef}
            className="h-full w-full bg-[#9EE41A] shadow-[0_0_8px_#9EE41A] rounded-full"
          />
        </div>
      </div>
    </div>
  );
}
