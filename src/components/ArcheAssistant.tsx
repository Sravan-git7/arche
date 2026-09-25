import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { navigate } from "../lib/router";
import { gsap, prefersReducedMotion } from "../lib/gsap";

/**
 * PROMPT 16 — Ask Arche (Working Scripted Assistant)
 *
 * A frontend-only agent demo whose conversation drives a live system visualizer.
 * Properly scripted Q→thinking→tool-call→answer cadence with:
 *   - Typing dots during "thinking" phase
 *   - Named tool-call chip that flickers before the text body streams
 *   - Word-by-word streaming response
 *   - Quick-reply chips update after every answer
 *   - System visualizer responds to conversation context
 */
type NodeId = "web" | "agent" | "auto" | "content";
type Flow = { label: string; steps: string[] };
type Message = { role: "user" | "agent"; text: string; tool?: string; flow?: Flow; done?: boolean };

const STATUSES = ["Thinking", "Mapping", "Recommending", "Ready"];

const route = (q: string): { text: string; tool: string; flow: Flow; node: NodeId | null; followUps: string[] } => {
  const t = q.toLowerCase();
  if (t.includes("website") || t.includes("site"))
    return {
      node: "web",
      tool: "Service match · Web",
      flow: { label: "Website system", steps: ["Discover", "Structure", "Design", "Build", "Launch"] },
      text: "We start with what the site needs to do — the action it should create — then structure, design and build around it.",
      followUps: ["How does the design process work?", "What's the timeline?", "Can you rebuild an existing site?"],
    };
  if (t.includes("autom") || t.includes("workflow"))
    return {
      node: "auto",
      tool: "Workflow mapper",
      flow: { label: "Workflow mapper", steps: ["Trigger", "AI", "Action", "System"] },
      text: "Tell us the task your team repeats: what starts it, which tools it touches, and where a person must decide. We automate the rest.",
      followUps: ["What tools do you integrate with?", "How much does automation save?", "Can AI make decisions in the flow?"],
    };
  if (t.includes("chat") || t.includes("agent") || t.includes("bot"))
    return {
      node: "agent",
      tool: "Agent system",
      flow: { label: "Agent system", steps: ["Question", "Reason", "Tool", "Answer"] },
      text: "An Arche agent answers from your knowledge, asks when it's unsure, and can trigger a real action — routing, booking, qualifying.",
      followUps: ["Can it connect to my CRM?", "How do you handle wrong answers?", "What does setup look like?"],
    };
  if (t.includes("video") || t.includes("edit") || t.includes("content"))
    return {
      node: "content",
      tool: "Service match · Video",
      flow: { label: "Content system", steps: ["Raw", "Select", "Edit", "Publish"] },
      text: "We start with the footage you already have, select what matters, build the story, and finish it for where it will live.",
      followUps: ["How fast is turnaround?", "Do you handle short-form and long-form?", "Can you repurpose one video into many?"],
    };
  if (t.includes("project") || t.includes("process") || t.includes("start"))
    return {
      node: null,
      tool: "Project flow",
      flow: { label: "Project flow", steps: ["Brief", "Scope", "Proposal", "Build", "Launch"] },
      text: "Send a short brief. We clarify scope, send a written proposal and timeline, and start after approval.",
      followUps: ["How long does a project take?", "What does pricing look like?", "Can I start with just one service?"],
    };
  if (t.includes("timeline") || t.includes("how long") || t.includes("fast"))
    return {
      node: null,
      tool: "Project estimator",
      flow: { label: "Timeline", steps: ["Scope", "Quote", "Build", "Ship"] },
      text: "Edits ship in days. Landing pages in about two weeks. Full sites, automations and agents typically two to eight weeks depending on scope.",
      followUps: ["I need a website.", "I want to automate my workflow.", "How does a project work?"],
    };
  if (t.includes("pric") || t.includes("cost") || t.includes("budget"))
    return {
      node: null,
      tool: "Pricing lookup",
      flow: { label: "Pricing", steps: ["Scope", "Quote", "Confirm"] },
      text: "Some work has a defined package. Custom work is quoted after a short conversation — scope, timeline and investment in writing before anything starts.",
      followUps: ["I need a website.", "I want to automate my workflow.", "Start a project."],
    };
  if (t.includes("design") || t.includes("how"))
    return {
      node: "web",
      tool: "Process lookup",
      flow: { label: "Design → Build", steps: ["Research", "IA", "Design", "Motion", "Code"] },
      text: "Information structure before any visual design. Typography, layout and motion are designed as one system. Then we hand-build the front-end — no page-builder bloat.",
      followUps: ["What's the timeline?", "I need a website.", "Start a project."],
    };
  if (t.includes("tool") || t.includes("integrat") || t.includes("crm"))
    return {
      node: "auto",
      tool: "Integration mapper",
      flow: { label: "Integrations", steps: ["CRM", "Email", "Sheets", "APIs", "Custom"] },
      text: "We connect to the tools you already run — CRMs, inboxes, sheets, APIs. The automation wraps around your existing stack, it doesn't replace it.",
      followUps: ["I want to automate my workflow.", "Can AI make decisions?", "Start a project."],
    };
  return {
    node: null,
    tool: "Capability router",
    flow: { label: "Capability router", steps: ["Friction", "Entry point", "First build", "Connect"] },
    text: "Start with the friction. Visitors who don't act → Web. Repeated admin → Automation. Repeated questions → an Agent. Footage that never ships → Video.",
    followUps: ["I need a website.", "I want to automate my workflow.", "I need an AI chatbot.", "I need video editing."],
  };
};

