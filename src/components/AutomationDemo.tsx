import { useEffect, useRef, useState } from "react";
import { onMotionPreferenceChange, prefersReducedMotion } from "../lib/gsap";

type Mode = "manual" | "auto";
type Phase = "idle" | "running" | "done";

const MANUAL = [
  ["Incoming email", "A new request arrives"],
  ["Read request", "A person reviews the message"],
  ["Copy details", "Name and project are copied"],
  ["Update spreadsheet", "Add a row by hand"],
  ["Create CRM record", "Enter the same details again"],
  ["Draft response", "Write a reply"],
  ["Create follow-up", "Add a task for the team"],
];
const AUTOMATED = [
  ["Event", "An inquiry starts the flow"],
  ["Classify", "Identify a project request"],
  ["Extract", "Read the relevant fields"],
  ["Route", "Choose the right handoff"],
  ["Update CRM", "Write the same record to tools"],
  ["Notify", "Prepare a team notification"],
  ["Follow up", "Create the next action"],
];

/** A deterministic local simulation, not a benchmark or a live integration.
 * A generation token invalidates scheduled steps on reset, mode change and
 * unmount, so rapid interactions cannot complete an old run. */
export function AutomationDemo({ active = true, preview = false }: { active?: boolean; preview?: boolean }) {
  const [mode, setMode] = useState<Mode>("manual");
  const [phase, setPhase] = useState<Phase>("idle");
  const [step, setStep] = useState(-1);
  const timers = useRef<number[]>([]);
  const generation = useRef(0);
  const running = useRef(false);

  const cancel = () => {
    generation.current += 1;
    timers.current.forEach(window.clearTimeout);
    timers.current = [];
    running.current = false;
  };
  const reset = () => { cancel(); setStep(-1); setPhase("idle"); };
  const selectMode = (next: Mode) => { reset(); setMode(next); };

  useEffect(() => () => cancel(), []);
  useEffect(() => onMotionPreferenceChange((reduced) => {
    if (reduced && running.current) { cancel(); setStep(6); setPhase("done"); }
  }), []);
  useEffect(() => {
    if (!active) reset();
    // Leaving a service stops the simulation; it never runs in the background.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const run = () => {
    if (running.current || preview) return;
    cancel();
    running.current = true;
    const current = generation.current;
    setPhase("running");
    setStep(0);
    if (prefersReducedMotion()) {
      setStep(6);
      setPhase("done");
      running.current = false;
      return;
    }
    // Pacing is purely editorial; no execution time or speed claim is shown.
    const gap = mode === "manual" ? 720 : 560;
    for (let i = 1; i <= 7; i += 1) {
      timers.current.push(window.setTimeout(() => {
        if (generation.current !== current) return;
        if (i === 7) { running.current = false; setPhase("done"); }
        else setStep(i);
      }, i * gap));
    }
  };

  const steps = mode === "manual" ? MANUAL : AUTOMATED;
  const completed = phase === "done" ? 7 : Math.max(0, step);
  const hasDetails = completed >= 3;
  const hasRecord = completed >= 5;
  const hasReply = completed >= 6;
  const hasFollowUp = completed >= 7;

  return (
    <div className="workflow-demo" aria-label="Manual and automated workflow simulator">
      <div className="workflow-toolbar">
        <div className="workflow-modes" role="group" aria-label="Workflow mode">
          <button type="button" aria-pressed={mode === "manual"} onClick={() => selectMode("manual")}>Manual</button>
          <button type="button" aria-pressed={mode === "auto"} onClick={() => selectMode("auto")}>Automated</button>
        </div>
        <div className="workflow-actions">
          <button type="button" className="workflow-reset" onClick={reset} disabled={phase === "idle"}>Reset</button>
          <button type="button" className="workflow-run" onClick={run} disabled={phase === "running" || preview}>
            <span aria-hidden>▶</span> {phase === "running" ? "Running" : phase === "done" ? "Run again" : "Run"}
          </button>
        </div>
      </div>
      <div className="workflow-body">
        <div className="workflow-sequence">
          <div className="workflow-column-label"><span>{mode === "manual" ? "01 / HUMAN HANDOFFS" : "01 / ORCHESTRATED ROUTE"}</span><span>07 STEPS</span></div>
          <ol>
            {steps.map(([title, detail], i) => {
              const state = i < completed ? "complete" : phase === "running" && step === i ? "active" : "idle";
              return <li key={title} className="workflow-step" data-state={state}>
                <span className="workflow-step-number">{state === "complete" ? "✓" : String(i + 1).padStart(2, "0")}</span>
                <span className="workflow-step-copy"><strong>{title}</strong><small>{detail}</small></span>
                <span className="workflow-step-status">{state === "active" ? "IN PROGRESS" : state === "complete" ? "DONE" : "WAITING"}</span>
              </li>;
            })}
          </ol>
        </div>
        <div className="workflow-records">
          <div className="workflow-column-label"><span>02 / EXAMPLE DATA</span><span>LOCAL ONLY</span></div>
          <div className="workflow-message">
            <span className="mono">INCOMING / EMAIL</span>
            <strong>Jordan Lee · Cedar Studio</strong>
            <p>“We need a website and a better way to follow up on inquiries.”</p>
          </div>
          <div className="workflow-data" aria-live="polite">
            <div><span>DETAILS</span><strong>{hasDetails ? "Jordan · Website" : "Waiting for request"}</strong><i data-on={hasDetails} /></div>
            <div><span>SHEET + CRM</span><strong>{hasRecord ? "Project inquiry added" : "No record yet"}</strong><i data-on={hasRecord} /></div>
            <div><span>{mode === "manual" ? "REPLY" : "NOTIFY"}</span><strong>{hasReply ? (mode === "manual" ? "Draft prepared" : "Notification prepared") : "Waiting"}</strong><i data-on={hasReply} /></div>
            <div><span>FOLLOW-UP</span><strong>{hasFollowUp ? "Example task ready" : "Waiting"}</strong><i data-on={hasFollowUp} /></div>
          </div>
        </div>
      </div>
      <div className="workflow-footer" role="status" aria-live="polite">
        <span>{phase === "done" ? "Complete / the same inquiry is ready for follow-up" : phase === "running" ? `${steps[step][0]} / ${step + 1} of 7` : "Choose a mode, then run the example"}</span>
        <span>SIMULATION · NO LIVE DATA</span>
      </div>
    </div>
  );
}
