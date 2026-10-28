import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Link } from "../lib/router";
import { prefersReducedMotion } from "../lib/gsap";
import {
  STARTER_CHIPS,
  rememberLastTrigger,
  resolveIntent,
  type Resolution,
  type VisualTrigger,
} from "../data/intents";

/**
 * PROMPT 16 — Ask Arche (scripted assistant + live visual trigger).
 *
 * Architecture: the conversation logic lives in src/data/intents.ts.
 * `resolveIntent` is the ONLY piece that would change if a real LLM call
 * were added later — response rendering and the visual-trigger panel
 * consume its result and never need to change.
 *
 * Replies appear immediately: local matching does not need a simulated
 * thinking delay. The visual panel illustrates the matched intent, while
 * the fallback admits when nothing matched and offers a route to the team.
 */

type Message =
  | { role: "user"; text: string; id: number }
  | { role: "agent"; lines: string[]; revealed: number; label: string; id: number };


const GREETING = "Ask me where Arche could start.";

const TRIGGER_NAMES: Record<VisualTrigger, string> = {
  "service:video": "Video system",
  "service:web": "Website system",
  "service:agent": "Agent system",
  "service:automation": "Automation system",
  system: "Connected system",
  contact: "Reach the team",
};

let seq = 1;

export function ArcheAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "agent", lines: [GREETING], revealed: 1, label: "Arche", id: 0 },
  ]);
  const [input, setInput] = useState("");
  const [trigger, setTrigger] = useState<VisualTrigger>("system");
  const [matched, setMatched] = useState(true);
  const [runId, setRunId] = useState(0); // bumps per reply so the visual replays its build
  const [followUps, setFollowUps] = useState<string[]>(STARTER_CHIPS);

  const scroller = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  }, [messages]);

  const send = (raw: string) => {
    const q = raw.trim();
    if (!q) return;
    const r: Resolution = resolveIntent(q);
    // This is local matching, not a remote model: answer immediately rather
    // than manufacturing a typing or network delay.
    setMessages((m) => [
      ...m,
      { role: "user", text: q, id: seq++ },
      { role: "agent", lines: r.response, revealed: r.response.length, label: r.label, id: seq++ },
    ]);
    setInput("");
    setTrigger(r.trigger);
    setMatched(Boolean(r.intent));
    setRunId((n) => n + 1);
    setFollowUps(r.followUps);
    rememberLastTrigger(r.trigger);
  };

  const reset = () => {
    setMessages([{ role: "agent", lines: [GREETING], revealed: 1, label: "Arche", id: 0 }]);
    setInput("");
    setTrigger("system");
    setMatched(true);
    setRunId((n) => n + 1);
    setFollowUps(STARTER_CHIPS);
    inputRef.current?.focus();
  };

  return (
    <section id="ask-arche" className="w-full py-[clamp(70px,9vw,140px)]">
      <div className="wrap">
        <div className="mb-[clamp(26px,3.4vw,52px)] flex flex-col gap-[12px]">
          <p className="mono mono-a" data-r="meta">
            Ask Arche
          </p>
          <h2 className="d2 max-w-[16ch]" data-r="mask">
            Ask the system where to start.
          </h2>
          <p className="body max-w-[52ch]" data-r="meta" data-r-delay="120">
            A scripted assistant: your question is matched against known intents — there is no
            model behind it, and it won't pretend otherwise. Each answer drives the system view
            beside it. It's the same matching logic a real agent would replace.
          </p>
        </div>

        <div className="grid items-start gap-[clamp(18px,2.4vw,36px)] lg:grid-cols-12">
          {/* chat frame */}
          <div
            className="overflow-hidden rounded-[7px] border lg:col-span-7"
            style={{ borderColor: "var(--line)", background: "var(--card)" }}
            data-r="meta"
          >
            <div className="flex items-center justify-between border-b px-[16px] py-[12px]" style={{ borderColor: "var(--line)" }}>
              <div className="flex items-center gap-[9px]">
                <span
                  className="block h-[7px] w-[7px] rounded-full"
                  style={{ background: "var(--accent-deep)" }}
                />
                <span className="mono mono-fg">Arche assistant</span>
                <span className="mono">· Ready</span>
              </div>
              <button className="mono lnk" onClick={reset}>
                Reset
              </button>
            </div>

            <div
              ref={scroller}
              className="min-h-[340px] max-h-[430px] space-y-[14px] overflow-y-auto p-[16px]"
              aria-live="polite"
            >
              {messages.map((m) =>
                m.role === "user" ? (
                  <div key={m.id} className="flex justify-end">
                    <p
                      className="chat-user m-0 max-w-[84%] px-[13px] py-[10px] text-[14px] leading-[1.55]"
                      style={{
                        borderRadius: "15px 15px 4px 15px",
                        background: "var(--fg)",
                        color: "var(--bg)",
                      }}
                    >
                      {m.text}
                    </p>
                  </div>
                ) : (
                  <div key={m.id} className="flex justify-start">
                    <div className="max-w-[90%]">
                      <p className="mono mb-[6px]" style={{ color: "var(--accent-ink)" }}>
                        ● {m.label}
                      </p>
                      <div
                        className="flex flex-col gap-[6px] px-[13px] py-[10px] text-[14px] leading-[1.55]"
                        style={{
                          borderRadius: "15px 15px 15px 4px",
                          background: "var(--bg-2)",
                          color: "var(--fg)",
                        }}
                      >
                        {m.lines.slice(0, m.revealed).map((ln, i) => (
                          <p key={i} className="m-0 chat-line" style={i > 0 ? { animationDelay: "40ms" } : undefined}>
                            {ln}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              )}


            </div>

            <div className="border-t p-[16px]" style={{ borderColor: "var(--line)" }}>
              <div className="mb-[12px] flex flex-wrap gap-[7px]">
                {followUps.map((p) => (
                  <button
                    key={p}
                    className="chip"
                    onClick={() => send(p)}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <form
                className="flex items-end gap-[10px]"
                onSubmit={(e) => {
                  e.preventDefault();
                  send(input);
                }}
              >
                <label className="flex flex-1 flex-col">
                  <span className="sr-only">Ask Arche</span>
                  <input
                    ref={inputRef}
                    className="field"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Describe what is slowing the business down…"
                    data-cursor="ASK"
                  />
                </label>
                <button
                  className="btn flex-none"
                  disabled={!input.trim()}
                  data-cursor="START"
                  data-magnetic
                >
                  Send <span className="arw">→</span>
                </button>
              </form>
              <p className="mono mt-[12px]" style={{ color: "var(--faint)" }}>
                Intent-matched demo —{" "}
                <Link to="/contact" className="lnk mono-fg" style={{ color: "var(--fg)" }}>
                  start a real project →
                </Link>
              </p>
            </div>
          </div>

          {/* persistent visual trigger panel */}
          <div className="lg:col-span-5" data-r="meta" data-r-delay="100">
            <TriggerPanel trigger={trigger} runId={runId} busy={false} matched={matched} />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ================================================================
   Trigger panel — a persistent fixture that swaps content with the
   same scale/fade technique as the Services tab switch (Prompt 05):
   the outgoing layer settles (scale .96, fade), the incoming arrives
   from scale 1.04. All layers stay mounted; only emphasis moves.
   ================================================================ */
function TriggerPanel({ trigger, runId, busy, matched }: { trigger: VisualTrigger; runId: number; busy: boolean; matched: boolean }) {
  /* PROMPT 40 — only the matched intent's visual is mounted, keyed per reply,
     so every answer replays that visual's build-in. No skeleton state exists. */
  return (
    <div
      className="overflow-hidden rounded-[7px] border"
      style={{ borderColor: "var(--line)", background: "var(--card)" }}
      role="region"
      aria-label="Illustrative system view"
    >
      <div className="flex items-center justify-between border-b px-[16px] py-[12px]" style={{ borderColor: "var(--line)" }}>
        <div className="flex items-center gap-[9px]">
          <span className={`block h-[7px] w-[7px] rounded-full ${busy ? "demo-pulse" : ""}`} style={{ background: "var(--accent-deep)" }} />
          <span className="mono mono-fg">System view</span>
        </div>
        <span className="mono swap-fade" key={trigger} style={{ color: "var(--accent-ink)" }}>
          {TRIGGER_NAMES[trigger]}
        </span>
      </div>

      <div className="relative aspect-[5/4] w-full overflow-hidden">
        <div key={`${trigger}-${runId}`} className="sv-stage absolute inset-0">
          <TriggerVisual trigger={trigger} />
        </div>
      </div>

      <div className="border-t px-[16px] py-[10px]" style={{ borderColor: "var(--line)" }}>
        <p className="mono swap-fade" key={`${trigger}-cap`} style={{ color: "var(--faint)" }}>
          {trigger === "contact" && !matched
            ? "No intent matched — contact the team directly."
            : "Illustrative view · no live actions or connected tools."}
        </p>
      </div>
    </div>
  );
}

function TriggerVisual({ trigger }: { trigger: VisualTrigger }) {
  if (trigger === "service:web") return <MiniWeb />;
  if (trigger === "service:agent") return <MiniAgent />;
  if (trigger === "service:automation") return <MiniAuto />;
  if (trigger === "service:video") return <MiniVideo />;
  if (trigger === "contact") return <MiniContact />;
  return <MiniSystem />;
}

/** staggered build-in helper: element enters at `d` ms */
const at = (d: number): CSSProperties => ({ animationDelay: `${d}ms` });

/* ---------- SYSTEM (process / pricing / timeline / integrations) — hub & spokes ---------- */
function MiniSystem() {
  const nodes = [
    { k: "WEB", x: 50, y: 16 },
    { k: "AGENT", x: 84, y: 50 },
    { k: "AUTO", x: 50, y: 84 },
    { k: "CONTENT", x: 16, y: 50 },
  ];
  return (
    <div className="absolute inset-0">
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" fill="none">
        {nodes.map((n, i) => (
          <line key={n.k} className="sv-draw" pathLength={1} x1="50" y1="50" x2={n.x} y2={n.y} stroke="var(--accent-deep)" strokeWidth="0.6" style={at(200 + i * 120)} />
        ))}
        <circle className="sv-pop" cx="50" cy="50" r="7" fill="var(--fg)" style={at(0)} />
        <circle className="sv-pop" cx="50" cy="50" r="2" fill="var(--accent)" style={at(120)} />
      </svg>
      {nodes.map((n, i) => (
        <span
          key={n.k}
          className="sv-pop mono absolute rounded-full border px-[8px] py-[4px] text-[8px]"
          style={{ left: `${n.x}%`, top: `${n.y}%`, translate: "-50% -50%", borderColor: "var(--line)", color: "var(--muted)", background: "var(--bg)", ...at(500 + i * 120) }}
        >
          {n.k}
        </span>
      ))}
    </div>
  );
}

/* ---------- WEBSITE — compact IDEA → STRUCTURE → INTERFACE → LIVE (WebDevDemo) ---------- */
const WEB_PHASES = ["IDEA", "STRUCTURE", "INTERFACE", "LIVE"] as const;
function MiniWeb() {
  const [ph, setPh] = useState(0);
  useEffect(() => {
    if (prefersReducedMotion()) { setPh(3); return; }
    const ids = [1, 2, 3].map((n) => window.setTimeout(() => setPh(n), n * 750));
    return () => ids.forEach((t) => window.clearTimeout(t));
  }, []);
  const live = ph >= 3;
  const ui = ph >= 2;
  const wire = ph >= 1;
  const box = (extra: CSSProperties = {}): CSSProperties => ({
    border: `1px ${ui ? "solid" : "dashed"} ${wire ? "var(--line)" : "transparent"}`,
    background: ui ? "var(--bg-2)" : "transparent",
    borderRadius: 3,
    transition: "all .45s var(--e-out)",
    ...extra,
  });
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-[10px] px-[22px]">
      {/* phase rail */}
      <div className="flex w-full max-w-[250px] items-center justify-between">
        {WEB_PHASES.map((p, i) => (
          <span key={p} className="mono text-[7.5px]" style={{ color: i === ph ? "var(--accent-ink)" : i < ph ? "var(--muted)" : "var(--faint)", fontWeight: i === ph ? 700 : 400, transition: "color .3s" }}>
            {p}
          </span>
        ))}
      </div>
      {/* browser */}
      <div className="sv-pop w-full max-w-[250px] overflow-hidden rounded-[5px] border" style={{ borderColor: "var(--line)", background: "var(--bg)" }}>
        <div className="flex items-center gap-[4px] border-b px-[7px] py-[5px]" style={{ borderColor: "var(--line)" }}>
          {[0, 1, 2].map((i) => <span key={i} className="h-[4px] w-[4px] rounded-full" style={{ background: "var(--line)" }} />)}
          <span className="mono ml-[6px] flex flex-1 items-center gap-[4px] rounded-full px-[6px] py-[1px] text-[7px]" style={{ background: "var(--bg-2)", color: live ? "var(--fg)" : "var(--faint)" }}>
            {live && <span className="h-[4px] w-[4px] rounded-full" style={{ background: "var(--accent-deep)" }} />}
            {live ? "yourbrand.com" : "untitled"}
          </span>
        </div>
        <div className="relative flex h-[118px] flex-col gap-[6px] p-[9px]">
          {ph === 0 && (
            <div className="sv-pop absolute inset-0 grid place-items-center">
              <span className="h-[6px] w-[6px] rounded-full demo-pulse" style={{ background: "var(--accent-deep)" }} />
            </div>
          )}
          <div className="flex items-center justify-between" style={{ opacity: wire ? 1 : 0, transition: "opacity .4s" }}>
            <span style={box({ width: 26, height: 7 })} />
            <span className="flex gap-[4px]">{[0, 1, 2].map((i) => <span key={i} style={box({ width: 14, height: 4 })} />)}</span>
          </div>
          <div style={box({ height: 30, opacity: wire ? 1 : 0, display: "flex", flexDirection: "column", justifyContent: "center", gap: 4, padding: "0 7px" })}>
            <span style={{ height: 5, width: "62%", borderRadius: 2, background: ui ? "var(--fg)" : "transparent", transition: "background .4s" }} />
            <span style={{ height: 4, width: "40%", borderRadius: 2, background: ui ? "var(--muted)" : "transparent", transition: "background .4s .1s" }} />
          </div>
          <div className="grid flex-1 grid-cols-3 gap-[5px]" style={{ opacity: wire ? 1 : 0, transition: "opacity .4s .1s" }}>
            {[0, 1, 2].map((i) => <span key={i} style={box()} />)}
          </div>
          <span
            className="self-start rounded-full"
            style={{ height: 11, width: 50, background: ui ? "var(--accent-deep)" : "transparent", border: wire && !ui ? "1px dashed var(--line)" : "1px solid transparent", transition: "all .45s var(--e-out)", boxShadow: live ? "0 0 0 3px color-mix(in srgb, var(--accent-deep) 22%, transparent)" : "none" }}
          />
        </div>
      </div>
    </div>
  );
}

/* ---------- AGENT — QUESTION → REASONING → ACTION (AgentDemo language) ---------- */
function MiniAgent() {
  const steps = ["QUESTION", "MATCH", "HANDOFF"];
  return (
    <div className="absolute inset-0 flex flex-col justify-center gap-[14px] px-[22px]">
      <span className="sv-rise mono self-start rounded-[10px] rounded-bl-[2px] px-[9px] py-[5px] text-[8px]" style={{ background: "var(--bg-2)", color: "var(--fg)", border: "1px solid var(--line)", ...at(0) }}>
        “Can you qualify this inquiry?”
      </span>
      <div className="relative flex items-center justify-between">
        <span className="sv-grow absolute left-[8%] right-[8%] top-1/2 h-px origin-left" style={{ background: "var(--accent-deep)", ...at(350) }} />
        {steps.map((st, i) => (
          <span key={st} className="sv-pop relative flex flex-col items-center gap-[5px]" style={at(300 + i * 450)}>
            <span className="grid h-[22px] w-[22px] place-items-center rounded-full border" style={{ borderColor: "var(--accent-deep)", background: i === 1 ? "var(--accent-deep)" : "var(--bg)" }}>
              <span className={`h-[5px] w-[5px] rounded-full ${i === 1 ? "demo-pulse" : ""}`} style={{ background: i === 1 ? "var(--bg)" : "var(--accent-deep)" }} />
            </span>
            <span className="mono text-[7px]" style={{ color: "var(--muted)" }}>{st}</span>
          </span>
        ))}
      </div>
      <span className="sv-rise mono self-end flex items-center gap-[6px] rounded-[10px] rounded-br-[2px] px-[9px] py-[5px] text-[8px]" style={{ background: "var(--accent-deep)", color: "var(--bg)", ...at(1650) }}>
        Example: a handoff could be prepared
      </span>
    </div>
  );
}

/* ---------- AUTOMATION — one event splits into system updates (AutomationDemo) ---------- */
function MiniAuto() {
  const outs = [
    { k: "Sheet", y: 22 },
    { k: "CRM", y: 50 },
    { k: "Slack", y: 78 },
  ];
  return (
    <div className="absolute inset-0">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" fill="none">
        <path className="sv-draw" pathLength={1} d="M 20 50 L 46 50" stroke="var(--accent-deep)" strokeWidth="0.7" style={at(250)} />
        {outs.map((o, i) => (
          <path key={o.k} className="sv-draw" pathLength={1} d={`M 54 50 C 64 50, 62 ${o.y}, 72 ${o.y}`} stroke="var(--accent-deep)" strokeWidth="0.7" style={at(750 + i * 120)} />
        ))}
      </svg>
      {/* travelling signals — one event in, three updates out */}
      <span className="sv-signal-in absolute h-[6px] w-[6px] rounded-full" style={{ top: "50%", translate: "-50% -50%", background: "var(--accent)" }} />
      <span className="sv-pop mono absolute rounded-[4px] border px-[6px] py-[4px] text-[8px]" style={{ left: "13%", top: "50%", translate: "-50% -50%", borderColor: "var(--line)", background: "var(--bg)", color: "var(--fg)", ...at(0) }}>
        ✉ 1 event
      </span>
      <span className="sv-pop absolute grid h-[30px] w-[30px] place-items-center rounded-full border" style={{ left: "50%", top: "50%", translate: "-50% -50%", borderColor: "var(--accent-deep)", background: "var(--bg)", ...at(500) }}>
        <span className="mono text-[8px] font-bold" style={{ color: "var(--accent-ink)" }}>AI</span>
      </span>
      {outs.map((o, i) => (
        <span key={o.k} className="sv-pop mono absolute flex items-center gap-[5px] rounded-[4px] border px-[7px] py-[4px] text-[8px]" style={{ left: "84%", top: `${o.y}%`, translate: "-50% -50%", borderColor: "var(--accent-deep)", background: "var(--bg)", color: "var(--fg)", ...at(1150 + i * 150) }}>
          <span style={{ color: "var(--accent-ink)" }}>✓</span>
          {o.k}
        </span>
      ))}
    </div>
  );
}
function MiniVideo() {
  return (
    <div className="sv-pop absolute inset-0 flex flex-col items-center justify-center gap-[14px] px-[30px]">
      <div className="relative h-[34px] w-full max-w-[220px] overflow-hidden rounded-[4px]" style={{ background: "var(--bg-2)", border: "1px solid var(--line)" }}>
        <div className="flex h-full items-center justify-center gap-[3px]">
          {[9, 16, 11, 22, 14, 24, 18, 26, 15, 21, 12, 17, 10, 20, 13].map((h, i) => (
            <span
              key={i}
              className="tv-bar block w-[3px] rounded-full"
              style={{ height: h, background: i === 7 ? "var(--accent-deep)" : "var(--fg)", opacity: 0.75, animationDelay: `${i * 90}ms` }}
            />
          ))}
        </div>
        <span className="tv-head absolute top-0 bottom-0 w-px" style={{ background: "var(--accent)" }} />
      </div>
      <div className="flex w-full max-w-[220px] gap-[6px]">
        {[0, 1, 2].map((i) => (
          <span key={i} className="tv-clip block h-[22px] flex-1 rounded-[3px]" style={{ background: i === 1 ? "color-mix(in srgb, var(--accent-deep) 35%, var(--bg-2))" : "var(--line)" }} />
        ))}
      </div>
    </div>
  );
}

function MiniContact() {
  return (
    <div className="absolute inset-0 grid place-items-center p-[24px]">
      <div className="sv-rise flex w-full max-w-[240px] flex-col items-start gap-[12px] rounded-[6px] border border-dashed p-[16px]" style={{ borderColor: "var(--line)", background: "var(--bg-2)" }}>
        <span className="signal-dot" />
        <p className="body-s m-0" style={{ color: "var(--fg)" }}>
          Talk to the team about the next step.
        </p>
        <Link to="/contact" className="btn btn-ghost w-full justify-center" style={{ pointerEvents: "auto" }} cursor="START">
          Start a project <span className="arw">→</span>
        </Link>
      </div>
    </div>
  );
}
