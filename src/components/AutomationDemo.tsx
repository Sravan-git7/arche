import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap, prefersReducedMotion } from "../lib/gsap";
import { announcePreviewDone, markPreviewPlayed } from "../lib/autoplay";

/**
 * AI AUTOMATION — the same job, done two ways.
 *
 * MANUAL     a person works through six steps. Measured, uneven, effortful:
 *            each step has its own reach time, its own hesitation mid-task,
 *            and the cursor lands slightly differently every time.
 * AUTOMATED  the six list rows physically collapse into one AI node. One
 *            lime signal ("NEW LEAD") enters, the node fires, and the signal
 *            splits into four paths that land 80ms apart — identical easing
 *            on every path, so the motion reads as precise and causal.
 *
 * The rows, the result cards and the signal are the SAME elements in both
 * modes. Both timelines are precomputed constants (deterministic for QA and
 * repeat visits); only geometry is measured at run time. The DONE time is
 * the real elapsed time of the run, never hardcoded.
 *
 * PROMPT 24 — autoplay-first: the first time this stage is on screen it runs
 * MANUAL once at normal pace, beats ~0.9s, then runs AUTOMATED once — no RUN
 * click needed, and the comparison line at the bottom fills itself in. Any
 * click on RUN or the MANUAL/AUTOMATED toggle cancels the chain and hands
 * control over for good; both stay fully usable afterwards.
 */

const SLUG = "ai-automation";
/** PROMPT 28: Beat of exactly 1 second (1000ms) between manual run completing and automated run starting. */
const CHAIN_GAP = 1000;

type Mode = "manual" | "auto";
type Phase = "idle" | "running" | "done";
type RowState = "idle" | "active" | "complete";

const STEPS = ["Email arrives", "Copy the details", "Update the sheet", "Open the CRM", "Send a reply", "Create a task"];

const CARDS = [
  { k: "Inbox", tip: "Inbox: marked read, tagged Lead" },
  { k: "Sheet", tip: "Sheet: new row — name, company, source" },
  { k: "CRM", tip: "CRM: contact created, owner assigned" },
  { k: "Slack", tip: "Slack: #sales notified with a summary" },
];

/* ---- precomputed timelines (seconds) ------------------------------------ */

/** Manual: 1.1–1.6s per step with deliberate variance; ~9.7s total. */
const MANUAL = {
  steps: [1.24, 1.12, 1.48, 1.18, 1.36, 1.15], // whole step, including the reach
  reach: [0.46, 0.38, 0.52, 0.41, 0.49, 0.36], // cursor travel before work starts
  split: [0.58, 0.46, 0.62, 0.5, 0.55, 0.44], // where the person pauses mid-task
  hold: [0.12, 0.2, 0.08, 0.16, 0.1, 0.18], // how long they pause (fraction of work)
  jitter: [-6, 4, -2, 7, -4, 3], // cursor never lands in the same place twice
  cardGaps: [0.5, 0.62, 0.46, 0.58], // one card at a time, at a person's pace
};

/** Automated: fast, exact, identical easing on every path; ~1.7s job. */
const AUTO = {
  collapse: 0.4, // six rows → one node
  nodeIn: 0.3,
  enter: 0.55, // NEW LEAD travels to the node (constant velocity)
  absorb: 0.3, // node fires
  path: 0.62, // each of the four parallel paths
  stagger: 0.08, // 80ms between paths: causal, not simultaneous
};

const sum = (a: number[]) => a.reduce((s, v) => s + v, 0);
const NOMINAL = {
  manual: sum(MANUAL.steps) + sum(MANUAL.cardGaps),
  auto: AUTO.enter + AUTO.absorb + AUTO.stagger * (CARDS.length - 1) + AUTO.path,
};

const NODE = 56; // AI node diameter
const NR = NODE / 2;

/** Layout position relative to `stop`, from the offset chain (ignores transforms). */
const offsetIn = (el: HTMLElement, stop: HTMLElement) => {
  let x = 0;
  let y = 0;
  let c: HTMLElement | null = el;
  while (c && c !== stop) {
    x += c.offsetLeft;
    y += c.offsetTop;
    c = c.offsetParent as HTMLElement | null;
  }
  return { x, y, w: el.offsetWidth, h: el.offsetHeight };
};

