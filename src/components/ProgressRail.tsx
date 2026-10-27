import { useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger } from "../lib/gsap";

/**
 * Living chapter indicator.
 *
 * Two presentations of the same data, chosen by available gutter space:
 *
 *  - Edge rail (default): a 20px-wide vertical track with a rotated chapter
 *    name. It lives entirely inside the page gutter (--gut) so it can never
 *    sit on top of body copy — the old boxed HUD did exactly that at
 *    1440px, where the gutter is only ~79px wide.
 *  - Card (>=1700px): the fuller HUD with per-chapter micro progress, shown
 *    only when the gutter is wide enough to hold it.
 *
 * Both are aria-hidden decoration; the information is not essential.
 */
export function ProgressRail() {
  const [idx, setIdx] = useState(0);
  const [labels, setLabels] = useState<string[]>([]);
  const [sectionProgress, setSectionProgress] = useState(0);
  const bar = useRef<HTMLSpanElement>(null);
  const edgeBar = useRef<HTMLSpanElement>(null);
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
            if (!s.isActive) return;
            const p = Math.max(0, Math.min(1, s.progress));
            setSectionProgress(p);
            if (microBar.current) microBar.current.style.transform = `scaleX(${p})`;
            if (microDot.current) microDot.current.style.left = `${p * 100}%`;
            if (edgeBar.current) edgeBar.current.style.transform = `scaleX(${p})`;
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
    <div className="progress-rail" aria-hidden>
      {/* ---------- compact edge version (fits in the gutter) ---------- */}
      <div className="progress-edge">
        <span className="signal-dot" />
        <span className="progress-edge-track">
          <span ref={bar} style={{ transform: "scaleY(0)" }} />
        </span>
        <span className="progress-edge-label">
          {pad(idx + 1)} · {labels[idx]}
        </span>
        <span className="progress-edge-track progress-edge-chapter">
          <span ref={edgeBar} style={{ transform: `scaleX(${sectionProgress})` }} />
        </span>
      </div>

      {/* ---------- full HUD, only on very wide screens ---------- */}
      <div className="progress-card">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[9.5px] tracking-[.14em]" style={{ color: "var(--accent-ink)" }}>
            {pad(idx + 1)} / {pad(labels.length)}
          </span>
          <span className="font-mono text-[8px] opacity-50">{Math.round(sectionProgress * 100)}%</span>
        </div>
        <span key={idx} className="demo-in font-mono text-[9.5px] uppercase" style={{ opacity: 0.85 }}>
          {labels[idx]}
        </span>
        <div className="relative mt-[2px] h-[2px] w-full overflow-visible rounded-full" style={{ background: "var(--line)" }}>
          <span
            ref={microBar}
            className="absolute inset-0 origin-left rounded-full transition-transform duration-75 ease-out"
            style={{ background: "var(--accent-deep)", transform: `scaleX(${sectionProgress})` }}
          />
          <span
            ref={microDot}
            className="absolute top-1/2 h-[5px] w-[5px] -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-75 ease-out"
            style={{ left: `${sectionProgress * 100}%`, background: "var(--accent-deep)" }}
          />
        </div>
      </div>
    </div>
  );
}
