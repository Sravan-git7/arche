import { useEffect, useRef, useState } from "react";
import { gsap, prefersReducedMotion } from "../lib/gsap";
import { getLenis } from "../motion/SmoothScroll";

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
 * Arche branded intro (once per browser session) — Total about 2.9s.
 * 
 * - t0.0: lock scroll, set loading class on root, wait for document.fonts.ready (1.2s max)
 * - Monogram animation order (strict sequence):
 *     1. A appears first (t0.0 -> t0.45) via left-to-right reveal
 *     2. C appears second (t0.48 -> t0.88) after A is established, sweeping in
 *     3. Central lime dot appears last (t0.90 -> t1.10) after C is complete
 * - t0.95 to 1.45: wordmark "Arche" rises letter by letter from masks
 * - t1.15 to 1.35: accent square settles
 * - t1.65 to 1.95: logo group moves up 24px and fades out
 * - t1.9 to 2.9: ARCH APERTURE (page reveal)
 * - t2.2: Hero reveal starts (event: arche:hero-reveal-start)
 * - t2.4: Nav fades in (event: arche:nav-reveal-start)
 */
export function Intro() {
  const root = useRef<HTMLDivElement>(null);
  const logoGroup = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLSpanElement>(null);
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

    // Set loading class on root to keep page background ink and page content hidden
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

    // Wait for document.fonts.ready with a 1.2s timeout
    const fontsReady = Promise.race([
      typeof document !== "undefined" && document.fonts ? document.fonts.ready : Promise.resolve(),
      new Promise((res) => setTimeout(res, 1200)),
    ]);

    fontsReady.then(() => {
      if (cancelled) return;

      const heroWrapper = document.getElementById("hero-aperture-wrap") || document.getElementById("hero");
      const aperture = { w: 0, h: 0 };

      const updateAperture = () => {
        if (!heroWrapper) return;
        const W = window.innerWidth;
        const H = window.innerHeight;
        const curW = aperture.w;
        const curH = aperture.h;
        const topInset = Math.max(0, H - curH);
        const sideInset = Math.max(0, (W - curW) / 2);
        const threshold = 0.6 * W;
        let r = 0;
        if (curW < threshold) {
          r = curW / 2;
        } else {
          const maxR = threshold / 2;
          const p = Math.min(1, Math.max(0, (curW - threshold) / (W - threshold || 1)));
          r = maxR * (1 - p);
        }
        heroWrapper.style.clipPath = `inset(${topInset.toFixed(1)}px ${sideInset.toFixed(1)}px 0px ${sideInset.toFixed(1)}px round ${r.toFixed(1)}px ${r.toFixed(1)}px 0px 0px)`;
      };

      if (heroWrapper) {
        heroWrapper.style.willChange = "clip-path";
        updateAperture();
      }

      const prefersReduced = prefersReducedMotion();

      tl = gsap.timeline({
        defaults: { ease: "none" },
      });
      if (typeof window !== "undefined") {
        (window as any).__archeIntroTl = tl;
      }

      if (prefersReduced) {
        // Reduced motion: show complete static logo immediately without animation delay
        gsap.set(".intro-layer-full", { opacity: 1 });
        gsap.set(".intro-layer-a", { opacity: 0 });
        gsap.set(".intro-layer-c", { opacity: 0 });
        gsap.set(".intro-layer-dot", { opacity: 0 });
        gsap.set(".intro-char", { yPercent: 0 });
        gsap.set(dotRef.current, { y: 0, opacity: 1, scale: 1 });
        gsap.set(logoGroup.current, { y: 0, opacity: 1 });

        tl.to(
          logoGroup.current,
          {
            opacity: 0,
            duration: 0.3,
            ease: "power2.in",
          },
          0.6
        );

        tl.to(
          aperture,
          {
            w: () => window.innerWidth,
            h: () => window.innerHeight,
            duration: 0.8,
            ease: "power2.inOut",
            onUpdate: updateAperture,
            onComplete: () => {
              completed = true;
              if (heroWrapper) {
                heroWrapper.style.clipPath = "";
                heroWrapper.style.removeProperty("clip-path");
                heroWrapper.style.willChange = "";
              }
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
          },
          0.7
        );

        tl.add(() => {
          window.dispatchEvent(new CustomEvent("arche:hero-reveal-start", { detail: { isIntroMode: true } }));
        }, 0.9);

        tl.add(() => {
          window.dispatchEvent(new CustomEvent("arche:nav-reveal-start"));
        }, 1.1);

        return;
      }

      // Initial states for sequential pixel reveal of original artwork:
      // 1. Reveal A smoothly first
      // 2. Once A is established, reveal C in its exact position and overlap
      // 3. Reveal central lime dot last, along with any remaining source detail
      gsap.set(".intro-layer-a", { opacity: 0, clipPath: "polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)" });
      gsap.set(".intro-layer-c", { opacity: 0, clipPath: "polygon(50.14% 0%, 50.14% 0%, 50.14% 100%, 50.14% 100%)" });
      gsap.set(".intro-layer-dot", { opacity: 0, scale: 0, transformOrigin: "69.25% 56.65%" });
      gsap.set(".intro-layer-full", { opacity: 0 });
      gsap.set(dotRef.current, { y: -120, opacity: 0, scaleX: 1, scaleY: 1 });
      gsap.set(".intro-char", { yPercent: 120 });
      gsap.set(logoGroup.current, { y: 0, opacity: 1 });

      // Step 1: t0.0 to 0.45 — Reveal A smoothly first (wipe left-to-right across A's pixels)
      tl.to(
        ".intro-layer-a",
        {
          opacity: 1,
          clipPath: "polygon(0% 0%, 50.14% 0%, 50.14% 100%, 0% 100%)",
          duration: 0.45,
          ease: "power2.out",
        },
        0.0
      );

      // Step 2: t0.48 to 0.88 — Once A is established, reveal C in its exact position and overlap
      tl.to(
        ".intro-layer-c",
        {
          opacity: 1,
          clipPath: "polygon(50.14% 0%, 100% 0%, 100% 100%, 50.14% 100%)",
          duration: 0.40,
          ease: "power2.out",
        },
        0.48
      );

      // Step 3: t0.90 to 1.10 — Reveal central lime dot last (along with remaining source detail)
      tl.to(
        ".intro-layer-dot",
        {
          opacity: 1,
          scale: 1,
          duration: 0.20,
          ease: "back.out(2.4)",
        },
        0.90
      );

      // Final complete state: at t1.12, reveal the complete unmasked source artwork
      tl.to(
        ".intro-layer-full",
        {
          opacity: 1,
          duration: 0.05,
        },
        1.12
      );

      // t0.95 to 1.42: wordmark "Arche" rises letter by letter from masks (yPercent 120 to 0, stagger 0.045, expo.out)
      tl.fromTo(
        ".intro-char",
        {
          yPercent: 120,
        },
        {
          yPercent: 0,
          duration: 0.42,
          stagger: 0.045,
          ease: "expo.out",
        },
        0.95
      );

      // t1.15 to 1.35: trailing wordmark accent square settles beside wordmark
      tl.to(
        dotRef.current,
        {
          y: 0,
          opacity: 1,
          duration: 0.35,
          ease: "back.out(1.6)",
        },
        1.15
      );

      // t1.65 to 1.95: logo group moves up 24px and fades out
      tl.to(
        logoGroup.current,
        {
          y: -24,
          opacity: 0,
          duration: 0.3,
          ease: "power2.in",
        },
        1.65
      );

      // t1.9 to 2.9: ARCH APERTURE
      tl.to(
        aperture,
        {
          w: () => window.innerWidth,
          h: () => window.innerHeight,
          duration: 1.0,
          ease: "power4.inOut",
          onUpdate: updateAperture,
          onComplete: () => {
            completed = true;
            if (heroWrapper) {
              heroWrapper.style.clipPath = "";
              heroWrapper.style.removeProperty("clip-path");
              heroWrapper.style.willChange = "";
            }
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
        },
        1.9
      );

      // t2.2: Hero reveal starts during aperture
      tl.add(() => {
        window.dispatchEvent(new CustomEvent("arche:hero-reveal-start", { detail: { isIntroMode: true } }));
      }, 2.2);

      // t2.4: Nav fades in
      tl.add(() => {
        window.dispatchEvent(new CustomEvent("arche:nav-reveal-start"));
      }, 2.4);
    });

    return () => {
      cancelled = true;
      if (!completed) {
        tl?.kill();
        const heroWrapper = document.getElementById("hero-aperture-wrap") || document.getElementById("hero");
        if (heroWrapper) {
          heroWrapper.style.clipPath = "";
          heroWrapper.style.removeProperty("clip-path");
          heroWrapper.style.willChange = "";
        }
      }
      document.documentElement.classList.remove("arche-intro-loading");
      document.body.classList.remove("arche-intro-loading");
      getLenis()?.start();
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      ref={root}
      className="fixed inset-0 z-[10000] grid place-items-center overflow-hidden pointer-events-none"
      style={{
        background: "transparent",
        color: "var(--solid-fg)",
      }}
      aria-hidden="true"
    >
      <div
        ref={logoGroup}
        className="relative flex items-center justify-center gap-[clamp(10px,2vw,18px)] select-none px-4"
        style={{ transformOrigin: "50% 50%" }}
      >
        {/* Exact AC Monogram from source artwork public/arche logo.jpeg with sequential pixel reveal */}
        <div
          className="intro-ac-monogram relative select-none flex-shrink-0"
          style={{
            width: Math.round(88 * 1.1854),
            height: 88,
          }}
        >
          {/* Layer 1: Monogram A (left half: x <= 50.14%) */}
          <div
            className="intro-layer-a absolute inset-0 overflow-hidden"
            style={{
              clipPath: "polygon(0% 0%, 50.14% 0%, 50.14% 100%, 0% 100%)",
            }}
          >
            <img
              src="/arche%20logo.jpeg"
              alt="Arche AC Monogram - Layer A"
              className="absolute pointer-events-none max-w-none"
              style={{
                width: `${(2048 / 1400) * 100}%`,
                height: "auto",
                left: `${(-368 / 1400) * 100}%`,
                top: `${(-429 / 1400) * 100}%`,
                mixBlendMode: "screen",
              }}
            />
          </div>

          {/* Layer 2: Monogram C (right half: x >= 50.14%, excluding central lime dot) */}
          <div
            className="intro-layer-c absolute inset-0 overflow-hidden"
            style={{
              clipPath: "polygon(50.14% 0%, 100% 0%, 100% 100%, 50.14% 100%)",
              WebkitMaskImage: "radial-gradient(circle 8px at 69.25% 56.65%, transparent 95%, black 100%)",
              maskImage: "radial-gradient(circle 8px at 69.25% 56.65%, transparent 95%, black 100%)",
            }}
          >
            <img
              src="/arche%20logo.jpeg"
              alt="Arche AC Monogram - Layer C"
              className="absolute pointer-events-none max-w-none"
              style={{
                width: `${(2048 / 1400) * 100}%`,
                height: "auto",
                left: `${(-368 / 1400) * 100}%`,
                top: `${(-429 / 1400) * 100}%`,
                mixBlendMode: "screen",
              }}
            />
          </div>

          {/* Layer 3: Central lime dot and remaining source detail (revealed last) */}
          <div
            className="intro-layer-dot absolute inset-0 overflow-hidden"
            style={{
              clipPath: "circle(6% at 69.25% 56.65%)",
            }}
          >
            <img
              src="/arche%20logo.jpeg"
              alt="Arche AC Monogram - Central Dot"
              className="absolute pointer-events-none max-w-none"
              style={{
                width: `${(2048 / 1400) * 100}%`,
                height: "auto",
                left: `${(-368 / 1400) * 100}%`,
                top: `${(-429 / 1400) * 100}%`,
                mixBlendMode: "screen",
              }}
            />
          </div>

          {/* Layer 4: Complete static source artwork, visible upon animation completion or for reduced motion */}
          <div
            className="intro-layer-full absolute inset-0 overflow-hidden"
            style={{ opacity: prefersReducedMotion() ? 1 : 0 }}
          >
            <img
              src="/arche%20logo.jpeg"
              alt="Arche AC Monogram - Complete"
              className="absolute pointer-events-none max-w-none"
              style={{
                width: `${(2048 / 1400) * 100}%`,
                height: "auto",
                left: `${(-368 / 1400) * 100}%`,
                top: `${(-429 / 1400) * 100}%`,
                mixBlendMode: "screen",
              }}
            />
          </div>
        </div>

        {/* Wordmark "Arche" and falling lime dot */}
        <div className="flex items-baseline gap-[clamp(6px,1.2vw,12px)]">
          <span
            className="inline-flex items-baseline"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(64px, 8.5vw, 100px)",
              fontWeight: 600,
              letterSpacing: "-0.05em",
              lineHeight: 1,
              color: "var(--solid-fg)",
            }}
          >
            {["A", "r", "c", "h", "e"].map((char, i) => (
              <span key={i} className="inline-block overflow-hidden" style={{ verticalAlign: "bottom" }}>
                <span className="intro-char inline-block">
                  {char}
                </span>
              </span>
            ))}
          </span>

          {/* Lime dot falling from 120px above with squash */}
          <span
            ref={dotRef}
            className="intro-dot inline-block flex-shrink-0"
            style={{
              width: 10,
              height: 10,
              background: "var(--accent)",
              alignSelf: "flex-start",
              marginTop: 10,
              transformOrigin: "50% 100%",
              opacity: 0,
            }}
          />
        </div>
      </div>
    </div>
  );
}