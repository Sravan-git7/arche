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

// Exact vector geometry extracted from arche logo
const PATH_A =
  "M 127 9 L 119 5 L 105 2 L 97 2 L 83 5 L 67 14 L 56 25 L 48 37 L 39 57 L 34 74 L 3 231 L 40 231 L 44 229 L 47 225 L 57 191 L 64 176 L 75 164 L 92 156 L 110 154 L 123 150 L 130 146 L 133 147 L 144 177 L 153 191 L 153 147 L 148 136 L 148 134 L 153 129 L 153 93 L 150 101 L 141 114 L 137 108 L 120 65 L 112 57 L 100 54 L 94 55 L 87 59 L 83 63 L 78 72 L 41 181 L 32 211 L 26 211 L 27 200 L 55 67 L 64 46 L 71 36 L 80 27 L 93 21 L 109 21 L 121 27 L 129 35 L 138 48 L 146 65 L 153 86 L 153 38 L 142 22 Z M 102 73 L 108 82 L 125 128 L 114 134 L 100 137 L 92 137 L 81 141 L 75 141 L 95 79 L 99 73 Z";

const PATH_C =
  "M 153 147 L 154 193 L 174 213 L 187 221 L 206 228 L 224 231 L 237 231 L 250 229 L 265 224 L 277 218 L 294 205 L 301 197 L 306 187 L 307 177 L 303 165 L 294 156 L 283 152 L 274 152 L 264 156 L 251 168 L 242 173 L 230 175 L 215 171 L 204 162 L 198 153 L 180 104 L 178 102 L 169 117 L 167 123 L 181 161 L 189 173 L 197 181 L 216 191 L 236 193 L 247 191 L 256 187 L 268 178 L 271 174 L 280 170 L 284 172 L 288 177 L 287 185 L 276 196 L 266 203 L 249 210 L 240 212 L 219 212 L 210 210 L 193 203 L 173 187 L 163 173 Z M 153 38 L 153 86 L 155 90 L 153 93 L 153 129 L 160 120 L 176 92 L 192 75 L 206 66 L 226 60 L 248 61 L 268 69 L 275 74 L 287 87 L 287 97 L 284 100 L 277 102 L 253 84 L 240 80 L 221 80 L 204 87 L 194 95 L 192 99 L 192 104 L 196 109 L 205 110 L 213 103 L 221 99 L 237 98 L 249 103 L 261 114 L 268 118 L 275 120 L 283 120 L 290 118 L 298 113 L 305 103 L 307 89 L 302 76 L 286 59 L 268 48 L 247 42 L 217 43 L 201 48 L 189 54 L 179 61 L 168 72 L 163 58 Z M 274 37 L 291 47 L 306 62 L 306 37 Z";

/**
 * ARCHÉ — Signature 3-Beat Monogram Brand Choreography Preloader (Zero Loading Bar).
 *
 * Choreography Architecture:
 * - Stage: Full-screen deep obsidian-cypress curtain (#0A0D09) with a subtle radial #9EE41A ambient studio glow (0.08 opacity).
 * - Beat 1 (0.00s -> 0.45s) — A Animates First:
 *   AC badge is centered in the viewport. White A stroke draws smoothly (strokeDashoffset: lenA -> 0, 0.45s, ease: 'power2.inOut')
 *   with subtle scale(0.92 -> 1). Fill opacity fades in seamlessly as stroke completes.
 * - Beat 2 (0.38s -> 0.78s) — C Animates Right After A:
 *   Lime C stroke draws (strokeDashoffset: lenC -> 0, 0.40s, ease: 'power2.out').
 *   Center #9EE41A dot springs in with lively elastic bounce (scale: 0 -> 1, 0.28s, ease: 'back.out(2)').
 * - Beat 3 (0.78s -> 1.35s) — Horizontal Text Reveal:
 *   Lockup smoothly glides from badge-centered to full-lockup centered while "Arche Creative Studios" wipes into view
 *   horizontally from left to right (clip-path: inset(-8px 100% -8px -8px) -> inset(-8px -8px -8px -8px), 0.55s, ease: 'power3.out'),
 *   paired with subtle trailing lime dot springing in (1.15s, ease: 'back.out(2)'). Zero font clipping.
 * - Beat 4 (1.65s -> 2.37s) — Cinematic Curtain Exit:
 *   Obsidian curtain sweeps smoothly upward (yPercent: -100, 0.72s, ease: 'power4.inOut').
 *   Dispatches 'arche:hero-reveal-start' at 1.65s and 'arche:nav-reveal-start' at 1.75s to begin hero and nav entrances.
 */
