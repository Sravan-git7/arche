import { useLayoutEffect, useRef, type CSSProperties } from "react";
import { gsap, prefersReducedMotion } from "../lib/gsap";

/** Deterministic scatter so the composition is identical on every visit. */
const scatter = (i: number, n: number, k: number) => ({
  x: ((i - (n - 1) / 2) * 38 + (((i * 73) % 60) - 30)) * k,
  y: (i % 2 ? 1 : -1) * (50 + ((i * 41) % 90)) * k,
  rotation: ((i * 53) % 50) - 25,
});

/**
 * Scroll-scrubbed kinetic word.
 *  scatter  → the word breaks apart as it leaves  (FRAGMENTED)
 *  assemble → letters converge into the word      (CONNECTED)
 * Reserved for major transitions only.
 */
export function KineticWord({
  word,
  mode,
  className,
  style,
}: {
  word: string;
  mode: "scatter" | "assemble";
  className?: string;
  style?: CSSProperties;
}) {
  const root = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    if (!root.current || prefersReducedMotion()) return;
    const k = window.matchMedia("(min-width: 900px)").matches ? 1 : 0.42;
    const ctx = gsap.context(() => {
      const ls = gsap.utils.toArray<HTMLElement>(".kw-l");
      const n = ls.length;
      const off = {
        x: (i: number) => scatter(i, n, k).x,
        y: (i: number) => scatter(i, n, k).y,
        rotation: (i: number) => scatter(i, n, k).rotation,
        opacity: 0.12,
        filter: "blur(3px)",
      };
      const on = { x: 0, y: 0, rotation: 0, opacity: 1, filter: "blur(0px)" };
      if (mode === "assemble") {
        gsap.fromTo(ls, off, {
          ...on,
          ease: "none",
          stagger: { each: 0.02, from: "edges" },
          scrollTrigger: { trigger: root.current, start: "top 92%", end: "top 40%", scrub: 0.8 },
        });
      } else {
        gsap.fromTo(ls, on, {
          ...off,
          ease: "none",
          stagger: { each: 0.02, from: "center" },
          scrollTrigger: { trigger: root.current, start: "top 55%", end: "bottom top", scrub: 0.8 },
        });
      }
    }, root);
    return () => ctx.revert();
  }, [mode]);

  return (
    <span ref={root} className={className} style={style} aria-label={word}>
      {word.split("").map((c, i) => (
        <span key={i} className="kw-l inline-block" aria-hidden>
          {c}
        </span>
      ))}
    </span>
  );
}

const TAGS = [
  { t: "Email", x: -430, y: -150 },
  { t: "Website", x: 400, y: -170 },
  { t: "CRM", x: -380, y: 150 },
  { t: "Content", x: 440, y: 130 },
  { t: "Leads", x: -90, y: -225 },
  { t: "Tools", x: 150, y: 215 },
];

/**
 * Hero → Problem bridge. The organised system from the hero breaks into
 * the separate tools most businesses actually run on.
 */
export function FragmentBand() {
  const root = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    if (!root.current || prefersReducedMotion()) return;
    const k = window.matchMedia("(min-width: 900px)").matches ? 1 : 0.4;
    const ctx = gsap.context(() => {
      gsap.set(".fb-t", { xPercent: -50, yPercent: -50 });
      // .fb-dot is an invisible anchor — the travelling hero dot lands on it
      // and performs the release, so only one dot ever exists on screen.
      gsap
        .timeline({ scrollTrigger: { trigger: root.current, start: "center center", end: "bottom 25%", scrub: 0.8 } })
        .fromTo(
          ".fb-t",
          { x: 0, y: 0, opacity: 0, scale: 0.85 },
          { x: (i: number) => TAGS[i].x * k, y: (i: number) => TAGS[i].y * k, opacity: 1, scale: 1, ease: "none" },
          0.1
        );
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} className="fb-band relative flex min-h-[70vh] w-full items-center justify-center overflow-hidden">
      {/* z-3 keeps the letterforms in front of the travelling signal dot (z-2),
          so it passes behind the word and settles in the clear space below. */}
      <div className="relative z-[3] flex flex-col items-center">
        <KineticWord
          word="FRAGMENTED"
          mode="scatter"
          className="block select-none"
          style={{ fontSize: "clamp(48px,12.5vw,200px)", fontWeight: 600, letterSpacing: "-0.055em", lineHeight: 0.9 }}
        />
        {TAGS.map((t) => (
          <span
            key={t.t}
            className="fb-t mono mono-fg absolute top-1/2 left-1/2 rounded-full border px-[12px] py-[6px]"
            style={{ borderColor: "var(--line)", background: "var(--card)", opacity: 0 }}
          >
            {t.t}
          </span>
        ))}
        <span className="fb-dot signal-dot absolute -bottom-[34px] left-1/2 -ml-[3px]" style={{ opacity: 0 }} />
      </div>
      <p className="mono absolute bottom-[9%] left-1/2 -translate-x-1/2 whitespace-nowrap">How most businesses actually run.</p>
    </section>
  );
}