const fmt = (s: number) => `${s.toFixed(1)}s`;

export function AutomationDemo({
  active = true,
  preview = false,
  auto = false,
}: {
  active?: boolean;
  preview?: boolean;
  auto?: boolean;
}) {
  const root = useRef<HTMLDivElement>(null);
  const tl = useRef<gsap.core.Timeline | null>(null);
  const collapsed = useRef(false);
  const clockStart = useRef(0);
  const clock = useRef<HTMLSpanElement>(null);

  const [mode, setMode] = useState<Mode>("manual");
  const [phase, setPhase] = useState<Phase>("idle");
  const [ran, setRan] = useState<Mode>("manual");
  const [results, setResults] = useState<Partial<Record<Mode, number>>>({});
  const [chainOn, setChainOn] = useState(false); // unattended first-view preview
  const [displayMult, setDisplayMult] = useState(1);

  /** Next run-completion hook — the autoplay chain lives here. */
  const chain = useRef<((m: Mode) => void) | null>(null);
  const chainTimer = useRef(0);
  const autoStarted = useRef(false);

  const q = <T extends Element = HTMLElement>(sel: string) => root.current!.querySelector<T>(sel)!;
  const qa = <T extends Element = HTMLElement>(sel: string) => Array.from(root.current!.querySelectorAll<T>(sel));
  const setState = (el: HTMLElement, s: RowState) => {
    if (el.dataset.state !== s) el.dataset.state = s;
  };

  // PROMPT 32 (Delight 5) — Multiplier counts up from 1× to final value over ~1s
  useEffect(() => {
    if (results.manual && results.auto) {
      const target = Math.max(1, Math.round(results.manual / results.auto));
      const startVal = 1;
      const duration = 1000;
      const startTime = performance.now();

      let rafId = 0;
      const step = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / duration);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(startVal + (target - startVal) * eased);
        setDisplayMult(current);

        if (progress < 1) {
          rafId = requestAnimationFrame(step);
        }
      };
      rafId = requestAnimationFrame(step);
      return () => cancelAnimationFrame(rafId);
    } else {
      setDisplayMult(1);
    }
  }, [results.manual, results.auto]);

  // node starts collapsed-away
  useLayoutEffect(() => {
    gsap.set(q(".au-node"), { scale: 0.3, opacity: 0 });
    return () => {
      tl.current?.kill();
      if (chainTimer.current) window.clearTimeout(chainTimer.current);
      chain.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Clear every visual state back to idle (keeps the list/node morph as-is). */
  const reset = () => {
    qa(".au-row").forEach((r) => setState(r, "idle"));
    qa(".au-card").forEach((c) => setState(c, "idle"));
    setState(q(".au-node"), "idle");
    gsap.set(qa(".au-fill"), { scaleX: 0 });
    gsap.set(q(".au-hand"), { opacity: 0 });
    gsap.set(qa<SVGElement>(".au-dot, .au-lead, .au-path"), { opacity: 0 });
    gsap.set(q(".au-ring"), { opacity: 0, scale: 1 });
  };

  const startClock = () => {
    clockStart.current = performance.now();
  };

  const finish = (m: Mode) => {
    const elapsed = clockStart.current ? (performance.now() - clockStart.current) / 1000 : NOMINAL[m];
    clockStart.current = 0;
    setResults((r) => ({ ...r, [m]: elapsed }));
    setPhase("done");
    endRun(m);
  };

  /** Fire (once) whatever is waiting on this run to finish. */
  const endRun = (m: Mode) => {
    const cb = chain.current;
    chain.current = null;
    cb?.(m);
  };

  /* ---- morph: list ⇄ node -------------------------------------------------- */

  const collapseTo = (t: gsap.core.Timeline, instant = false) => {
    const pane = q(".au-pane");
    const rows = qa(".au-row");
    const node = q(".au-node");
    const cy = pane.clientHeight / 2;
    const dur = instant ? 0 : AUTO.collapse;
    collapsed.current = true;
    t.to(rows, {
      y: (i: number) => cy - (rows[i].offsetTop + rows[i].offsetHeight / 2),
      scaleX: (i: number) => NODE / rows[i].offsetWidth,
      scaleY: 0.18,
      opacity: 0,
      duration: dur,
      ease: "power3.in",
      stagger: instant ? 0 : { each: 0.03, from: "edges" },
    }).to(node, { scale: 1, opacity: 1, duration: instant ? 0 : AUTO.nodeIn, ease: "back.out(1.7)" }, instant ? "<" : "-=0.14");
  };

  const expandTo = (t: gsap.core.Timeline, instant = false) => {
    const dur = instant ? 0 : 0.45;
    collapsed.current = false;
    t.to(q(".au-node"), { scale: 0.3, opacity: 0, duration: instant ? 0 : 0.2, ease: "power2.in" }).to(
      qa(".au-row"),
      {
        y: 0,
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
        duration: dur,
        ease: "power3.out",
        stagger: instant ? 0 : { each: 0.04, from: "center" },
      },
      instant ? "<" : "-=0.05"
    );
  };

  /* ---- MANUAL: a person, six steps, uneven --------------------------------- */

  const buildManual = (t: gsap.core.Timeline) => {
    const el = root.current!;
    const rows = qa(".au-row");
    const cards = qa(".au-card");
    const fills = rows.map((r) => r.querySelector<HTMLElement>(".au-fill")!);
    const hand = q(".au-hand");

    if (collapsed.current) expandTo(t);
    t.call(startClock);

    const onRow = (r: HTMLElement, j: number) => {
      const o = offsetIn(r, el);
      return { x: o.x + o.w - 38 + j, y: o.y + o.h / 2 - 4 };
    };
    const onCard = (c: HTMLElement) => {
      const o = offsetIn(c, el);
      return { x: o.x + o.w - 30, y: o.y + o.h / 2 - 2 };
    };

    const first = onRow(rows[0], MANUAL.jitter[0]);
    let pos = t.duration();
    t.set(hand, { x: first.x - 26, y: first.y + 22, scale: 1 }, pos).to(hand, { opacity: 1, duration: 0.2 }, pos);

    STEPS.forEach((_, i) => {
      const d = MANUAL.steps[i];
      const reach = MANUAL.reach[i];
      const work = d - reach;
      const target = onRow(rows[i], MANUAL.jitter[i]);
      const at = pos;
      t.call(() => setState(rows[i], "active"), undefined, at)
        .to(hand, { x: target.x, y: target.y, duration: reach, ease: "power2.inOut" }, at)
        .to(hand, { scale: 0.84, duration: 0.09, yoyo: true, repeat: 1, ease: "power1.inOut" }, at + reach)
        // the person gets partway, pauses, then finishes — never one even sweep
        .to(fills[i], { scaleX: MANUAL.split[i], duration: work * 0.5, ease: "sine.inOut" }, at + reach)
        .to(fills[i], { scaleX: 1, duration: work * (0.5 - MANUAL.hold[i]), ease: "power2.out" }, at + reach + work * (0.5 + MANUAL.hold[i]))
        .call(() => setState(rows[i], "complete"), undefined, at + d);
      pos += d;
    });

    // then they go and update each tool, one at a time
    cards.forEach((c, j) => {
      const g = MANUAL.cardGaps[j];
      const target = onCard(c);
      const at = pos;
      t.to(hand, { x: target.x, y: target.y, duration: g * 0.55, ease: "power2.inOut" }, at)
        .call(() => setState(c, "active"), undefined, at + g * 0.55)
        .to(hand, { scale: 0.84, duration: 0.08, yoyo: true, repeat: 1 }, at + g * 0.55)
        .call(() => setState(c, "complete"), undefined, at + g);
      pos += g;
    });

    t.call(() => finish("manual"), undefined, pos).to(hand, { opacity: 0, duration: 0.3 }, pos + 0.15);
  };

  /* ---- AUTOMATED: one event, one node, four exact paths -------------------- */

  const buildAuto = (t: gsap.core.Timeline) => {
    const el = root.current!;
    const node = q(".au-node");
    const ring = q(".au-ring");
    const cards = qa(".au-card");
    const svg = q<SVGSVGElement>(".au-svg");
    const enterP = q<SVGPathElement>(".au-p-enter");
    const splitP = qa<SVGPathElement>(".au-p-split");
    const dots = qa<SVGGElement>(".au-dot");
    const lead = q<SVGGElement>(".au-lead");

    if (!collapsed.current) collapseTo(t);
    else t.set(node, { scale: 1, opacity: 1 });

    // geometry (transform-independent)
    svg.setAttribute("viewBox", `0 0 ${el.offsetWidth} ${el.offsetHeight}`);
    const n = offsetIn(node, el);
    const nx = n.x + n.w / 2;
    const ny = n.y + n.h / 2;

    enterP.setAttribute("d", `M0 ${ny} L${nx - NR} ${ny}`);
    const eL = enterP.getTotalLength();
    const ends = cards.map((c, i) => {
      const o = offsetIn(c, el);
      const side = o.x > nx + NR; // cards to the right (desktop) or below (mobile)
      const sx = side ? nx + NR : nx;
      const sy = side ? ny : ny + NR;
      const ex = side ? o.x : o.x + o.w / 2;
      const ey = side ? o.y + o.h / 2 : o.y;
      const d = side
        ? `M${sx} ${sy} C${sx + (ex - sx) * 0.5} ${sy} ${sx + (ex - sx) * 0.5} ${ey} ${ex} ${ey}`
        : `M${sx} ${sy} C${sx} ${sy + (ey - sy) * 0.5} ${ex} ${sy + (ey - sy) * 0.5} ${ex} ${ey}`;
      splitP[i].setAttribute("d", d);
      return splitP[i].getTotalLength();
    });

    const place = (g: SVGGElement, path: SVGPathElement, len: number, p: number) => {
      const pt = path.getPointAtLength(len * p);
      g.setAttribute("transform", `translate(${pt.x} ${pt.y})`);
    };

    t.call(startClock);
    let pos = t.duration();

    // NEW LEAD enters at constant velocity — machine precision
    const e = { p: 0 };
    t.set(enterP, { opacity: 1, strokeDasharray: eL, strokeDashoffset: eL }, pos)
      .set(lead, { opacity: 1 }, pos)
      .call(() => place(lead, enterP, eL, 0), undefined, pos)
      .to(
        e,
        {
          p: 1,
          duration: AUTO.enter,
          ease: "none",
          onUpdate: () => {
            place(lead, enterP, eL, e.p);
            enterP.style.strokeDashoffset = String(eL * (1 - e.p));
          },
        },
        pos
      );
    pos += AUTO.enter;

    // absorbed; the node fires
    t.to(lead, { opacity: 0, duration: 0.12 }, pos)
      .call(() => setState(node, "active"), undefined, pos)
      .fromTo(ring, { scale: 1, opacity: 0.8 }, { scale: 1.9, opacity: 0, duration: 0.5, ease: "power2.out" }, pos);
    pos += AUTO.absorb;

    // four paths, identical easing, exactly 80ms apart
    cards.forEach((c, i) => {
      const at = pos + i * AUTO.stagger;
      const L = ends[i];
      const p = { v: 0 };
      t.set(splitP[i], { opacity: 1, strokeDasharray: L, strokeDashoffset: L }, at)
        .set(dots[i], { opacity: 1 }, at)
        .call(() => {
          place(dots[i], splitP[i], L, 0);
          setState(c, "active");
        }, undefined, at)
        .to(
          p,
          {
            v: 1,
            duration: AUTO.path,
            ease: "power2.inOut",
            onUpdate: () => {
              place(dots[i], splitP[i], L, p.v);
              splitP[i].style.strokeDashoffset = String(L * (1 - p.v));
            },
          },
          at
        )
        .call(() => setState(c, "complete"), undefined, at + AUTO.path)
        .to(dots[i], { opacity: 0, duration: 0.15 }, at + AUTO.path);
    });

    const end = pos + AUTO.stagger * (cards.length - 1) + AUTO.path;
    t.call(() => {
      setState(node, "complete");
      finish("auto");
    }, undefined, end);
  };

  /* ---- run ------------------------------------------------------------------ */

  const run = (m: Mode) => {
    tl.current?.kill();
    reset();
    setRan(m);
    setPhase("running");
    clockStart.current = 0;

    if (prefersReducedMotion()) {
      const t = gsap.timeline();
      if (m === "auto") collapseTo(t, true);
      else expandTo(t, true);
      t.progress(1);
      qa(".au-row").forEach((r) => setState(r, m === "manual" ? "complete" : "idle"));
      if (m === "manual") gsap.set(qa(".au-fill"), { scaleX: 1 });
      qa(".au-card").forEach((c) => setState(c, "complete"));
      setState(q(".au-node"), m === "auto" ? "complete" : "idle");
      setResults((r) => ({ ...r, [m]: NOMINAL[m] }));
      setPhase("done");
      endRun(m);
      return;
    }

    const t = gsap.timeline({
      onUpdate: () => {
        if (clockStart.current && clock.current) clock.current.textContent = fmt((performance.now() - clockStart.current) / 1000);
      },
    });
    if (m === "manual") buildManual(t);
    else buildAuto(t);
    tl.current = t;
  };

  /** A visitor-initiated run: cancels any unattended preview chain. */
  const userRun = (m: Mode) => {
    chain.current = null;
    if (chainTimer.current) window.clearTimeout(chainTimer.current);
    setChainOn(false);
    run(m);
  };

  const chooseMode = (m: Mode) => {
    setMode(m);
    userRun(m); // the toggle auto-runs
  };

  /*
   * PROMPT 28 — AI Automation autoplay: the moment this tab becomes active and is in viewport,
   * auto-trigger the MANUAL run, wait for it to complete, wait 1 second, then auto-trigger
   * the AUTOMATED run without requiring the RUN button to be clicked.
   */
  useEffect(() => {
    if (autoStarted.current || !active || preview) return;
    const id = window.setTimeout(() => {
      autoStarted.current = true;
      markPreviewPlayed(SLUG);
      setChainOn(true);
      setMode("manual");
      chain.current = (m) => {
        if (m !== "manual") return;
        chainTimer.current = window.setTimeout(() => {
          chain.current = (m2) => {
            setChainOn(false);
            if (m2 === "auto") announcePreviewDone(SLUG);
          };
          setMode("auto");
          run("auto");
        }, CHAIN_GAP);
      };
      run("manual");
    }, 420);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, preview]);

  // hover preview: sample the automated run once
  useEffect(() => {
    if (!preview) return;
    const id = window.setTimeout(() => {
      setMode("auto");
      run("auto");
    }, 320);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preview]);

  /* ---- render ----------------------------------------------------------------- */

  const idleText = mode === "manual" ? "Six steps · one person · every time" : "One event · no one touches it";
  const doneText =
    ran === "manual"
      ? `Done · ${fmt(results.manual ?? NOMINAL.manual)} · 6 steps by hand`
      : `Done · ${fmt(results.auto ?? NOMINAL.auto)} · person free`;
  const both = results.manual !== undefined && results.auto !== undefined;

  return (
    <div ref={root} className="au relative flex flex-col gap-[14px] p-[14px] min-[900px]:h-full min-[900px]:p-[18px]">
      {/* controls */}
      <div className="flex flex-wrap items-center justify-between gap-[10px]" style={{ opacity: preview ? 0 : 1, pointerEvents: preview ? "none" : "auto" }}>
        <div role="radiogroup" aria-label="Mode" className="au-seg">
          <span className="au-seg-ind" style={{ transform: mode === "auto" ? "translateX(100%)" : "none" }} aria-hidden />
          <button type="button" role="radio" aria-checked={mode === "manual"} onClick={() => chooseMode("manual")}>
            Manual
          </button>
          <button type="button" role="radio" aria-checked={mode === "auto"} onClick={() => chooseMode("auto")}>
            Automated
          </button>
        </div>
        <button
          type="button"
          className="au-run"
          onClick={() => userRun(mode)}
          disabled={phase === "running"}
          data-cursor={phase === "running" ? undefined : "RUN"}
        >
          <span aria-hidden>▶</span> {phase === "running" ? "Running" : phase === "done" ? "Run again" : "Run"}
        </button>
      </div>

      {/* work area */}
      <div className="grid flex-1 items-center gap-[14px] min-[900px]:grid-cols-[1.25fr_0.9fr] min-[900px]:gap-[clamp(28px,4vw,56px)]">
        <div>
          <p className="mono mb-[8px]">{mode === "manual" ? "You · 6 steps" : "System · 1 event"}</p>
          <div className="au-pane relative">
            <div className="flex flex-col gap-[6px]">
              {STEPS.map((s, i) => (
                <div key={s} className="au-row" data-state="idle">
                  <span className="au-fill" aria-hidden />
                  <span className="au-num mono">{String(i + 1).padStart(2, "0")}</span>
                  <span className="au-label">{s}</span>
                  <span className="au-mark" aria-hidden />
                </div>
              ))}
            </div>
            <div
              className="au-node absolute top-1/2 left-1/2"
              data-state="idle"
              style={{ width: NODE, height: NODE, marginLeft: -NR, marginTop: -NR }}
              aria-hidden
            >
              <span className="au-ring" />
              <span className="au-core">AI</span>
              <span className="au-cap mono">reads · decides · routes</span>
            </div>
          </div>
        </div>

        <div>
          <p className="mono mb-[8px]">Result</p>
          <div className="grid grid-cols-2 gap-[8px] min-[900px]:grid-cols-1">
            {CARDS.map((c, i) => (
              <div key={c.k} className="au-card" data-state="idle" tabIndex={0} aria-describedby={`au-tip-${i}`}>
                <div className="flex items-center justify-between gap-[8px]">
                  <span className="mono mono-fg">{c.k}</span>
                  <span className="au-mark" aria-hidden />
                </div>
                <span className="au-flip" aria-live="polite">
                  <span>Waiting</span>
                  <span>Updating…</span>
                  <span>Updated</span>
                </span>
                <span role="tooltip" id={`au-tip-${i}`} className="au-tip">
                  {c.tip}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* status */}
      <div className="flex flex-wrap items-center justify-between gap-[8px] border-t pt-[10px]" style={{ borderColor: "var(--line)" }}>
        <span className="mono" style={{ color: phase === "done" ? "var(--accent-deep)" : phase === "running" ? "var(--fg)" : "var(--faint)" }}>
          {phase === "running" ? (
            <>
              {chainOn && (
                <span style={{ color: "var(--accent-deep)" }}>
                  Auto-preview · {mode === "manual" ? "manual" : "automated"} run ·{" "}
                </span>
              )}
              Running · <span ref={clock}>0.0s</span>
            </>
          ) : phase === "done" ? (
            doneText
          ) : (
            idleText
          )}
        </span>
        {both && (
          <span className="mono mono-fg flex items-center gap-[4px]">
            <span>Manual {fmt(results.manual!)} → Automated {fmt(results.auto!)} ·</span>
            <strong
              className="text-[var(--accent)] font-bold transition-transform duration-200"
              style={{
                display: "inline-block",
                transform: displayMult === Math.round(results.manual! / results.auto!) ? "scale(1.08)" : "scale(1)",
              }}
            >
              {displayMult}× faster
            </strong>
          </span>
        )}
      </div>

      {/* signal layer + the person's cursor */}
      <svg className="au-svg pointer-events-none absolute inset-0 h-full w-full overflow-visible" aria-hidden>
        <path className="au-path au-p-enter" fill="none" stroke="var(--accent-deep)" strokeWidth="1.2" opacity="0" />
        {CARDS.map((c) => (
          <path key={c.k} className="au-path au-p-split" fill="none" stroke="var(--accent-deep)" strokeWidth="1.1" strokeOpacity=".55" opacity="0" />
        ))}
        <g className="au-lead" opacity="0">
          <circle r="8" fill="var(--accent)" opacity=".28" />
          <circle r="3.5" fill="var(--accent)" />
          <text x="0" y="-12" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="9" letterSpacing="1.4" fill="var(--accent-deep)">
            NEW LEAD
          </text>
        </g>
        {CARDS.map((c) => (
          <g key={c.k} className="au-dot" opacity="0">
            <circle r="6" fill="var(--accent)" opacity=".28" />
            <circle r="3" fill="var(--accent)" />
          </g>
        ))}
      </svg>
      <span className="au-hand" aria-hidden>
        <svg width="18" height="22" viewBox="0 0 18 22">
          <path d="M1 1 L1 17 L5.4 12.9 L8.6 20.2 L11.6 18.9 L8.5 11.7 L14.4 11.7 Z" fill="var(--fg)" stroke="var(--bg)" strokeWidth="1.3" strokeLinejoin="round" />
        </svg>
      </span>
    </div>
  );
}
