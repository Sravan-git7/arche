import { useEffect, useRef, useState, type ReactNode, type PointerEvent as RPointerEvent } from "react";
import { prefersReducedMotion } from "../lib/gsap";

/**
 * PROMPT 43 — Arche Labs, rebuilt. Five new sketches, five different
 * input mechanics (none of the retired Router / Field / Cluster / State
 * Machine / Scrubber mechanics survive):
 *
 *   01 Load Balancer   — slider      · workers scale to traffic, queue forms past capacity
 *   02 Failover        — click-to-kill · traffic reroutes; kill both → honest "no path"
 *   03 Live Parser     — typing      · unstructured text → structured tags, live
 *   04 Manual vs Auto  — urgent repeated clicking · YOU are the manual bottleneck
 *   05 Build a Flow    — drag & drop construction · RUN validates honestly
 *
 * Rendering follows Prompt 42's light language (glow-behind-core lines,
 * point-light nodes, spring settles, travelling pulses) — every glow maps
 * to real state: a worker that is busy, a path carrying traffic, a field
 * that was extracted, a checkpoint being processed, a block executing.
 * All five are deliberately small toys, not previews of a product.
 */

const LAB_SPRING = "cubic-bezier(0.34, 1.32, 0.64, 1)";
const LIME = "#c8f14f";
const HOT = "#fafcf0";
const FAULT = "#ff7a66"; // used only for genuinely failed state (Failover, invalid flow)
const pointLight = (a = 1, c = "200,241,79") =>
  `radial-gradient(circle, rgba(250,252,240,${a}) 0 16%, rgba(${c},${0.85 * a}) 34%, rgba(${c},${0.22 * a}) 58%, transparent 72%)`;
const reduced = () => prefersReducedMotion();
const mono = "mono";
const dim = "rgba(244,242,237,0.5)";
const faint = "rgba(244,242,237,0.32)";

export function Labs() {
  return (
    <section className="w-full py-[clamp(64px,8vw,120px)] on-ink bg-[#0c0c0d] text-[#f4f2ed]">
      <div className="wrap">
        <div className="mb-[clamp(32px,4vw,56px)] flex flex-wrap items-end justify-between gap-[20px] border-b pb-[20px]" style={{ borderColor: "var(--line)" }}>
          <div>
            <div className="flex items-center gap-[10px] mb-[8px]">
              <span className="mono mono-a">ARCHE LABS</span>
              <span className="mono">·</span>
              <span className="mono" style={{ color: "var(--accent)" }}>5 PLAYABLE SKETCHES</span>
            </div>
            <h2 className="d2 max-w-[18ch]" data-r="mask">
              Playable experiments & system prototypes.
            </h2>
          </div>
          <p className="body max-w-[42ch]" style={{ color: "rgba(244, 242, 237, 0.65)" }} data-r="meta">
            Not deliverables or case studies. Small working prototypes — slide, break, type, race and build to see real system behaviour.
          </p>
        </div>

        <div className="grid gap-[20px] sm:grid-cols-2 lg:grid-cols-3">
          <LabCard tag="SKETCH 01" title="Load Balancer" subtitle="Slide the traffic">
            <LoadBalancerLab />
          </LabCard>
          <LabCard tag="SKETCH 02" title="Failover" subtitle="Click a node to kill it">
            <FailoverLab />
          </LabCard>
          <LabCard tag="SKETCH 03" title="Live Parser" subtitle="Just start typing">
            <LiveParserLab />
          </LabCard>
          <LabCard tag="SKETCH 04" title="Manual vs Automated" subtitle="You are the bottleneck">
            <RaceLab />
          </LabCard>
          <LabCard tag="SKETCH 05" title="Build a Flow" subtitle="Drag blocks, then run">
            <BuildFlowLab />
          </LabCard>
        </div>
      </div>
    </section>
  );
}

function LabCard({ tag, title, subtitle, children }: { tag: string; title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="lab-card-v2 group relative flex flex-col justify-between rounded-[8px] border p-[18px]" style={{ borderColor: "var(--line)", background: "#141416", minHeight: 360 }}>
      <div className="mb-[12px] flex items-center justify-between">
        <span className="mono rounded-full border px-[8px] py-[3px] text-[9.5px]" style={{ borderColor: "rgba(244, 242, 237, 0.2)", color: "var(--accent)" }}>
          {tag}
        </span>
        <span className="mono text-[10px]" style={{ color: "rgba(244, 242, 237, 0.45)" }}>
          {subtitle}
        </span>
      </div>
      <div className="lab-stage relative my-[8px] flex-1 flex flex-col overflow-hidden rounded-[6px] border p-[12px]" style={{ borderColor: "rgba(244, 242, 237, 0.08)", background: "#0c0c0d" }}>
        <span className="lab-atmos pointer-events-none absolute inset-[-8px]" aria-hidden />
        <div className="relative flex flex-1 flex-col">{children}</div>
      </div>
      <div className="mt-[12px] flex items-center justify-between pt-[10px] border-t" style={{ borderColor: "rgba(244, 242, 237, 0.08)" }}>
        <h3 className="mono font-medium text-[13px] text-[#f4f2ed]">{title}</h3>
        <span className="mono text-[10px]" style={{ color: "var(--accent)" }}>
          Interactive →
        </span>
      </div>
    </div>
  );
}

