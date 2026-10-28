import { useEffect, useRef, useState } from "react";
import { onMotionPreferenceChange, prefersReducedMotion } from "../lib/gsap";
import { announcePreviewDone, markPreviewPlayed } from "../lib/autoplay";

const PHASES = ["IDEA", "STRUCTURE", "INTERFACE", "LIVE"] as const;
const PAGES = {
  spaces: { eyebrow: "A PLACE TO THINK / 01", title: "Room for\nbetter ideas.", body: "A quieter kind of space for the work that matters." },
  studio: { eyebrow: "THE STUDIO / 02", title: "Made for\nwhat's next.", body: "Thoughtful spaces, built around the people using them." },
  visit: { eyebrow: "YOUR VISIT / 03", title: "Come see\nthe space.", body: "Explore how a simple interaction becomes a useful next step." },
} as const;
type Page = keyof typeof PAGES;

/** Fictional miniature site: the controls change real local interface state;
 * the visit action is explicitly a preview, never a real booking. */
export function WebDevDemo({ active = false, preview = false }: { active?: boolean; preview?: boolean }) {
  const [phase, setPhase] = useState(0);
  const [page, setPage] = useState<Page>("spaces");
  const [visitOpen, setVisitOpen] = useState(false);
  const timers = useRef<number[]>([]);
  const clear = () => { timers.current.forEach(window.clearTimeout); timers.current = []; };
  // Stop an in-progress preview if the visitor changes the OS preference;
  // retain whatever phase they were already looking at.
  useEffect(() => onMotionPreferenceChange((reduced) => { if (reduced) clear(); }), []);

  useEffect(() => {
    clear();
    setPhase(0);
    setPage("spaces");
    setVisitOpen(false);
    if (!active || preview) return;
    markPreviewPlayed("web-development");
    if (prefersReducedMotion()) { setPhase(3); announcePreviewDone("web-development"); return; }
    [1, 2, 3].forEach((next) => timers.current.push(window.setTimeout(() => {
      setPhase(next);
      if (next === 3) announcePreviewDone("web-development");
    }, next * 850)));
    return clear;
  }, [active, preview]);

  const selectPhase = (next: number) => { clear(); setPhase(next); setVisitOpen(false); };
  const content = PAGES[page];
  const live = phase === 3 && !preview;

  return (
    <div className="web-experience" aria-label="Website build demonstration">
      <div className="web-phase-rail" role="group" aria-label="Website build stages">
        {PHASES.map((label, i) => <button type="button" key={label} onClick={() => selectPhase(i)} disabled={preview} aria-pressed={phase === i} data-state={phase === i ? "active" : phase > i ? "past" : "future"}><span>0{i + 1}</span>{label}</button>)}
      </div>
      <div className="web-mini" data-phase={phase}>
        <div className="web-mini-top"><span>● &nbsp; ● &nbsp; ●</span><span>NORTH / A FICTIONAL STUDIO</span><span>↗</span></div>
        {phase < 2 ? (
          <div className="web-blueprint">
            <div className="web-blueprint-label"><span>01 / {PHASES[phase]}</span><span>{phase === 0 ? "THE QUESTION" : "THE STRUCTURE"}</span></div>
            <div className="web-blueprint-grid">
              <div className="web-blueprint-hero"><span>{phase === 0 ? "What should this place make possible?" : "HERO / PURPOSE"}</span><i /><i /></div>
              <div className="web-blueprint-block"><span>{phase === 0 ? "PEOPLE" : "CONTENT"}</span></div>
              <div className="web-blueprint-block"><span>{phase === 0 ? "ACTION" : "NEXT STEP"}</span></div>
            </div>
            <p>{phase === 0 ? "A thought becomes a direction." : "A direction becomes a usable architecture."}</p>
          </div>
        ) : (
          <div className="web-site">
            <div className="web-site-nav"><strong>NORTH<span aria-hidden>✳</span></strong><div>{(["spaces", "studio", "visit"] as Page[]).map((item) => <button type="button" key={item} disabled={!live} aria-pressed={page === item} onClick={() => { setPage(item); setVisitOpen(false); }}>{item}</button>)}</div></div>
            <div className="web-site-content">
              <div><span className="web-site-eyebrow">{content.eyebrow}</span><h4>{content.title}</h4><p>{content.body}</p><button type="button" className="web-site-cta" disabled={!live} onClick={() => { setPage("visit"); setVisitOpen(true); }}>Explore a visit <span>↗</span></button></div>
              <div className="web-site-art" aria-hidden="true"><span /><i /><b>01 — 03</b></div>
            </div>
            {visitOpen && <div className="web-visit-panel" role="status"><div><span>VISIT / PREVIEW</span><strong>A small interaction, made real.</strong><p>This is a fictional site. No visit has been booked.</p></div><button type="button" onClick={() => setVisitOpen(false)} aria-label="Close visit preview">×</button></div>}
          </div>
        )}
      </div>
      <div className="web-experience-footer"><span>{phase === 3 ? "LIVE / TRY THE MINIATURE SITE" : `${PHASES[phase]} / SELECT ANY STAGE`}</span><span>FICTIONAL INTERFACE · LOCAL DEMO</span></div>
    </div>
  );
}
