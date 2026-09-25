import { useEffect, useRef, useState, type ReactElement } from "react";
import { AgentDemo } from "./AgentDemo";

/**
 * Interactive "Try" demos — each service has its own interaction language.
 *   Video      → click-to-edit timeline (select · cut · caption · grade · export)
 *   Web        → a usable mini site whose form becomes a lead in a CRM
 *   Chat       → pick a question, watch the agent reason, use a tool, act
 *   Automation → watch a manual loop, press AUTOMATE, watch it compress
 * Pure DOM + timers; every timer is cleared on unmount.
 */

const A = "var(--accent-deep)";
const LN = "var(--line)";

function useTimers() {
  const ids = useRef<number[]>([]);
  useEffect(() => {
    const list = ids.current;
    return () => list.forEach((i) => window.clearTimeout(i));
  }, []);
  const later = (fn: () => void, ms: number) => {
    ids.current.push(window.setTimeout(fn, ms));
  };
  const clear = () => {
    ids.current.forEach((i) => window.clearTimeout(i));
    ids.current.length = 0;
  };
  return { later, clear };
}

function Tool({ label, state, onClick }: { label: string; state: "done" | "next" | "off"; onClick?: () => void }) {
  return (
    <button
      type="button"
      disabled={state !== "next"}
      onClick={onClick}
      className="relative rounded-full border px-[11px] py-[6px] font-mono text-[9.5px] tracking-[.12em] uppercase"
      style={{
        borderColor: state === "next" ? A : LN,
        color: state === "done" ? A : state === "next" ? "var(--fg)" : "var(--faint)",
        background: state === "next" ? "color-mix(in srgb, var(--accent) 22%, transparent)" : "transparent",
        cursor: state === "next" ? "pointer" : "default",
        transition: "all .35s var(--e-out)",
      }}
    >
      {state === "done" ? "✓ " : ""}
      {label}
      {state === "next" && <span className="demo-pulse absolute inset-0 rounded-full" />}
    </button>
  );
}

/* ================================================================== */
/* VIDEO                                                                */
/* ================================================================== */
const CLIPS = [
  { w: 12, c: "#2b2b2e" },
  { w: 20, c: "#3a3a33" },
  { w: 16, c: "#1f2a1a" },
  { w: 24, c: "#34302a" },
  { w: 14, c: "#26262b" },
  { w: 14, c: "#2e3326" },
];

