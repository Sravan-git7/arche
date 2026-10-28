import { useEffect, useRef, useState } from "react";
import { onMotionPreferenceChange, prefersReducedMotion } from "../lib/gsap";

export const STAGES = [
  { id: "raw", label: "RAW", name: "Source material", desc: "The uncut idea, before editorial decisions." },
  { id: "select", label: "SELECT", name: "Select the frame", desc: "Find the strongest moment in the material." },
  { id: "cut", label: "CUT", name: "Shape the sequence", desc: "Trim the frame and establish a rhythm." },
  { id: "motion", label: "MOTION", name: "Add movement", desc: "Typography and framing begin to move together." },
  { id: "captions", label: "CAPTIONS", name: "Make it legible", desc: "A caption gives the story another way in." },
  { id: "grade", label: "GRADE", name: "Find the finish", desc: "Contrast and colour give the piece its tone." },
  { id: "export", label: "EXPORT", name: "Ready to share", desc: "The pieces resolve into a finished editorial study." },
] as const;
export type VideoStageId = (typeof STAGES)[number]["id"];

/** A conceptual editorial study, not footage or a client project. The same
 * composition survives every pass so the transformation is actually legible. */
export function VideoEditingDemo({ active = false, preview = false }: { active?: boolean; preview?: boolean }) {
  const [stage, setStage] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timer = useRef<number | null>(null);
  useEffect(() => onMotionPreferenceChange((reduced) => { if (reduced) setPlaying(false); }), []);

  useEffect(() => {
    if (!playing || !active || preview) return;
    if (prefersReducedMotion()) { setStage(6); setPlaying(false); return; }
    timer.current = window.setInterval(() => setStage((current) => {
      if (current >= 6) { setPlaying(false); return 6; }
      return current + 1;
    }), 650);
    return () => { if (timer.current !== null) window.clearInterval(timer.current); timer.current = null; };
  }, [playing, active, preview]);
  useEffect(() => { if (!active) setPlaying(false); }, [active]);

  const choose = (value: number) => { setPlaying(false); setStage(Math.max(0, Math.min(6, value))); };
  const toggle = () => {
    if (playing) { setPlaying(false); return; }
    if (stage === 6) setStage(0);
    setPlaying(true);
  };
  const current = STAGES[stage];

  return (
    <div className="edit-demo" aria-label="Interactive editing timeline">
      <div className="edit-demo-head">
        <div><span className="edit-live-dot" /><span className="mono mono-fg">STAGE: {current.label}</span><span className="mono edit-stage-name"> / {current.name}</span></div>
        <button type="button" onClick={toggle} disabled={preview} aria-label={playing ? "Pause editing preview" : "Play editing preview"}>{playing ? "Ⅱ PAUSE" : "▶ PLAY"}</button>
      </div>
      <div className="edit-preview" data-stage={stage} aria-label={`Editorial study, ${current.name}`}>
        <div className="edit-preview-top"><span>ARCHE / EDITORIAL STUDY</span><span>{String(stage + 1).padStart(2, "0")} / 07</span></div>
        <div className="edit-composition" aria-hidden="true">
          <span className="edit-orbit" /><span className="edit-plane edit-plane-a" /><span className="edit-plane edit-plane-b" />
          <span className="edit-cross edit-cross-one">+</span><span className="edit-cross edit-cross-two">+</span>
          <div className="edit-title"><span>MAKE</span><span>THE</span><span>CONNECTION<span className="edit-period">.</span></span></div>
          <span className="edit-select-frame"><i>IN</i><i>OUT</i></span>
          <span className="edit-caption">A better system starts with a connection.</span>
        </div>
        <div className="edit-preview-bottom"><span>{stage === 6 ? "FINAL COMPOSITION / READY" : "CONCEPTUAL VISUAL / NOT CLIENT FOOTAGE"}</span><span>{stage >= 5 ? "GRADE 01" : "SOURCE 01"}</span></div>
      </div>
      <div className="edit-timeline">
        <div className="edit-timeline-label"><span>THE EDIT / SELECT A PASS</span><span>{current.desc}</span></div>
        <div className="edit-stages" role="group" aria-label="Editing stages">
          {STAGES.map((item, i) => <button key={item.id} type="button" aria-pressed={stage === i} onClick={() => choose(i)} disabled={preview} data-state={i === stage ? "active" : i < stage ? "past" : "future"}><span>{String(i + 1).padStart(2, "0")}</span><strong>{item.label}</strong></button>)}
        </div>
        <div className="edit-scrub">
          <span className="mono">PLAYHEAD</span>
          <input type="range" className="vd-track" aria-label="Video timeline scrubber" aria-valuetext={current.label} min="0" max="6" step="1" value={stage} onChange={(e) => choose(Number(e.target.value))} disabled={preview} style={{ "--playhead": `${(stage / 6) * 100}%` } as React.CSSProperties} />
          <span className="mono">0{stage + 1} / 07</span>
        </div>
      </div>
    </div>
  );
}
