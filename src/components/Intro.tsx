import { useEffect, useRef, useState } from "react";
import { gsap, prefersReducedMotion } from "../lib/gsap";
import { getLenis } from "../motion/SmoothScroll";

export const INTRO_KEY = "arche_intro";

/** Evaluated dynamically — before the intro marks the session as booted. */
export const isIntroActive = (): boolean => {
  if (typeof window === "undefined") return false;
  try {
    if (prefersReducedMotion()) return false;
    return !sessionStorage.getItem(INTRO_KEY);
  } catch {
    return false;
  }
};

/**
 * Arche branded intro (once per browser session) — Total about 2.9s.
 * 
 * - t0.0: lock scroll, set loading class on root, wait for document.fonts.ready (1.2s max)
 * - t0.0 to 0.9: centered arch logo mark from header, DrawSVG ease power2.inOut, 2px, paper color, 96px tall
 * - t0.7 to 1.15: lime dot falls 120px with back.out(1.6), squashes to scaleX 1.1 / scaleY 0.9 on impact for 0.1s
 * - t0.9 to 1.5: wordmark "Arche" rises letter by letter from masks (yPercent 120 to 0, stagger 0.045, expo.out)
 * - t1.5 to 1.7: hold
 * - t1.7 to 2.0: logo group moves up 24px and fades out
 * - t1.9 to 2.9: ARCH APERTURE. Growing arch {w, h} anchored at bottom center with top corner radius = w/2 until 60vw, then eased to 0
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

      tl = gsap.timeline({
        defaults: { ease: "none" },
      });

      // Initial states
      gsap.set(".intro-arch-path", { drawSVG: "0%" });
      gsap.set(dotRef.current, { y: -120, opacity: 0, scaleX: 1, scaleY: 1 });
      gsap.set(".intro-char", { yPercent: 120 });
      gsap.set(logoGroup.current, { y: 0, opacity: 1 });

      // t0.0 to 0.9: centered arch logo mark from header, DrawSVG ease power2.inOut, 2px, paper color, 96px tall
      tl.to(
        ".intro-arch-path",
        {
          drawSVG: "100%",
          duration: 0.9,
          ease: "power2.inOut",
        },
        0
      );

      // t0.7 to 1.15: lime dot falls from 120px above to resting position beside wordmark with ease back.out(1.6)
      tl.to(
        dotRef.current,
        {
          y: 0,
          opacity: 1,
          duration: 0.45,
          ease: "back.out(1.6)",
        },
        0.7
      );

      // t1.15 to 1.25: squashes to scaleX 1.1 / scaleY 0.9 on impact for 0.1s
      tl.to(
        dotRef.current,
        {
          scaleX: 1.1,
          scaleY: 0.9,
          duration: 0.05,
          ease: "power1.in",
        },
        1.15
      );
      tl.to(
        dotRef.current,
        {
          scaleX: 1,
          scaleY: 1,
          duration: 0.05,
          ease: "power1.out",
        },
        1.20
      );

      // t0.9 to 1.5: wordmark "Arche" rises letter by letter from masks (yPercent 120 to 0, stagger 0.045, expo.out)
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
        0.9
      );

      // t1.5 to 1.7: hold

      // t1.7 to 2.0: logo group moves up 24px and fades out
      tl.to(
        logoGroup.current,
        {
          y: -24,
          opacity: 0,
          duration: 0.3,
          ease: "power2.in",
        },
        1.7
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
        {/* Arch logo mark from header: same SVG path, 2px stroke, paper color, 96px tall */}
        <svg
          width="96"
          height="96"
          viewBox="0 0 24 24"
          fill="none"
          className="flex-shrink-0"
          style={{ overflow: "visible" }}
          aria-hidden="true"
        >
          <path
            className="intro-arch-path"
            d="M3 21V12.5C3 7.25 7.03 3 12 3C16.97 3 21 7.25 21 12.5V21"
            stroke="var(--solid-fg)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            className="intro-arch-path"
            d="M9 21v-8.5C9 10.57 10.34 9 12 9s3 1.57 3 3.5V21"
            stroke="var(--solid-fg)"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>

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