export function TryVideo() {
  const [sel, setSel] = useState<number | null>(null);
  const [cut, setCut] = useState(false);
  const [caps, setCaps] = useState(false);
  const [grade, setGrade] = useState(false);
  const [exp, setExp] = useState(0);
  const { later, clear } = useTimers();

  const step = sel === null ? 0 : !cut ? 1 : !caps ? 2 : !grade ? 3 : exp < 100 ? 4 : 5;
  const hints = [
    "Click a clip on the timeline to select it.",
    "Cut the strongest moment out of the clip.",
    "Generate captions for silent autoplay.",
    "Apply the grade.",
    "Export for publishing.",
    "Published. Raw footage became a story.",
  ];

  const runExport = () => {
    let v = 0;
    const tick = () => {
      v = Math.min(100, v + 9);
      setExp(v);
      if (v < 100) later(tick, 70);
    };
    tick();
  };

  const reset = () => {
    clear();
    setSel(null);
    setCut(false);
    setCaps(false);
    setGrade(false);
    setExp(0);
  };

  const clip = sel !== null ? CLIPS[sel] : CLIPS[2];
  const done = step === 5;

  return (
    <div className="flex min-h-[300px] flex-col gap-[12px] p-[16px]">
      {/* preview */}
      <div className="flex justify-center">
        <div
          className="relative overflow-hidden rounded-[4px]"
          style={{
            width: done ? "34%" : "100%",
            aspectRatio: done ? "9 / 16" : "16 / 7",
            maxHeight: done ? 170 : 170,
            background: `linear-gradient(135deg, ${clip.c}, #0c0c0d)`,
            filter: grade ? "contrast(1.15) saturate(1.3)" : "none",
            transition: "width .7s var(--e-out), filter .6s",
          }}
        >
          {grade && <div className="absolute inset-0" style={{ background: "linear-gradient(0deg, color-mix(in srgb, var(--accent) 28%, transparent), transparent 60%)" }} />}
          <span className="mono absolute top-[8px] left-[10px]" style={{ color: "rgba(244,242,237,.6)" }}>
            {sel === null ? "No clip selected" : `Clip ${String(sel + 1).padStart(2, "0")}`}
          </span>
          {caps && (
            <span className="demo-in absolute bottom-[10px] left-1/2 -translate-x-1/2 rounded-[3px] px-[8px] py-[3px] text-[11px] font-medium whitespace-nowrap" style={{ background: "rgba(0,0,0,.65)", color: "#fff" }}>
              Quiet rooms for loud ideas.
            </span>
          )}
          {done && (
            <span className="demo-in mono absolute top-[8px] right-[8px]" style={{ color: "#c8f14f" }}>
              ● Published
            </span>
          )}
        </div>
      </div>

      {/* timeline */}
      <div className="relative flex h-[42px] gap-[3px]">
        {CLIPS.map((c, i) => {
          const isSel = sel === i;
          if (isSel && cut) {
            return (
              <div key={i} className="flex gap-[6px]" style={{ flex: c.w }}>
                <span className="flex-1 rounded-[2px] opacity-30" style={{ background: c.c }} />
                <span className="w-px self-stretch" style={{ background: A }} />
                <span className="demo-in flex-[2] rounded-[2px]" style={{ background: c.c, outline: `1.5px solid ${A}` }} />
              </div>
            );
          }
          return (
            <button
              key={i}
              type="button"
              aria-label={`Select clip ${i + 1}`}
              onClick={() => step <= 1 && !cut && setSel(i)}
              className="rounded-[2px]"
              style={{
                flex: c.w,
                background: c.c,
                outline: isSel ? `1.5px solid ${A}` : "none",
                opacity: sel !== null && !isSel && cut ? 0.35 : 1,
                transform: isSel ? "translateY(-3px)" : "none",
                transition: "all .35s var(--e-out)",
                cursor: step <= 1 && !cut ? "pointer" : "default",
              }}
            />
          );
        })}
      </div>
      <div className="relative h-[8px] overflow-hidden rounded-full" style={{ background: LN }}>
        <span className="absolute inset-y-0 left-0" style={{ width: `${exp}%`, background: A, transition: "width .07s linear" }} />
      </div>

      <div className="flex flex-wrap items-center gap-[6px]">
        <Tool label="Select" state={step > 0 ? "done" : "next"} />
        <Tool label="Cut" state={step > 1 ? "done" : step === 1 ? "next" : "off"} onClick={() => setCut(true)} />
        <Tool label="Captions" state={step > 2 ? "done" : step === 2 ? "next" : "off"} onClick={() => setCaps(true)} />
        <Tool label="Grade" state={step > 3 ? "done" : step === 3 ? "next" : "off"} onClick={() => setGrade(true)} />
        <Tool label="Export" state={step > 4 ? "done" : step === 4 && exp === 0 ? "next" : "off"} onClick={runExport} />
        <button type="button" className="mono lnk ml-auto" onClick={reset}>Reset</button>
      </div>
      <p className="body-s" aria-live="polite">{hints[step]}</p>
    </div>
  );
}

/* ================================================================== */
/* WEB                                                                  */
/* ================================================================== */
const PAGES = {
  work: { t: "Quiet rooms for loud ideas.", b: "Three spaces designed for focused teams." },
  studio: { t: "Built slowly. Lit carefully.", b: "A small studio with a long view." },
  visit: { t: "Come and see it.", b: "Tours run Tuesday to Friday." },
} as const;
type PageKey = keyof typeof PAGES;

