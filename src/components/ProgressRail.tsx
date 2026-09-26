import { useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger } from "../lib/gsap";

/**
 * PROMPT 32 (Delight 1) — Living Chapter Scroll Progress Indicator.
 * "Where am I?" — chapter indicator with active living in-section
 * scroll progress bar + micro runner dot that dynamically advances
 * as the visitor scrolls through each chapter.
 */
export function ProgressRail() {
  const [idx, setIdx] = useState(0);
  const [labels, setLabels] = useState<string[]>([]);
  const [sectionProgress, setSectionProgress] = useState(0);
  const bar = useRef<HTMLSpanElement>(null);
  const microDot = useRef<HTMLSpanElement>(null);
  const microBar = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let triggers: ScrollTrigger[] = [];
    const t = window.setTimeout(() => {
      const els = Array.from(document.querySelectorAll<HTMLElement>("[data-chapter]"));
      setLabels(els.map((e) => e.dataset.chapter || ""));
      triggers = els.map((el, i) =>
        ScrollTrigger.create({
          trigger: el,
          start: "top 60%",
          end: "bottom 40%",
          refreshPriority: -1,
          onToggle: (s) => {
            if (s.isActive) setIdx(i);
          },
          onUpdate: (s) => {
            if (s.isActive) {
              const p = Math.max(0, Math.min(1, s.progress));
              setSectionProgress(p);
              if (microBar.current) {
                microBar.current.style.transform = `scaleX(${p})`;
              }
              if (microDot.current) {
                microDot.current.style.left = `${p * 100}%`;
              }
            }
          },
        })
      );
      triggers.push(
        ScrollTrigger.create({
          start: 0,
          end: "max",
          refreshPriority: -1,
          onUpdate: (s) => bar.current && gsap.set(bar.current, { scaleY: s.progress }),
        })
      );
      ScrollTrigger.refresh();
    }, 500);
    return () => {
      window.clearTimeout(t);
      triggers.forEach((tr) => tr.kill());
    };
  }, []);

  if (!labels.length) return null;
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <>
      {/* global signal node + progress track (keeps true lime colour) */}
      <div className="pointer-events-none fixed bottom-[22px] left-[18px] z-[60] hidden h-[72px] w-[6px] flex-col items-center lg:flex" aria-hidden>
        <span className="signal-dot relative z-[1] flex-none" />
        <span className="relative mt-[6px] w-px flex-1 overflow-hidden" style={{ background: "rgba(128,128,128,.35)" }}>
          <span ref={bar} className="absolute inset-0 origin-top" style={{ background: "var(--accent-deep)", transform: "scaleY(0)" }} />
        </span>
      </div>

      {/* Living chapter HUD label with in-section micro progress bar + runner dot */}
      <div
        className="pointer-events-none fixed bottom-[18px] left-[34px] z-[60] hidden flex-col gap-[3px] rounded-[5px] px-[9px] py-[6px] min-w-[130px] lg:flex"
        style={{
          color: "var(--fg)",
          background: "color-mix(in srgb, var(--bg) 85%, transparent)",
          backdropFilter: "blur(10px)",
          border: "1px solid var(--line)",
          boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
        }}
        aria-hidden
      >
        <div className="flex items-center justify-between">
          <span className="font-mono text-[9.5px] tracking-[.14em]" style={{ color: "var(--accent)" }}>
            {pad(idx + 1)} / {pad(labels.length)}
          </span>
          <span className="font-mono text-[8px] opacity-40">
            {Math.round(sectionProgress * 100)}%
          </span>
        </div>

        <span key={idx} className="demo-in font-mono text-[9.5px] tracking-[.14em] uppercase font-medium truncate" style={{ opacity: 0.85 }}>
          {labels[idx]}
        </span>

        {/* Thin living in-section progress track + moving dot */}
        <div className="relative mt-[2px] h-[2px] w-full overflow-visible rounded-full bg-[rgba(244,242,237,0.12)]">
          <span
            ref={microBar}
            className="absolute inset-0 origin-left rounded-full transition-transform duration-75 ease-out"
            style={{ background: "var(--accent)", transform: `scaleX(${sectionProgress})` }}
          />
          <span
            ref={microDot}
            className="absolute top-1/2 h-[5px] w-[5px] -translate-x-1/2 -translate-y-1/2 rounded-full shadow-[0_0_6px_var(--accent)] transition-all duration-75 ease-out"
            style={{
              left: `${sectionProgress * 100}%`,
              background: "var(--accent)",
            }}
          />
        </div>
      </div>
    </>
  );
}