/* tiny rAF hook: calls fn(dt seconds) every frame while `on` */
function useFrame(fn: (dt: number) => void, on = true) {
  const ref = useRef(fn);
  ref.current = fn;
  useEffect(() => {
    if (!on) return;
    let raf = 0;
    let last = performance.now();
    const loop = (t: number) => {
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      ref.current(dt);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [on]);
}

/* ================================================================
   01 — LOAD BALANCER
   Traffic (0–100%) arrives at up to 120 req/s. Each worker absorbs
   15 req/s. The autoscaler adds a worker every 0.25s while demand
   exceeds capacity and retires one every 0.6s once the queue is empty
   and capacity is comfortably spare. Max capacity (8 × 15 = 120) is
   reached at 100%; spikes while scaling, or sustained >~95%, queue.
   ================================================================ */
const WORKERS = 8;
const PER_WORKER = 15;

function LoadBalancerLab() {
  const [traffic, setTraffic] = useState(0);
  const sim = useRef({ active: 0, queue: 0, scaleT: 0, util: 0 });
  const [, force] = useState(0);
  const [pops, setPops] = useState<number[]>(Array(WORKERS).fill(0));

  useFrame((dt) => {
    const s = sim.current;
    const demand = (traffic / 100) * 128; // headroom: 100% slightly exceeds max capacity
    const cap = s.active * PER_WORKER;
    const want = Math.min(WORKERS, Math.ceil((demand + s.queue * 0.5) / PER_WORKER));
    s.scaleT += dt;
    if (want > s.active && (s.scaleT > 0.18 || s.active === 0)) {
      s.active++;
      s.scaleT = 0;
      const i = s.active - 1;
      setPops((p) => p.map((v, k) => (k === i ? v + 1 : v)));
    } else if (want < s.active && s.queue < 0.5 && s.scaleT > 0.6) {
      s.active--;
      s.scaleT = 0;
    }
    // backlog grows with unmet demand; spare capacity drains it quickly
    const net = demand - cap;
    s.queue = Math.max(0, s.queue + (net > 0 ? net * 0.22 : net * 0.9) * dt);
    s.queue = Math.min(s.queue, 40);
    s.util = cap ? Math.min(1, demand / cap) : 0;
    force((n) => n + 1);
  }, traffic > 0 || sim.current.active > 0 || sim.current.queue > 0);

  const s = sim.current;
  const q = Math.round(s.queue);
  const saturated = s.active === WORKERS && q > 0;
  return (
    <div className="flex flex-1 flex-col justify-between gap-[12px]">
      <div>
        <div className="mb-[4px] flex items-center justify-between">
          <span className={`${mono} text-[9px] tracking-wider`} style={{ color: dim }}>INCOMING TRAFFIC</span>
          <span className={`${mono} text-[10px] font-bold`} style={{ color: LIME }}>{traffic}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={traffic}
          onChange={(e) => setTraffic(Number(e.target.value))}
          className="lab-range w-full cursor-pointer"
          aria-label="Incoming traffic"
        />
      </div>

      {/* request bus → workers */}
      <div className="relative">
        <div className="relative mx-[6px] h-[10px]">
          <div className="absolute inset-x-0 top-1/2 h-[5px] -translate-y-1/2 rounded-full" style={{ background: LIME, filter: "blur(3px)", opacity: 0.05 + (traffic / 100) * 0.3 }} />
          <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2" style={{ background: `rgba(232,250,180,${0.2 + (traffic / 100) * 0.5})` }} />
        </div>
        <div className="grid grid-cols-8 gap-[6px]">
          {Array.from({ length: WORKERS }).map((_, i) => {
            const on = i < s.active;
            const load = on ? s.util : 0;
            return (
              <div key={i} className="flex flex-col items-center gap-[5px]">
                {/* feeder line carries pulses only into busy workers */}
                <div className="relative h-[16px] w-px" style={{ background: on ? "rgba(232,250,180,.45)" : "rgba(244,242,237,.08)" }}>
                  {on && load > 0.05 && !reduced() && (
                    <span className="lab-feed absolute left-1/2 h-[7px] w-[7px] -translate-x-1/2 rounded-full" style={{ background: pointLight(1), animationDuration: `${(1.1 - load * 0.7).toFixed(2)}s`, animationDelay: `${i * 90}ms` }} />
                  )}
                </div>
                <div
                  className="relative grid aspect-[3/4] w-full place-items-center rounded-[4px] border"
                  style={{
                    borderColor: on ? `rgba(200,241,79,${0.4 + load * 0.5})` : "rgba(244,242,237,.1)",
                    background: on ? `rgba(200,241,79,${0.04 + load * 0.1})` : "#111113",
                    boxShadow: on ? `0 0 ${6 + load * 12}px rgba(200,241,79,${0.1 + load * 0.25})` : "none",
                    transform: on ? "scale(1)" : "scale(.92)",
                    transition: `transform .5s ${LAB_SPRING}, border-color .3s, background .3s, box-shadow .3s`,
                  }}
                >
                  {pops[i] > 0 && on && <span key={pops[i]} className="lab-flash pointer-events-none absolute inset-0 rounded-[4px]" />}
                  <span className="h-[12px] w-[12px] rounded-full" style={{ background: on ? pointLight(0.5 + load * 0.5) : "radial-gradient(circle, rgba(244,242,237,.18) 0 25%, transparent 60%)" }} />
                </div>
                <span className={`${mono} text-[7px]`} style={{ color: on ? "rgba(244,242,237,.6)" : faint }}>W{i + 1}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* queue */}
      <div className="flex min-h-[26px] items-center gap-[8px]">
        <span className={`${mono} flex-none text-[8px]`} style={{ color: q ? LIME : faint }}>QUEUE</span>
        <div className="flex flex-wrap gap-[3px]">
          {Array.from({ length: Math.min(q, 32) }).map((_, i) => (
            <span key={i} className="lab-q-in block h-[6px] w-[6px] rounded-[1px]" style={{ background: saturated ? "rgba(244,242,237,.75)" : "rgba(200,241,79,.7)" }} />
          ))}
          {q === 0 && <span className={`${mono} text-[8px]`} style={{ color: faint }}>empty</span>}
        </div>
      </div>

      <div className="rounded-[4px] border px-[8px] py-[6px]" style={{ borderColor: "rgba(244,242,237,0.08)", background: "#141416" }}>
        <p className={`${mono} text-[9px] leading-[1.5]`} style={{ color: "rgba(244,242,237,.7)" }} aria-live="polite">
          <strong style={{ color: LIME }}>{s.active}/{WORKERS}</strong> workers active · queue: <strong style={{ color: q ? "#f4f2ed" : faint }}>{q}</strong>
          <span style={{ color: faint }}>
            {" "}· {traffic === 0 ? "idle" : saturated ? "at capacity — queue absorbing the spike" : q ? "scaling up…" : s.active ? "keeping pace" : "warming up"}
          </span>
        </p>
      </div>
    </div>
  );
}

/* ================================================================
   02 — FAILOVER
   PRIMARY → OUTPUT by default. Kill PRIMARY: route redraws through
   BACKUP. Nodes self-recover after 5s; traffic fails back to PRIMARY
   once it is healthy. Kill both: OUTPUT honestly degrades.
   ================================================================ */
type NodeId = "primary" | "backup";
const RECOVER_MS = 5000;

function FailoverLab() {
  const [down, setDown] = useState<Record<NodeId, number>>({ primary: 0, backup: 0 }); // timestamp killed, 0 = up
  const [now, setNow] = useState(performance.now());
  const [log, setLog] = useState("Traffic flowing PRIMARY → OUTPUT. Click PRIMARY to kill it.");
  const anyDown = down.primary || down.backup;
  useFrame(() => setNow(performance.now()), !!anyDown);

  // self-recovery
  useEffect(() => {
    (["primary", "backup"] as NodeId[]).forEach((n) => {
      if (down[n] && now - down[n] > RECOVER_MS) {
        setDown((d) => ({ ...d, [n]: 0 }));
        setLog(n === "primary" ? "PRIMARY recovered — health checks pass, traffic failed back." : "BACKUP recovered — standing by again.");
      }
    });
  }, [now, down]);

  const route: NodeId | null = !down.primary ? "primary" : !down.backup ? "backup" : null;
  const kill = (n: NodeId) => {
    if (down[n]) return;
    const t = performance.now();
    setNow(t);
    setDown((d) => ({ ...d, [n]: t }));
    const other = n === "primary" ? "backup" : "primary";
    if (down[other]) setLog("Both nodes down — OUTPUT has no path. This is the limit of this setup.");
    else if (n === "primary") setLog("PRIMARY killed — rerouting through BACKUP. No request dropped.");
    else setLog("BACKUP killed — PRIMARY still serving. Kill it too to see the limit.");
  };

  const P = { x: 22, y: 26 }, B = { x: 22, y: 78 }, O = { x: 80, y: 52 };
  const pathOf = (a: { x: number; y: number }) => `M ${a.x} ${a.y} C ${(a.x + O.x) / 2} ${a.y}, ${(a.x + O.x) / 2} ${O.y}, ${O.x} ${O.y}`;
  const node = (id: NodeId, at: { x: number; y: number }, label: string) => {
    const isDown = !!down[id];
    const left = isDown ? Math.max(0, RECOVER_MS - (now - down[id])) : 0;
    const serving = route === id;
    return (
      <g
        role="button"
        tabIndex={0}
        aria-label={`${label} node — ${isDown ? "down" : "click to kill"}`}
        onClick={() => kill(id)}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), kill(id))}
        style={{ cursor: isDown ? "default" : "pointer", outline: "none" }}
        className="lab-svg-node"
      >
        <circle cx={at.x} cy={at.y} r="11" fill="transparent" />
        {serving && <circle cx={at.x} cy={at.y} r="9" fill="url(#fo-glow)" />}
        <circle
          cx={at.x} cy={at.y} r="6.5"
          fill={isDown ? "rgba(255,122,102,.12)" : "#141416"}
          stroke={isDown ? FAULT : serving ? LIME : "rgba(244,242,237,.35)"}
          strokeWidth="0.8"
          style={{ transition: "stroke .3s, fill .3s" }}
        />
        <circle cx={at.x} cy={at.y} r="2.2" fill={isDown ? "rgba(255,122,102,.55)" : serving ? HOT : "rgba(244,242,237,.45)"} />
        {isDown && (
          <circle cx={at.x} cy={at.y} r="9" fill="none" stroke={FAULT} strokeWidth="0.6" strokeDasharray={`${(1 - left / RECOVER_MS) * 56.5} 56.5`} transform={`rotate(-90 ${at.x} ${at.y})`} opacity="0.8" />
        )}
        <text x={at.x} y={at.y + 15.5} textAnchor="middle" className="mono" fontSize="4" fill={isDown ? FAULT : serving ? LIME : dim}>
          {label}
        </text>
        <text x={at.x} y={at.y + 20.5} textAnchor="middle" className="mono" fontSize="3.1" fill={faint}>
          {isDown ? `recovering ${Math.ceil(left / 1000)}s` : serving ? "serving" : "standby"}
        </text>
      </g>
    );
  };

  return (
    <div className="flex flex-1 flex-col justify-between gap-[8px]">
      <svg viewBox="0 0 100 100" className="w-full flex-1 select-none" style={{ maxHeight: 210 }} aria-label="Failover diagram">
        <defs>
          <radialGradient id="fo-glow">
            <stop offset="0" stopColor={LIME} stopOpacity=".5" />
            <stop offset="1" stopColor={LIME} stopOpacity="0" />
          </radialGradient>
          <radialGradient id="fo-pl">
            <stop offset="0" stopColor={HOT} />
            <stop offset=".4" stopColor={LIME} stopOpacity=".85" />
            <stop offset="1" stopColor={LIME} stopOpacity="0" />
          </radialGradient>
          <path id="fo-p" d={pathOf(P)} />
          <path id="fo-b" d={pathOf(B)} />
        </defs>
        {/* idle (unrouted) links */}
        {(["primary", "backup"] as NodeId[]).map((id) => (
          <path key={id} d={pathOf(id === "primary" ? P : B)} fill="none" stroke={down[id] ? "rgba(255,122,102,.25)" : "rgba(244,242,237,.12)"} strokeWidth="0.6" strokeDasharray={down[id] ? "1.5 2" : undefined} />
        ))}
        {/* live route — redraws along the new path whenever the route changes */}
        {route && (
          <g key={route}>
            <path d={pathOf(route === "primary" ? P : B)} fill="none" stroke="rgba(200,241,79,.35)" strokeWidth="3" pathLength={1} className="lab-route" style={{ filter: "blur(1.2px)" }} />
            <path d={pathOf(route === "primary" ? P : B)} fill="none" stroke="rgba(240,252,210,.95)" strokeWidth="0.7" pathLength={1} className="lab-route" />
            {!reduced() &&
              [0, 0.33, 0.66].map((d) => (
                <circle key={d} r="2.4" fill="url(#fo-pl)">
                  <animateMotion dur="1.2s" begin={`${0.7 + d * 1.2}s`} repeatCount="indefinite">
                    <mpath href={route === "primary" ? "#fo-p" : "#fo-b"} />
                  </animateMotion>
                </circle>
              ))}
          </g>
        )}
        {node("primary", P, "PRIMARY")}
        {node("backup", B, "BACKUP")}
        {/* OUTPUT */}
        <g>
          {route && <circle cx={O.x} cy={O.y} r="10" fill="url(#fo-glow)" />}
          <rect x={O.x - 8} y={O.y - 6} width="16" height="12" rx="2" fill={route ? "#141416" : "rgba(255,122,102,.08)"} stroke={route ? LIME : FAULT} strokeWidth="0.8" className={route ? "" : "lab-degraded"} />
          <text x={O.x} y={O.y + 1.3} textAnchor="middle" className="mono" fontSize="3.4" fill={route ? LIME : FAULT}>
            {route ? "200 OK" : "NO PATH"}
          </text>
          <text x={O.x} y={O.y + 13} textAnchor="middle" className="mono" fontSize="4" fill={route ? dim : FAULT}>
            OUTPUT
          </text>
          <text x={O.x} y={O.y + 18} textAnchor="middle" className="mono" fontSize="3.1" fill={faint}>
            {route ? `via ${route}` : "degraded"}
          </text>
        </g>
      </svg>
      <div className="rounded-[4px] border px-[8px] py-[6px]" style={{ borderColor: route ? "rgba(244,242,237,0.08)" : "rgba(255,122,102,.35)", background: "#141416" }}>
        <p key={log} className={`${mono} swap-fade text-[9px] leading-[1.5]`} style={{ color: route ? "rgba(244,242,237,.7)" : FAULT }} aria-live="polite">
          {log}
        </p>
      </div>
    </div>
  );
}

/* ================================================================
   03 — LIVE PARSER
   Plain pattern matching (not NLP) — the copy says so. Every keystroke
   re-extracts; new fields pop in, removed ones leave.
   ================================================================ */
type Field = { k: string; v: string };
const EXAMPLE = "need a website for my bakery, budget 50k, contact me at a@b.com by next month";

function extract(t: string): Field[] {
  const out: Field[] = [];
  const low = t.toLowerCase();
  const intents: [RegExp, string][] = [
    [/\b(web ?site|landing page|web app|site)\b/, "WEBSITE"],
    [/\b(automat\w*|workflow|zapier)\b/, "AUTOMATION"],
    [/\b(chat ?bot|bot|ai agent|agent|assistant)\b/, "AI AGENT"],
    [/\b(video|reel|edit\w*)\b/, "VIDEO"],
  ];
  const seen = new Set<string>();
  intents.forEach(([re, v]) => { if (re.test(low) && !seen.has(v)) { seen.add(v); out.push({ k: "INTENT", v }); } });
  const email = t.match(/[\w.+-]+@[\w-]+\.[a-z]{2,}/i);
  if (email) out.push({ k: "EMAIL", v: email[0] });
  const money = t.match(/(?:₹|rs\.?|inr|\$|usd)\s?(\d[\d,.]*)\s?(k|l|lakh|lakhs|m)?\b|budget\D{0,12}(\d[\d,.]*)\s?(k|l|lakh|lakhs|m)?\b|\b(\d[\d,.]*)\s?(k|lakh|lakhs)\b/i);
  if (money) {
    const num = money[1] ?? money[3] ?? money[5];
    const unit = (money[2] ?? money[4] ?? money[6] ?? "").toLowerCase();
    const cur = /\$|usd/i.test(money[0]) ? "$" : "₹";
    const n = parseFloat(num.replace(/,/g, "")) * (unit === "k" ? 1e3 : unit.startsWith("l") ? 1e5 : unit === "m" ? 1e6 : 1);
    if (!isNaN(n) && n > 0) out.push({ k: "BUDGET", v: `${cur}${n.toLocaleString("en-IN")}` });
  }
  const phone = t.match(/(?:\+?\d{1,3}[\s-]?)?\d{5}[\s-]?\d{5}\b/);
  if (phone) out.push({ k: "PHONE", v: phone[0].trim() });
  const biz = t.match(/\bfor (?:my|our|a) ([a-z][a-z-]{2,20})/i);
  if (biz && !/^(website|site|business|company)$/i.test(biz[1])) out.push({ k: "BUSINESS", v: biz[1].toLowerCase() });
  const when = t.match(/\b(by|before|within|in) (next (week|month|year)|\d+ (days?|weeks?|months?)|(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*|monday|tuesday|wednesday|thursday|friday|tomorrow)\b/i);
  if (when) out.push({ k: "TIMELINE", v: when[0].toLowerCase() });
  if (/\b(asap|urgent\w*|quickly|rush)\b/i.test(t)) out.push({ k: "PRIORITY", v: "high" });
  return out;
}

function LiveParserLab() {
  const [text, setText] = useState("");
  const typing = useRef(0);
  const fields = extract(text);
  const autoType = () => {
    window.clearInterval(typing.current);
    let i = 0;
    setText("");
    typing.current = window.setInterval(() => {
      i += 1;
      setText(EXAMPLE.slice(0, i));
      if (i >= EXAMPLE.length) window.clearInterval(typing.current);
    }, reduced() ? 1 : 32);
  };
  useEffect(() => () => window.clearInterval(typing.current), []);

  return (
    <div className="flex flex-1 flex-col gap-[10px]">
      <textarea
        value={text}
        onChange={(e) => { window.clearInterval(typing.current); setText(e.target.value); }}
        rows={3}
        placeholder={`Type a message, e.g. '${EXAMPLE.replace(" by next month", "")}'`}
        className={`${mono} lab-input w-full resize-none rounded-[5px] border px-[9px] py-[8px] text-[10px] leading-[1.5] outline-none`}
        style={{ borderColor: "rgba(244,242,237,.14)", background: "#111113", color: "#f4f2ed" }}
        aria-label="Message to parse"
      />
      <div className="flex items-center justify-between">
        <span className={`${mono} text-[8.5px]`} style={{ color: fields.length ? LIME : faint }}>
          {fields.length ? `${fields.length} field${fields.length > 1 ? "s" : ""} extracted` : "waiting for input…"}
        </span>
        <button type="button" onClick={autoType} className={`${mono} lab-glow-hover rounded-full border px-[8px] py-[2px] text-[8.5px]`} style={{ borderColor: "rgba(244,242,237,.2)", color: dim }}>
          {text ? "replay example" : "type example ↵"}
        </button>
      </div>
      {/* the structured record — each tag is keyed by its content so new/changed fields pop in */}
      <div className="flex min-h-[70px] flex-wrap content-start gap-[6px]">
        {fields.map((f) => (
          <span
            key={f.k + f.v}
            className="lab-tag-in flex items-center gap-[6px] rounded-[4px] border py-[3px] pl-[4px] pr-[7px]"
            style={{ borderColor: "rgba(200,241,79,.45)", background: "rgba(200,241,79,.06)", boxShadow: "0 0 12px -4px rgba(200,241,79,.4)" }}
          >
            <span className="h-[9px] w-[9px] rounded-full" style={{ background: pointLight(0.9) }} />
            <span className={`${mono} text-[7.5px] tracking-wider`} style={{ color: LIME }}>{f.k}</span>
            <span className={`${mono} text-[9px]`} style={{ color: "#f4f2ed" }}>{f.v}</span>
          </span>
        ))}
      </div>
      <p className={`${mono} mt-auto text-[8px]`} style={{ color: faint }}>
        Simple pattern matching, run on every keystroke — no AI, no network.
      </p>
    </div>
  );
}

/* ================================================================
   04 — MANUAL vs AUTOMATED RACE
   Both tokens start together. AUTOMATED flows through 5 checkpoints in
   ~2s no matter what. MANUAL stops dead at each checkpoint until the
   visitor presses PROCESS — the visitor is the bottleneck.
   ================================================================ */
const CPS = 5;
const AUTO_TOTAL = 2.0; // seconds
const TRAVEL_S = 0.28; // manual token travel between checkpoints
const cpAt = (i: number) => (i + 1) / (CPS + 1); // checkpoint i (0-based) position; finish line = 1

function RaceLab() {
  type Phase = "ready" | "running" | "done";
  const [phase, setPhase] = useState<Phase>("ready");
  const st = useRef({ t0: 0, autoPos: 0, autoDone: 0, manPos: 0, manStop: 0, manDone: 0, waiting: false, now: 0 });
  const [, force] = useState(0);
  const [flashA, setFlashA] = useState(-1);
  const [flashM, setFlashM] = useState(-1);
  const processBtn = useRef<HTMLButtonElement>(null);

  useFrame((dt) => {
    const s = st.current;
    s.now = performance.now();
    const el = (s.now - s.t0) / 1000;
    // automated: continuous, checkpoint flashes as it passes
    if (!s.autoDone) {
      const p = Math.min(1, el / AUTO_TOTAL);
      for (let i = 0; i < CPS; i++) if (s.autoPos < cpAt(i) && p >= cpAt(i)) setFlashA(i);
      s.autoPos = p;
      if (p >= 1) s.autoDone = el;
    }
    // manual: travel to target checkpoint, then wait
    if (!s.manDone && !s.waiting) {
      const target = s.manStop < CPS ? cpAt(s.manStop) : 1;
      s.manPos = Math.min(target, s.manPos + dt / (TRAVEL_S * (CPS + 1)));
      if (s.manPos >= target) {
        if (s.manStop >= CPS) s.manDone = el;
        else s.waiting = true; // stopped dead at checkpoint manStop
      }
    }
    if (s.autoDone && s.manDone) setPhase("done");
    force((n) => n + 1);
  }, phase === "running");

  useEffect(() => {
    if (st.current.waiting) processBtn.current?.focus({ preventScroll: true });
  });

  const start = () => {
    st.current = { t0: performance.now(), autoPos: 0, autoDone: 0, manPos: 0, manStop: 0, manDone: 0, waiting: false, now: performance.now() };
    setFlashA(-1);
    setFlashM(-1);
    setPhase("running");
  };
  const process = () => {
    const s = st.current;
    if (!s.waiting) return;
    s.waiting = false;
    setFlashM(s.manStop);
    s.manStop += 1;
  };

  const s = st.current;
  const elapsed = phase === "ready" ? 0 : (s.now - s.t0) / 1000;
  const autoT = s.autoDone || (phase === "ready" ? 0 : elapsed);
  const manT = s.manDone || (phase === "ready" ? 0 : elapsed);
  const waitingAt = s.waiting ? s.manStop : -1; // 0-based checkpoint index the manual token is stuck at

  const track = (label: string, pos: number, time: number, done: number, flash: number, manual: boolean) => (
    <div>
      <div className="mb-[5px] flex items-center justify-between">
        <span className={`${mono} text-[8.5px] tracking-wider`} style={{ color: manual ? "#f4f2ed" : LIME }}>{label}</span>
        <span className={`${mono} text-[10px] tabular-nums`} style={{ color: done ? (manual ? "#f4f2ed" : LIME) : dim }}>
          {time.toFixed(2)}s{done ? " ✓" : ""}
        </span>
      </div>
      <div className="relative h-[34px]">
        <div className="absolute inset-x-[6px] top-[10px] h-[5px] -translate-y-1/2 rounded-full" style={{ background: LIME, filter: "blur(3px)", opacity: manual ? 0.06 : 0.16 }} />
        <div className="absolute inset-x-[6px] top-[10px] h-px" style={{ background: manual ? "rgba(244,242,237,.2)" : "rgba(232,250,180,.5)" }} />
        {/* lit progress */}
        <div className="absolute left-[6px] top-[10px] h-px" style={{ width: `calc((100% - 12px) * ${pos})`, background: manual ? "rgba(244,242,237,.7)" : "rgba(245,252,225,.95)", boxShadow: manual ? "none" : "0 0 6px rgba(200,241,79,.8)" }} />
        {Array.from({ length: CPS }).map((_, i) => {
          const at = cpAt(i);
          const passed = manual ? pos > at + 1e-6 || (pos >= at - 1e-6 && waitingAt !== i) : pos >= at - 1e-6;
          const isWait = manual && waitingAt === i;
          return (
            <span key={i} className="absolute top-[10px] -translate-x-1/2 -translate-y-1/2" style={{ left: `calc(6px + (100% - 12px) * ${at})` }}>
              <span
                className="relative block h-[9px] w-[9px] rotate-45 border"
                style={{
                  borderColor: passed ? (manual ? "#f4f2ed" : LIME) : isWait ? "#f4f2ed" : "rgba(244,242,237,.25)",
                  background: passed ? (manual ? "rgba(244,242,237,.35)" : "rgba(200,241,79,.45)") : "#0c0c0d",
                  transform: `rotate(45deg) scale(${isWait ? 1.3 : 1})`,
                  transition: `transform .45s ${LAB_SPRING}, background .25s`,
                }}
              />
              {flash === i && <span key={`f${i}`} className="lab-flash pointer-events-none absolute inset-[-5px] rounded-full" />}
            </span>
          );
        })}
        {/* token */}
        <span className="absolute top-[10px] h-[16px] w-[16px] -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ left: `calc(6px + (100% - 12px) * ${pos})`, background: manual ? pointLight(0.9, "244,242,237") : pointLight(1) }} />
        {/* PROCESS appears at the checkpoint the manual token is stuck on */}
        {/* finish line */}
        <span className="absolute right-[6px] top-[3px] h-[14px] w-px" style={{ background: "rgba(244,242,237,.35)" }} />
        {manual && waitingAt >= 0 && (
          <button
            ref={processBtn}
            key={waitingAt}
            type="button"
            onClick={process}
            className={`${mono} lab-proc absolute top-[18px] -translate-x-1/2 whitespace-nowrap rounded-[3px] px-[6px] py-[2px] text-[8px] font-bold`}
            style={{ left: `calc(6px + (100% - 12px) * ${cpAt(waitingAt)})`, background: "#f4f2ed", color: "#0c0c0d" }}
          >
            PROCESS
          </button>
        )}
      </div>
    </div>
  );

  const ratio = s.autoDone && s.manDone ? s.manDone / s.autoDone : 0;
  return (
    <div className="flex flex-1 flex-col justify-between gap-[10px]">
      <div className="flex flex-col gap-[14px]">
        {track("AUTOMATED", s.autoPos, autoT, s.autoDone, flashA, false)}
        {track("MANUAL — YOU", s.manPos, manT, s.manDone, flashM, true)}
      </div>
      <div className="flex items-center justify-between gap-[8px]">
        <p className={`${mono} text-[9px] leading-[1.5]`} style={{ color: "rgba(244,242,237,.7)" }} aria-live="polite">
          {phase === "ready" && "Press START. Automated runs itself — you click PROCESS at every checkpoint."}
          {phase === "running" && (s.waiting ? `Checkpoint ${waitingAt + 1}/${CPS} waiting on you…` : s.autoDone ? "Automated already finished. Keep clicking." : "Both running…")}
          {phase === "done" && (
            <>
              Automated <strong style={{ color: LIME }}>{s.autoDone.toFixed(2)}s</strong> · You <strong style={{ color: "#f4f2ed" }}>{s.manDone.toFixed(2)}s</strong>
              {ratio > 1.05 && <span style={{ color: faint }}> — {ratio.toFixed(1)}× slower, and you were trying.</span>}
            </>
          )}
        </p>
        <button type="button" onClick={start} disabled={phase === "running"} className="btn btn-ghost flex-none px-[12px] py-[6px] text-[9.5px] disabled:opacity-40">
          {phase === "done" ? "RETRY" : "START"}
        </button>
      </div>
    </div>
  );
}

/* ================================================================
   05 — BUILD A FLOW
   Pointer-based drag (works for mouse + touch) from the palette onto the
   canvas, or reorder within it; tap a palette block to append. RUN
   validates honestly before executing anything.
   ================================================================ */
type BlockType = "TRIGGER" | "CONDITION" | "ACTION";
type Block = { id: number; type: BlockType };
const MAX_BLOCKS = 5;
const RESULTS: Record<BlockType, string[]> = {
  TRIGGER: ["Form submitted"],
  CONDITION: ["Budget > 10k? Yes", "Email valid? Yes", "New client? Yes"],
  ACTION: ["Task created", "Reply sent", "CRM updated", "Team notified"],
};
const BLOCK_ICON: Record<BlockType, string> = { TRIGGER: "⚡", CONDITION: "◇", ACTION: "▶" };

function validate(bs: Block[]): { at: number; msg: string } | null {
  if (!bs.length) return { at: -1, msg: "Nothing to run — drag a TRIGGER onto the canvas first." };
  if (bs[0].type !== "TRIGGER") return { at: 0, msg: `A flow has to start with a TRIGGER — this one starts with ${bs[0].type === "ACTION" ? "an ACTION" : "a CONDITION"}. Nothing would ever set it off.` };
  const second = bs.findIndex((b, i) => i > 0 && b.type === "TRIGGER");
  if (second > 0) return { at: second, msg: "Only one TRIGGER per flow — remove the extra one." };
  if (!bs.some((b) => b.type === "ACTION")) return { at: bs.length - 1, msg: "No ACTION yet — this flow would detect things but never do anything." };
  if (bs[bs.length - 1].type === "CONDITION") return { at: bs.length - 1, msg: "Ends on a CONDITION — add an ACTION for what happens when it's true." };
  return null;
}

function BuildFlowLab() {
  const [blocks, setBlocks] = useState<Block[]>([]);
  type Drag = { type: BlockType; fromId?: number; x: number; y: number };
  const [drag, setDragState] = useState<Drag | null>(null);
  // the ref is the source of truth for handlers (events can outrun renders)
  const dragRef = useRef<Drag | null>(null);
  const setDrag = (d: Drag | null) => { dragRef.current = d; setDragState(d); };
  const [insertAt, setInsertAt] = useState<number | null>(null);
  const [run, setRun] = useState<{ step: number; results: string[] } | null>(null);
  const [error, setError] = useState<{ at: number; msg: string } | null>(null);
  const canvas = useRef<HTMLDivElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const nextId = useRef(1);
  const timers = useRef<number[]>([]);
  const startPt = useRef({ x: 0, y: 0, moved: false });
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const reset = () => { timers.current.forEach(clearTimeout); timers.current = []; setRun(null); setError(null); };
  const calcIndex = (clientX: number, clientY: number, excludeId?: number) => {
    const c = canvas.current;
    if (!c) return null;
    const r = c.getBoundingClientRect();
    if (clientX < r.left - 10 || clientX > r.right + 10 || clientY < r.top - 16 || clientY > r.bottom + 16) return null;
    const els = [...c.querySelectorAll<HTMLElement>("[data-block]")].filter((e) => Number(e.dataset.block) !== excludeId);
    let idx = els.length;
    for (let i = 0; i < els.length; i++) {
      const b = els[i].getBoundingClientRect();
      if (clientX < b.left + b.width / 2) { idx = i; break; }
    }
    return idx;
  };
  const place = (type: BlockType, idx: number | null, fromId?: number) => {
    setBlocks((bs) => {
      let list = bs;
      let blk: Block = { id: nextId.current, type };
      if (fromId !== undefined) {
        blk = bs.find((b) => b.id === fromId)!;
        list = bs.filter((b) => b.id !== fromId);
        if (idx === null) return list; // dragged off the canvas → removed
      } else {
        if (idx === null || bs.length >= MAX_BLOCKS) return bs;
        nextId.current++;
      }
      const out = [...list];
      out.splice(Math.min(idx, out.length), 0, blk);
      return out;
    });
    reset();
  };

  const onDown = (e: RPointerEvent, type: BlockType, fromId?: number) => {
    if (run && run.step < (blocks.length)) return; // don't edit mid-run
    startPt.current = { x: e.clientX, y: e.clientY, moved: false };
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    setDrag({ type, fromId, x: e.clientX, y: e.clientY });
  };
  const onMove = (e: RPointerEvent) => {
    const cur = dragRef.current;
    if (!cur) return;
    if (Math.hypot(e.clientX - startPt.current.x, e.clientY - startPt.current.y) > 4) startPt.current.moved = true;
    setDrag({ ...cur, x: e.clientX, y: e.clientY });
    setInsertAt(startPt.current.moved ? calcIndex(e.clientX, e.clientY, cur.fromId) : null);
  };
  const onUp = (e: RPointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    setDrag(null);
    setInsertAt(null);
    if (!startPt.current.moved) {
      // tap: palette → append; canvas block → leave as is
      if (d.fromId === undefined) place(d.type, Infinity);
      return;
    }
    place(d.type, calcIndex(e.clientX, e.clientY, d.fromId), d.fromId);
  };

  const runFlow = () => {
    reset();
    const err = validate(blocks);
    if (err) { setError(err); return; }
    const counters: Record<BlockType, number> = { TRIGGER: 0, CONDITION: 0, ACTION: 0 };
    const results = blocks.map((b) => RESULTS[b.type][counters[b.type]++ % RESULTS[b.type].length]);
    setRun({ step: -1, results });
    const gap = reduced() ? 60 : 620;
    blocks.forEach((_, i) => timers.current.push(window.setTimeout(() => setRun((r) => r && { ...r, step: i }), 200 + i * gap)));
    timers.current.push(window.setTimeout(() => setRun((r) => r && { ...r, step: blocks.length }), 200 + blocks.length * gap));
  };

  const rootBox = root.current?.getBoundingClientRect();
  const done = run && run.step >= blocks.length;
  return (
    <div ref={root} className="relative flex flex-1 flex-col gap-[10px] select-none" onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={() => { setDrag(null); setInsertAt(null); }} style={{ touchAction: drag ? "none" : undefined }}>
      {/* palette */}
      <div className="flex items-center gap-[6px]">
        <span className={`${mono} mr-[2px] text-[8px]`} style={{ color: faint }}>BLOCKS</span>
        {(["TRIGGER", "CONDITION", "ACTION"] as BlockType[]).map((t) => (
          <button
            key={t}
            type="button"
            onPointerDown={(e) => onDown(e, t)}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), place(t, blocks.length))}
            className={`${mono} lab-glow-hover cursor-grab rounded-[4px] border px-[7px] py-[4px] text-[8.5px] active:cursor-grabbing`}
            style={{ borderColor: "rgba(200,241,79,.35)", color: "#f4f2ed", background: "#141416", touchAction: "none", opacity: blocks.length >= MAX_BLOCKS ? 0.4 : 1 }}
            aria-label={`Add ${t} block`}
          >
            <span style={{ color: LIME }}>{BLOCK_ICON[t]}</span> {t}
          </button>
        ))}
      </div>

      {/* canvas */}
      <div
        ref={canvas}
        className="relative flex min-h-[112px] flex-1 items-center gap-[14px] overflow-x-auto rounded-[5px] border border-dashed px-[10px] py-[10px]"
        style={{ borderColor: insertAt !== null ? "rgba(200,241,79,.55)" : "rgba(244,242,237,.12)", background: "rgba(17,17,19,.6)", transition: "border-color .2s" }}
      >
        {blocks.length === 0 && insertAt === null && (
          <span className={`${mono} pointer-events-none absolute inset-0 grid place-items-center text-center text-[9px]`} style={{ color: faint }}>
            Drag blocks here (or tap them) · drag a block off to remove it
          </span>
        )}
        {blocks.map((b, i) => {
          const lit = run ? run.step >= i : false;
          const current = run?.step === i;
          const bad = error?.at === i;
          const hidden = drag?.fromId === b.id && startPt.current.moved;
          return (
            <div key={b.id} className="relative flex items-center">
              {insertAt === i && <span className="absolute -left-[9px] top-1/2 h-[46px] w-[2px] -translate-y-1/2 rounded-full" style={{ background: LIME, boxShadow: `0 0 8px ${LIME}` }} />}
              {i > 0 && (
                <span className="absolute -left-[14px] top-1/2 h-px w-[14px]" style={{ background: lit ? "rgba(245,252,225,.95)" : "rgba(244,242,237,.2)", boxShadow: lit ? "0 0 6px rgba(200,241,79,.8)" : "none", transition: "background .25s" }}>
                  {current && !reduced() && <span className="lab-hop absolute top-1/2 h-[8px] w-[8px] -translate-y-1/2 rounded-full" style={{ background: pointLight(1) }} />}
                </span>
              )}
              <div
                data-block={b.id}
                onPointerDown={(e) => onDown(e, b.type, b.id)}
                className="lab-block-in relative flex w-[78px] flex-none cursor-grab flex-col gap-[4px] rounded-[5px] border p-[6px]"
                style={{
                  touchAction: "none",
                  opacity: hidden ? 0.25 : 1,
                  borderColor: bad ? FAULT : lit ? LIME : "rgba(244,242,237,.2)",
                  background: bad ? "rgba(255,122,102,.08)" : lit ? "rgba(200,241,79,.09)" : "#141416",
                  boxShadow: current ? "0 0 18px rgba(200,241,79,.35)" : "none",
                  transform: current ? "scale(1.06)" : "scale(1)",
                  transition: `transform .5s ${LAB_SPRING}, border-color .25s, background .25s, box-shadow .3s`,
                }}
              >
                {current && <span key={`f${run?.step}`} className="lab-flash pointer-events-none absolute inset-0 rounded-[5px]" />}
                <span className={`${mono} text-[7.5px]`} style={{ color: bad ? FAULT : LIME }}>
                  {BLOCK_ICON[b.type]} {b.type}
                </span>
                <span className={`${mono} min-h-[22px] text-[8px] leading-[1.35]`} style={{ color: lit ? "#f4f2ed" : faint }}>
                  {lit && run ? run.results[i] : "—"}
                </span>
              </div>
            </div>
          );
        })}
        {insertAt !== null && insertAt >= blocks.length && <span className="h-[46px] w-[2px] flex-none rounded-full" style={{ background: LIME, boxShadow: `0 0 8px ${LIME}` }} />}
      </div>

      <div className="flex items-center justify-between gap-[8px]">
        <p className={`${mono} min-h-[28px] text-[9px] leading-[1.5]`} style={{ color: error ? FAULT : done ? LIME : "rgba(244,242,237,.6)" }} aria-live="polite">
          {error ? `✕ ${error.msg}` : done ? `✓ Flow ran — ${blocks.length} step${blocks.length > 1 ? "s" : ""}, no one touched it.` : run ? "Running…" : `${blocks.length}/${MAX_BLOCKS} blocks · any order you like — RUN checks it.`}
        </p>
        <div className="flex flex-none gap-[6px]">
          {blocks.length > 0 && (
            <button type="button" onClick={() => { setBlocks([]); reset(); }} className={`${mono} lab-glow-hover rounded-full border px-[8px] py-[4px] text-[8.5px]`} style={{ borderColor: "rgba(244,242,237,.2)", color: dim }}>
              clear
            </button>
          )}
          <button type="button" onClick={runFlow} disabled={!!run && !done} className="btn btn-ghost px-[12px] py-[6px] text-[9.5px] disabled:opacity-40">
            RUN ▶
          </button>
        </div>
      </div>

      {/* drag ghost */}
      {drag && startPt.current.moved && rootBox && (
        <span
          className={`${mono} pointer-events-none absolute z-[20] rounded-[4px] border px-[7px] py-[4px] text-[8.5px]`}
          style={{ left: drag.x - rootBox.left, top: drag.y - rootBox.top, translate: "-50% -60%", borderColor: LIME, background: "#141416", color: "#f4f2ed", boxShadow: "0 0 18px rgba(200,241,79,.35)" }}
        >
          <span style={{ color: LIME }}>{BLOCK_ICON[drag.type]}</span> {drag.type}
        </span>
      )}
    </div>
  );
}