export function TryWeb() {
  const [page, setPage] = useState<PageKey>("work");
  const [mobile, setMobile] = useState(false);
  const [form, setForm] = useState(false);
  const [name, setName] = useState("");
  const [pipe, setPipe] = useState(0);
  const { later, clear } = useTimers();

  const submit = () => {
    setForm(false);
    setPipe(1);
    later(() => setPipe(2), 450);
    later(() => setPipe(3), 900);
  };
  const reset = () => {
    clear();
    setPipe(0);
    setName("");
    setForm(false);
    setPage("work");
  };

  const pg = PAGES[page];
  const who = name.trim() || "Ana Silva";

  return (
    <div className="flex min-h-[300px] flex-col gap-[12px] p-[16px]">
      <div className="flex items-center justify-between">
        <span className="mono">Live site · try it</span>
        <div className="flex gap-[6px]">
          {(["Desktop", "Mobile"] as const).map((d) => (
            <button key={d} type="button" className="chip" style={{ padding: "5px 10px" }} data-on={(d === "Mobile") === mobile ? "1" : "0"} onClick={() => setMobile(d === "Mobile")}>
              {d}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-center">
        <div
          className="relative overflow-hidden rounded-[5px] border"
          style={{ borderColor: LN, background: "var(--bg)", width: mobile ? 220 : "100%", transition: "width .6s var(--e-out)" }}
        >
          <nav className="flex items-center justify-between border-b px-[12px] py-[8px]" style={{ borderColor: LN }}>
            <span className="font-mono text-[10px] tracking-[.14em]">NORTH</span>
            <span className="flex gap-[10px]">
              {(Object.keys(PAGES) as PageKey[]).map((k) => (
                <button key={k} type="button" onClick={() => setPage(k)} className="demo-navlink font-mono text-[9px] tracking-[.12em] uppercase" data-on={page === k ? "1" : "0"}>
                  {k}
                </button>
              ))}
            </span>
          </nav>
          <div key={page} className="demo-in px-[12px] py-[12px]">
            <p className="m-0 text-[clamp(16px,1.7vw,21px)] leading-[1.05] font-medium tracking-[-.04em]">{pg.t}</p>
            <p className="m-0 mt-[6px] text-[11.5px]" style={{ color: "var(--muted)" }}>{pg.b}</p>
            <div className={`mt-[10px] grid gap-[6px] ${mobile ? "grid-cols-1" : "grid-cols-3"}`}>
              {[0, 1, 2].slice(0, mobile ? 1 : 3).map((i) => (
                <div key={i} className="demo-card h-[40px] rounded-[3px]" style={{ background: `linear-gradient(135deg, #2b2b2e, ${i === 1 ? "#3a4a1f" : "#1a1a1c"})` }} />
              ))}
            </div>
            <button type="button" onClick={() => pipe === 0 && setForm(true)} className="mt-[10px] rounded-full px-[12px] py-[6px] font-mono text-[9px] tracking-[.14em] uppercase" style={{ background: "var(--fg)", color: "var(--bg)" }} data-cursor="CLICK">
              Book a visit
            </button>
          </div>

          {form && (
            <form
              className="demo-in absolute inset-0 flex flex-col justify-center gap-[8px] px-[16px]"
              style={{ background: "color-mix(in srgb, var(--bg) 94%, transparent)" }}
              onSubmit={(e) => {
                e.preventDefault();
                submit();
              }}
            >
              <span className="mono">Book a visit</span>
              <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Ana Silva" className="field" style={{ fontSize: 13, padding: "6px 0" }} aria-label="Name" />
              <button className="self-start rounded-full px-[12px] py-[6px] font-mono text-[9px] tracking-[.14em] uppercase" style={{ background: A, color: "#0c0c0d" }}>
                Send request
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="flex items-center gap-[8px]">
        {["Website", "Lead", "CRM"].map((s, i) => (
          <span key={s} className="flex items-center gap-[8px]">
            <span className="mono rounded-full border px-[9px] py-[4px]" style={{ borderColor: pipe > i ? A : LN, color: pipe > i ? A : "var(--faint)", transition: "all .35s" }}>
              {s}
            </span>
            {i < 2 && <span className="mono" style={{ color: pipe > i + 1 ? A : "var(--faint)" }}>→</span>}
          </span>
        ))}
        {pipe === 3 && (
          <span className="demo-in body-s ml-auto" style={{ color: "var(--fg)" }}>
            {who} · Visit request · New
          </span>
        )}
      </div>
      <div className="flex items-center justify-between">
        <p className="body-s">{pipe === 3 ? "The website just created a routed lead." : "Browse the site, then book a visit."}</p>
        <button type="button" className="mono lnk" onClick={reset}>Reset</button>
      </div>
    </div>
  );
}

/* ================================================================== */
/* CHAT                                                                 */
/* ================================================================== */
const FLOWS: Record<string, { status: string[]; answer: string; action: string }> = {
  "Can I book a demo?": {
    status: ["Thinking", "Checking calendar", "Holding slot", "Done"],
    answer: "Tomorrow at 15:00 is free. I’ve held it and sent a calendar invite.",
    action: "Demo held · 15:00",
  },
  "What services do you offer?": {
    status: ["Thinking", "Searching knowledge", "Composing", "Done"],
    answer: "Four today: video editing, web development, AI agents and automation. Where’s the friction?",
    action: "Knowledge · 4 services",
  },
  "Can you automate my workflow?": {
    status: ["Thinking", "Mapping workflow", "Finding triggers", "Done"],
    answer: "Likely. Which task repeats most, and which tools does it touch? I’ll map what can run on its own.",
    action: "Workflow mapper · ready",
  },
};
const PIPE = ["Question", "Understand", "Reason", "Tool", "Action", "Answer"];

export function TryChat() {
  const [msgs, setMsgs] = useState<{ role: "in" | "out"; text: string }[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [stage, setStage] = useState(-1);
  const [action, setAction] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { later, clear } = useTimers();

  const ask = (q: string) => {
    if (busy) return;
    const f = FLOWS[q];
    setBusy(true);
    setAction(null);
    setMsgs((m) => [...m.slice(-2), { role: "in", text: q }]);
    setStage(0);
    f.status.forEach((s, i) => {
      later(() => {
        setStatus(s);
        setStage(Math.min(PIPE.length - 1, 1 + i + (i > 1 ? 1 : 0)));
      }, 380 + i * 560);
    });
    const t0 = 380 + f.status.length * 560;
    const words = f.answer.split(" ");
    later(() => {
      setStatus(null);
      setStage(PIPE.length - 1);
      setMsgs((m) => [...m, { role: "out", text: "" }]);
      words.forEach((_, wi) =>
        later(() => {
          setMsgs((m) => {
            const next = [...m];
            next[next.length - 1] = { role: "out", text: words.slice(0, wi + 1).join(" ") };
            return next;
          });
          if (wi === words.length - 1) {
            setAction(f.action);
            setBusy(false);
          }
        }, wi * 40)
      );
    }, t0);
  };

  const reset = () => {
    clear();
    setMsgs([]);
    setStatus(null);
    setStage(-1);
    setAction(null);
    setBusy(false);
  };

  return (
    <div className="flex min-h-[300px] flex-col gap-[10px] p-[16px]" data-cursor="ASK">
      <div className="flex flex-wrap items-center gap-[5px]">
        {PIPE.map((p, i) => (
          <span key={p} className="flex items-center gap-[5px]">
            <span className="mono" style={{ fontSize: 9, color: stage >= i ? A : "var(--faint)", transition: "color .3s" }}>{p}</span>
            {i < PIPE.length - 1 && <span className="block h-px w-[10px]" style={{ background: stage > i ? A : LN }} />}
          </span>
        ))}
      </div>

      <div className="flex min-h-[150px] flex-1 flex-col justify-end gap-[8px]" aria-live="polite">
        {msgs.length === 0 && <p className="body-s">Pick a question. The agent will reason, use a tool, and act.</p>}
        {msgs.map((m, i) => (
          <div key={i} className={`demo-in flex ${m.role === "in" ? "justify-start" : "justify-end"}`}>
            <p
              className="m-0 max-w-[84%] px-[12px] py-[8px] text-[12.5px] leading-[1.45]"
              style={{
                borderRadius: m.role === "in" ? "14px 14px 14px 4px" : "14px 14px 4px 14px",
                background: m.role === "in" ? "var(--bg)" : "var(--fg)",
                color: m.role === "in" ? "var(--fg)" : "var(--bg)",
                border: m.role === "in" ? `1px solid ${LN}` : "none",
              }}
            >
              {m.text || "…"}
            </p>
          </div>
        ))}
        {status && (
          <span className="demo-in mono flex items-center gap-[8px] self-end" style={{ color: A }}>
            <span className="block h-[6px] w-[6px] animate-pulse rounded-full" style={{ background: A }} />
            {status}
          </span>
        )}
        {action && (
          <span className="demo-in mono self-end rounded-full px-[10px] py-[4px]" style={{ background: "var(--fg)", color: "#c8f14f" }}>
            ● {action}
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-[6px]">
        {Object.keys(FLOWS).map((q) => (
          <button key={q} type="button" className="chip" style={{ padding: "6px 11px", opacity: busy ? 0.5 : 1 }} disabled={busy} onClick={() => ask(q)}>
            {q}
          </button>
        ))}
        <button type="button" className="mono lnk ml-auto" onClick={reset}>Reset</button>
      </div>
    </div>
  );
}

/* ================================================================== */
/* AUTOMATION                                                           */
/* ================================================================== */
const MANUAL_STEPS = ["Read email", "Copy information", "Open sheet", "Update CRM", "Send response", "Create task"];
const APPS = ["Email", "AI", "CRM", "Slack", "Task", "Response"];
type AppState = "Waiting" | "Processing" | "Updated" | "Completed";

export function TryAuto() {
  const [mode, setMode] = useState<"manual" | "auto" | "done">("manual");
  const [step, setStep] = useState(0);
  const [states, setStates] = useState<AppState[]>(APPS.map(() => "Waiting"));
  const { later, clear } = useTimers();

  // the manual loop keeps grinding until the visitor intervenes
  useEffect(() => {
    if (mode !== "manual") return;
    const id = window.setInterval(() => setStep((s) => (s + 1) % MANUAL_STEPS.length), 700);
    return () => window.clearInterval(id);
  }, [mode]);

  const automate = () => {
    setMode("auto");
    APPS.forEach((_, i) => {
      later(() => setStates((s) => s.map((v, j) => (j === i ? "Processing" : v))), 350 + i * 300);
      later(
        () => setStates((s) => s.map((v, j) => (j === i ? (i === APPS.length - 1 ? "Completed" : "Updated") : v))),
        650 + i * 300
      );
    });
    later(() => setMode("done"), 700 + APPS.length * 300);
  };

  const reset = () => {
    clear();
    setStates(APPS.map(() => "Waiting"));
    setStep(0);
    setMode("manual");
  };

  const active = states.findIndex((s) => s === "Processing");
  const progress = states.filter((s) => s === "Updated" || s === "Completed").length / APPS.length;

  return (
    <div className="flex min-h-[300px] flex-col gap-[12px] p-[16px]">
      {mode === "manual" ? (
        <div className="demo-in flex flex-1 flex-col gap-[6px]">
          <div className="flex items-center justify-between">
            <span className="mono">Manual · email arrives</span>
            <span className="mono">Step {step + 1} / 6</span>
          </div>
          {MANUAL_STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-[10px] border-b py-[6px]" style={{ borderColor: LN, opacity: i === step ? 1 : 0.45, transition: "opacity .25s" }}>
              <span className="block h-[6px] w-[6px] rounded-full" style={{ background: i === step ? "var(--fg)" : "transparent", border: `1px solid ${LN}` }} />
              <span className="text-[13px] tracking-[-.02em]">{s}</span>
              {i === step && <span className="mono ml-auto">a person, again</span>}
            </div>
          ))}
          <button type="button" className="btn mt-[8px] self-start" onClick={automate} data-cursor="RUN" data-magnetic>
            Automate this <span className="arw">→</span>
          </button>
        </div>
      ) : (
        <div className="demo-in flex flex-1 flex-col gap-[10px]">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-[8px] rounded-full px-[10px] py-[5px]" style={{ background: "var(--fg)", color: "var(--bg)" }}>
              <span className="block h-[6px] w-[6px] rounded-full" style={{ background: "#c8f14f" }} />
              <span className="font-mono text-[9px] tracking-[.14em] uppercase">New lead</span>
            </span>
            <span className="mono">{mode === "done" ? "Completed" : "Processing"}</span>
          </div>
          <div className="relative h-px w-full" style={{ background: LN }}>
            <span className="absolute inset-y-0 left-0" style={{ width: `${progress * 100}%`, background: A, transition: "width .3s" }} />
            <span className="absolute top-1/2 block h-[7px] w-[7px] -translate-y-1/2 rounded-full" style={{ left: `calc(${Math.max(0, active) / (APPS.length - 1) * 100}% - 3px)`, background: A, opacity: active >= 0 ? 1 : 0, transition: "left .3s var(--e-out)" }} />
          </div>
          <div className="grid grid-cols-3 gap-[8px]">
            {APPS.map((a, i) => {
              const s = states[i];
              const on = s === "Updated" || s === "Completed";
              return (
                <div key={a} className="rounded-[4px] border px-[10px] py-[9px]" style={{ borderColor: on ? A : s === "Processing" ? "var(--fg)" : LN, background: "var(--bg)", transition: "border-color .3s" }}>
                  <p className="m-0 text-[13px] tracking-[-.02em]">{a}</p>
                  <span className="mono" style={{ fontSize: 8.5, color: on ? A : s === "Processing" ? "var(--fg)" : "var(--faint)" }}>{s}</span>
                </div>
              );
            })}
          </div>
          {mode === "done" && (
            <div className="demo-in flex flex-wrap items-baseline gap-[10px]">
              <span className="numeral text-[26px]" style={{ color: "var(--faint)", textDecoration: "line-through" }}>6</span>
              <span className="mono">manual steps</span>
              <span className="mono" style={{ color: A }}>→</span>
              <span className="numeral text-[26px]" style={{ color: A }}>1</span>
              <span className="mono">automated workflow</span>
            </div>
          )}
        </div>
      )}
      <div className="flex justify-end">
        <button type="button" className="mono lnk" onClick={reset}>Reset</button>
      </div>
    </div>
  );
}

export const TRY: Record<string, () => ReactElement> = {
  "video-editing": TryVideo,
  "web-development": TryWeb,
  "ai-chatbots": () => <AgentDemo />,
  "ai-automation": TryAuto,
};