const INITIAL_PROMPTS = ["I need a website.", "I want to automate my workflow.", "I need an AI chatbot.", "I need video editing.", "How does a project work?"];

export function ArcheAssistant() {
  const [messages, setMessages] = useState<Message[]>([{ role: "agent", text: "Ask me where Arche could start.", done: true }]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [node, setNode] = useState<NodeId | null>(null);
  const [prompts, setPrompts] = useState<string[]>(INITIAL_PROMPTS);
  const [toolLabel, setToolLabel] = useState<string | null>(null);
  const timers = useRef<number[]>([]);
  const scroller = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const list = timers.current;
    return () => list.forEach((t) => window.clearTimeout(t));
  }, []);
  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [messages, status, toolLabel]);

  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms));
  const busy = status !== null || messages[messages.length - 1]?.done === false;

  const send = (raw: string) => {
    const q = raw.trim();
    if (!q || busy) return;
    const r = route(q);
    setMessages((m) => [...m, { role: "user", text: q, done: true }]);
    setInput("");
    setToolLabel(null);

    // Phase 1: Thinking status progression
    STATUSES.forEach((s, i) => later(() => setStatus(s), i * 350));

    // Phase 2: Set active node
    later(() => setNode(r.node), 700);

    // Phase 3: Show tool-call chip
    later(() => setToolLabel(r.tool), STATUSES.length * 350 - 150);

    // Phase 4: Stream the response word-by-word
    later(() => {
      setStatus(null);
      setToolLabel(null);
      setMessages((m) => [...m, { role: "agent", text: "", tool: r.tool, flow: r.flow, done: false }]);
      const words = r.text.split(" ");
      words.forEach((_, wi) =>
        later(() => {
          setMessages((m) => {
            const next = [...m];
            const last = next[next.length - 1];
            next[next.length - 1] = { ...last, text: words.slice(0, wi + 1).join(" "), done: wi === words.length - 1 };
            return next;
          });
          // Phase 5: Update follow-up chips after streaming completes
          if (wi === words.length - 1) {
            setPrompts(r.followUps);
          }
        }, wi * 26)
      );
    }, STATUSES.length * 350 + 50);
  };

  const reset = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
    setMessages([{ role: "agent", text: "Ask me where Arche could start.", done: true }]);
    setStatus(null);
    setNode(null);
    setToolLabel(null);
    setPrompts(INITIAL_PROMPTS);
    inputRef.current?.focus();
  };

  return (
    <section className="w-full py-[clamp(70px,9vw,140px)]">
      <div className="wrap grid gap-[clamp(26px,4vw,70px)] lg:grid-cols-12">
        <div className="flex flex-col gap-[20px] lg:col-span-4">
          <div>
            <p className="mono mono-a mb-[12px]">Ask Arche</p>
            <h2 className="d2 max-w-[10ch]" data-r="mask">See an agent move the conversation forward.</h2>
            <p className="body mt-[18px] max-w-[34ch]" data-r="meta">
              A working demo. The conversation drives the system beside it — ready for a model API when connected.
            </p>
          </div>
          <LiveSystem node={node} busy={status !== null} />
        </div>

        <div className="overflow-hidden rounded-[7px] border lg:col-span-8" style={{ borderColor: "var(--line)", background: "var(--card)" }}>
          {/* Header bar */}
          <div className="flex items-center justify-between border-b px-[16px] py-[12px]" style={{ borderColor: "var(--line)" }}>
            <div className="flex items-center gap-[9px]">
              <span className={`block h-[7px] w-[7px] rounded-full ${status ? "animate-pulse" : ""}`} style={{ background: "var(--accent-deep)" }} />
              <span className="mono mono-fg">Arche assistant</span>
              <span className="mono">· {status ?? (busy ? "Responding" : "Ready")}</span>
            </div>
            <button className="mono lnk" onClick={reset}>Reset</button>
          </div>

          {/* Messages */}
          <div ref={scroller} className="max-h-[440px] min-h-[320px] space-y-[14px] overflow-y-auto p-[16px]" aria-live="polite" data-cursor="ASK">
            {messages.map((m, i) => (
              <div key={i} className={`demo-in flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className="max-w-[84%]">
                  {m.tool && <p className="mono mb-[6px]" style={{ color: "var(--accent-deep)" }}>● {m.tool}</p>}
                  <p
                    className="m-0 px-[13px] py-[10px] text-[14px] leading-[1.55]"
                    style={{
                      borderRadius: m.role === "user" ? "15px 15px 4px 15px" : "15px 15px 15px 4px",
                      background: m.role === "user" ? "var(--fg)" : "var(--bg-2)",
                      color: m.role === "user" ? "var(--bg)" : "var(--fg)",
                    }}
                  >
                    {m.text || "…"}
                  </p>
                  {m.flow && m.done && (
                    <div className="demo-in mt-[8px] rounded-[6px] border p-[10px]" style={{ borderColor: "var(--line)" }}>
                      <p className="mono mb-[8px]">{m.flow.label}</p>
                      <div className="flex flex-wrap items-center gap-[6px]">
                        {m.flow.steps.map((s, si) => (
                          <span key={s} className="flex items-center gap-[6px]" style={{ animation: `demoIn .45s var(--e-out) ${si * 90}ms both` }}>
                            <span className="mono rounded-full border px-[8px] py-[3px]" style={{ borderColor: si === m.flow!.steps.length - 1 ? "var(--accent-deep)" : "var(--line)", color: si === m.flow!.steps.length - 1 ? "var(--accent-deep)" : "var(--fg)" }}>
                              {s}
                            </span>
                            {si < m.flow!.steps.length - 1 && <span className="mono">→</span>}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {/* Thinking indicators */}
            {status && (
              <div className="demo-in flex flex-col gap-[6px]">
                <div className="flex items-center gap-[8px]">
                  <span className="flex gap-[4px]">
                    {[0, 1, 2].map((i) => (
                      <span key={i} className="h-[5px] w-[5px] animate-pulse rounded-full" style={{ background: "var(--accent-deep)", animationDelay: `${i * 120}ms` }} />
                    ))}
                  </span>
                  <span className="mono" style={{ color: "var(--accent-deep)" }}>{status}</span>
                </div>
                {/* Tool call chip flickers in during final status phase */}
                {toolLabel && (
                  <span
                    className="demo-in mono inline-flex w-fit items-center gap-[6px] rounded-full border px-[10px] py-[4px]"
                    style={{
                      borderColor: "var(--accent-deep)",
                      color: "var(--accent-deep)",
                      background: "color-mix(in srgb, var(--accent-deep) 10%, transparent)",
                      animation: "demoIn .3s var(--e-out) both",
                    }}
                  >
                    ⚡ {toolLabel}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Input area */}
          <div className="border-t p-[16px]" style={{ borderColor: "var(--line)" }}>
            <div className="mb-[12px] flex flex-wrap gap-[7px]">
              {prompts.map((p) => (
                <button key={p} className="chip" disabled={busy} style={{ opacity: busy ? 0.5 : 1 }} onClick={() => send(p)}>
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
                <input ref={inputRef} className="field" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Describe what is slowing the business down…" />
              </label>
              <button className="btn" disabled={!input.trim() || busy} data-cursor="ASK">
                Send <span className="arw">→</span>
              </button>
            </form>
            <button className="mono lnk mt-[12px]" onClick={() => navigate("/contact")}>Start a real project →</button>
          </div>
        </div>
      </div>
    </section>
  );
}

const LS_NODES: { id: NodeId; k: string; x: number; y: number }[] = [
  { id: "web", k: "Website", x: 50, y: 14 },
  { id: "agent", k: "AI Agent", x: 86, y: 50 },
  { id: "auto", k: "Automation", x: 50, y: 86 },
  { id: "content", k: "Content", x: 14, y: 50 },
];

/** The conversation literally controls this system. */
function LiveSystem({ node, busy }: { node: NodeId | null; busy: boolean }) {
  const pulse = useRef<SVGCircleElement>(null);
  const pathRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    const c = pulse.current;
    if (!c || prefersReducedMotion()) return;
    const n = LS_NODES.find((x) => x.id === node);
    if (!n) {
      gsap.set(c, { opacity: 0 });
      return;
    }
    const tw = gsap.fromTo(c, { attr: { cx: n.x, cy: n.y }, opacity: 1 }, { attr: { cx: 50, cy: 50 }, duration: 1.1, ease: "power2.inOut", repeat: -1, repeatDelay: 0.3 });
    return () => {
      tw.kill();
    };
  }, [node]);

  // Animate path trace to active node
  useEffect(() => {
    if (!pathRef.current || prefersReducedMotion()) return;
    const n = LS_NODES.find((x) => x.id === node);
    if (!n) {
      gsap.to(pathRef.current, { opacity: 0, duration: 0.3 });
      return;
    }
    // Animate a highlighted ring around active node
    gsap.fromTo(
      pathRef.current,
      { attr: { cx: n.x, cy: n.y, r: 3 }, opacity: 0.8 },
      { attr: { r: 8 }, opacity: 0, duration: 1.2, ease: "power2.out", repeat: 2 }
    );
  }, [node]);

  return (
    <div className="relative hidden aspect-square w-full max-w-[300px] rounded-[6px] border lg:block" style={{ borderColor: "var(--line)", background: "var(--bg-2)" }} aria-hidden>
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
        {LS_NODES.map((n) => (
          <line key={n.id} x1={n.x} y1={n.y} x2="50" y2="50" stroke={node === n.id ? "var(--accent-deep)" : "var(--line)"} strokeWidth={node === n.id ? 0.8 : 0.4} style={{ transition: "stroke .4s, stroke-width .4s" }} />
        ))}
        <circle ref={pulse} r="1.8" cx="50" cy="50" fill="var(--accent-deep)" opacity="0" />
        <circle ref={pathRef as any} r="4" cx="50" cy="50" fill="none" stroke="var(--accent-deep)" strokeWidth="0.6" opacity="0" />
        <circle cx="50" cy="50" r={busy ? 7 : 6} fill="var(--fg)" style={{ transition: "r .3s" }} />
        <circle cx="50" cy="50" r="1.8" fill="var(--accent)" />
      </svg>
      {LS_NODES.map((n) => {
        const on = node === n.id;
        return (
          <span
            key={n.id}
            className="mono absolute rounded-full border px-[8px] py-[4px]"
            style={{
              left: `${n.x}%`,
              top: `${n.y}%`,
              transform: `translate(-50%,-50%) scale(${on ? 1.08 : 1})`,
              borderColor: on ? "var(--accent-deep)" : "var(--line)",
              color: on ? "var(--accent-deep)" : "var(--faint)",
              background: "var(--bg)",
              fontSize: 9,
              transition: "all .4s var(--e-out)",
              boxShadow: on ? "0 0 12px color-mix(in srgb, var(--accent-deep) 40%, transparent)" : "none",
            }}
          >
            {n.k}
          </span>
        );
      })}
      <span className="mono absolute bottom-[8px] left-1/2 -translate-x-1/2 transition-colors duration-400" style={{ fontSize: 9, color: node ? "var(--accent-deep)" : "var(--faint)" }}>
        {node ? "Path active" : "Waiting for a question"}
      </span>
    </div>
  );
}