export function Intro() {
  const curtainRef = useRef<HTMLDivElement>(null);
  const lockupRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const pathARef = useRef<SVGPathElement>(null);
  const pathCRef = useRef<SVGPathElement>(null);
  const centerDotRef = useRef<SVGCircleElement>(null);
  const textWrapRef = useRef<HTMLDivElement>(null);
  const trailingDotRef = useRef<HTMLSpanElement>(null);

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
      const lockup = lockupRef.current;
      const badge = badgeRef.current;
      const pathA = pathARef.current;
      const pathC = pathCRef.current;
      const centerDot = centerDotRef.current;
      const textWrap = textWrapRef.current;
      const trailingDot = trailingDotRef.current;

      if (!curtain || !lockup || !badge || !pathA || !pathC || !centerDot || !textWrap || !trailingDot) {
        return;
      }

      if (prefersReduced) {
        // Immediate clean exit without motion
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

      // Compute exact offset to center badge horizontally at t = 0
      const textWidth = textWrap.getBoundingClientRect().width || 0;
      const centerOffset = textWidth / 2;

      // Measure SVG path lengths for smooth stroke-dashoffset animation
      const lenA = pathA.getTotalLength ? pathA.getTotalLength() : 800;
      const lenC = pathC.getTotalLength ? pathC.getTotalLength() : 900;

      // Initial state
      gsap.set(curtain, { yPercent: 0, opacity: 1, pointerEvents: "auto" });
      gsap.set(lockup, { x: centerOffset });
      gsap.set(badge, { scale: 0.92, transformOrigin: "center center" });

      gsap.set(pathA, {
        strokeDasharray: lenA,
        strokeDashoffset: lenA,
        fillOpacity: 0,
      });
      gsap.set(pathC, {
        strokeDasharray: lenC,
        strokeDashoffset: lenC,
        fillOpacity: 0,
      });
      gsap.set(centerDot, {
        scale: 0,
        transformOrigin: "213.5px 132.7px",
      });

      gsap.set(textWrap, {
        clipPath: "inset(-8px 100% -8px -8px)",
        x: -16,
      });
      gsap.set(trailingDot, {
        scale: 0,
        transformOrigin: "center center",
      });

      tl = gsap.timeline({
        onComplete: () => {
          completed = true;
          delete (window as unknown as { __arche_intro_tl?: gsap.core.Timeline }).__arche_intro_tl;
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

      // Expose timeline reference for deterministic verification
      (window as unknown as { __arche_intro_tl?: gsap.core.Timeline }).__arche_intro_tl = tl;

      // =========================================================================
      // BEAT 1 (0.00s -> 0.45s) — A Animates First
      // AC mark is dead-center. White A stroke draws smoothly with subtle scale.
      // =========================================================================
      tl.to(
        pathA,
        {
          strokeDashoffset: 0,
          duration: 0.45,
          ease: "power2.inOut",
        },
        0.0
      );
      tl.to(
        badge,
        {
          scale: 1,
          duration: 0.45,
          ease: "power2.out",
        },
        0.0
      );
      tl.to(
        pathA,
        {
          fillOpacity: 1,
          duration: 0.18,
          ease: "power1.inOut",
        },
        0.28
      );

      // =========================================================================
      // BEAT 2 (0.38s -> 0.78s) — C Animates Right After A
      // Lime C stroke draws followed by center lime dot elastic micro-spring.
      // =========================================================================
      tl.to(
        pathC,
        {
          strokeDashoffset: 0,
          duration: 0.4,
          ease: "power2.out",
        },
        0.38
      );
      tl.to(
        pathC,
        {
          fillOpacity: 1,
          duration: 0.18,
          ease: "power1.inOut",
        },
        0.54
      );
      tl.to(
        centerDot,
        {
          scale: 1,
          duration: 0.28,
          ease: "back.out(2)",
        },
        0.62
      );

      // =========================================================================
      // BEAT 3 (0.78s -> 1.35s) — Horizontal Text Reveal
      // Lockup smoothly glides left to center the full mark + wordmark.
      // Wordmark wipes horizontally from left-to-right with ZERO glyph clipping.
      // Trailing lime dot pops in with elastic bounce.
      // =========================================================================
      tl.to(
        lockup,
        {
          x: 0,
          duration: 0.55,
          ease: "power3.out",
        },
        0.78
      );
      tl.to(
        textWrap,
        {
          clipPath: "inset(-8px -8px -8px -8px)",
          x: 0,
          duration: 0.55,
          ease: "power3.out",
        },
        0.78
      );
      tl.to(
        trailingDot,
        {
          scale: 1,
          duration: 0.3,
          ease: "back.out(2)",
        },
        1.15
      );

      // =========================================================================
      // BEAT 4 (1.65s -> 2.37s) — Cinematic Curtain Exit
      // Deep obsidian curtain sweeps smoothly upward revealing the lit stage.
      // Synchronized events dispatch for Hero and Navbar entrance choreography.
      // =========================================================================
      tl.to(
        curtain,
        {
          yPercent: -100,
          duration: 0.72,
          ease: "power4.inOut",
          pointerEvents: "none",
        },
        1.65
      );

      // Dispatch hero reveal at 1.65s
      tl.add(() => {
        window.dispatchEvent(
          new CustomEvent("arche:hero-reveal-start", { detail: { isIntroMode: true } })
        );
      }, 1.65);

      // Dispatch navbar reveal at 1.75s
      tl.add(() => {
        window.dispatchEvent(new CustomEvent("arche:nav-reveal-start"));
      }, 1.75);
    });

    return () => {
      cancelled = true;
      delete (window as unknown as { __arche_intro_tl?: gsap.core.Timeline }).__arche_intro_tl;
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
      className="fixed inset-0 z-[100] bg-[#0A0D09] flex items-center justify-center select-none overflow-hidden"
      style={{
        willChange: "transform",
      }}
      aria-hidden="true"
    >
      {/* Subtle radial #9EE41A ambient studio glow behind center mark */}
      <div
        className="pointer-events-none absolute w-[460px] sm:w-[560px] h-[460px] sm:h-[560px] rounded-full blur-[100px] opacity-[0.08]"
        style={{
          background: "radial-gradient(circle at center, #9EE41A 0%, rgba(158,228,26,0.3) 45%, transparent 70%)",
        }}
      />

      {/* Lockup Row: Badge + Wordmark Reveal (Zero horizontal progress bar) */}
      <div className="relative z-10 flex items-center justify-center px-4 max-w-full">
        <div
          ref={lockupRef}
          className="flex items-center"
          style={{ willChange: "transform" }}
        >
          {/* Crisp obsidian rounded badge holding the animated AC monogram */}
          <div
            ref={badgeRef}
            className="w-11 h-11 sm:w-13 sm:h-13 md:w-14 md:h-14 rounded-[12px] sm:rounded-[14px] bg-[#141413] flex items-center justify-center shadow-2xl border border-[#9EE41A]/30 flex-shrink-0 select-none"
            style={{ willChange: "transform" }}
          >
            <svg
              viewBox="0 0 310 234"
              className="w-7 h-[21px] sm:w-8 sm:h-6 md:w-9 md:h-[27px] overflow-visible"
              fill="none"
              aria-label="Arche Monogram"
            >
              {/* Stroke + Fill for Letter A */}
              <path
                ref={pathARef}
                d={PATH_A}
                fill="#F4F4EE"
                stroke="#FFFFFF"
                strokeWidth={9}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Stroke + Fill for Letter C */}
              <path
                ref={pathCRef}
                d={PATH_C}
                fill="#9EE41A"
                stroke="#9EE41A"
                strokeWidth={9}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Center dot inside C arc */}
              <circle
                ref={centerDotRef}
                cx={213.5}
                cy={132.7}
                r={11}
                fill="#9EE41A"
              />
            </svg>
          </div>

          {/* Horizontal Text Reveal: Wipes in cleanly from left to right with ZERO bottom clipping */}
          <div
            ref={textWrapRef}
            className="flex items-center pl-3 sm:pl-3.5 md:pl-4 py-2 overflow-visible select-none"
            style={{ willChange: "clip-path, transform" }}
          >
            <span
              className="font-display text-[20px] sm:text-[26px] md:text-[30px] font-bold tracking-[-0.035em] text-[#F4F4EE] whitespace-nowrap leading-[1.25]"
            >
              Arche Creative Studios
            </span>
            <span
              ref={trailingDotRef}
              className="ml-2 sm:ml-2.5 md:ml-3 h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-[#9EE41A] shadow-[0_0_8px_#9EE41A] flex-shrink-0"
              style={{ willChange: "transform" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
