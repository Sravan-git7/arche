import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { siteContent } from "../data/site";
import { gsap, ScrollTrigger, prefersReducedMotion } from "../lib/gsap";
import { emitThread } from "../lib/threadBus";

/**
 * PROBLEM — one of the site's two pinned sequences.
 *
 * Desktop (pinned, fully scroll-linked):
 *   0.00–0.25  establishing: four tools idle on unsynced rhythms; the hero's
 *              lime signal drifts in and settles on the Website card
 *   0.25–0.55  Website activates (steady beat) and draws a line to Email
 *   0.55–0.80  Email reads; the system fans out — Email → Sheet and
 *              Website → CRM draw at the same time
 *   0.80–1.00  all four share one beat, CRM gets an owner, and the cluster
 *              compresses into the compact diagram that opens Services
 *
 * Mobile: not pinned. Cards stack; each resolves as it reaches the middle
 * third of the viewport.
 */
type CardId = "web" | "email" | "sheet" | "crm";
type Card = {
  id: CardId;
  k: string;
  a: string;
  b?: string;
  tag: string;
  x: number; // stage units (160 × 110)
  y: number;
  rx: number; // compact-diagram x
  dur: number; // idle pulse rhythm — deliberately not shared
  delay: number;
};

const W = 160;
const H = 110;
const ROW_Y = 58;

const CARDS: Card[] = [
  { id: "web", k: "Website", a: "New inquiry", tag: "Captured", x: 33, y: 24, rx: 20, dur: 1.7, delay: -0.3 },
  { id: "email", k: "Email", a: "Unread · 12m", b: "Read", tag: "Sent", x: 127, y: 24, rx: 60, dur: 2.6, delay: -1.1 },
  { id: "sheet", k: "Sheet", a: "Row pending", tag: "Logged", x: 127, y: 86, rx: 100, dur: 1.25, delay: -0.6 },
  { id: "crm", k: "CRM", a: "No owner", b: "Assigned", tag: "Assigned", x: 33, y: 86, rx: 140, dur: 3.1, delay: -2.0 },
];

// Website → Email, then the fan-out: Email → Sheet and Website → CRM
const FAN = ["M58 24 H102", "M127 36 V74", "M33 36 V74"];
const ROW = `M${CARDS[0].rx} ${ROW_Y} H${CARDS[3].rx}`;

/* scroll thresholds */
const T = {
  signalIn: [0, 0.22],
  webOn: 0.25,
  lineA: [0.27, 0.53],
  emailRead: 0.55,
  fan: [0.56, 0.78],
  sheetDone: 0.78,
  allSync: 0.8,
  crmOwned: 0.84,
  morph: [0.86, 0.97],
  row: [0.9, 0.98],
} as const;

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const seg = (p: number, r: readonly [number, number]) => clamp01((p - r[0]) / (r[1] - r[0]));
const inOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/**
 * Linear-then-ease-out: constant draw speed, then a slight deceleration on
 * arrival. Linear up to t=0.7, then a quadratic ease-out whose starting
 * slope matches the linear part (y at the knee = 2a / (1 + a)).
 */
const KNEE = 0.7;
const Y_KNEE = (2 * KNEE) / (1 + KNEE);
const drawEase = (t: number) =>
  t <= KNEE ? (t / KNEE) * Y_KNEE : Y_KNEE + (1 - Y_KNEE) * (1 - Math.pow(1 - (t - KNEE) / (1 - KNEE), 2));

const setFlag = (el: HTMLElement | null, key: string, on: boolean) => {
  if (!el) return;
  const v = on ? "1" : "0";
  if (el.dataset[key] !== v) el.dataset[key] = v;
};

const relTo = (n: HTMLElement, root: HTMLElement) => {
  let x = 0;
  let y = 0;
  let c: HTMLElement | null = n;
  while (c && c !== root) {
    x += c.offsetLeft;
    y += c.offsetTop;
    c = c.offsetParent as HTMLElement | null;
  }
  return { x, y };
};

function Copy() {
  const w = siteContent.whatWeDo;
  return (
    <div className="flex flex-col gap-[20px]">
      <p className="mono mono-a">{w.label}</p>
      <h2 className="d2" data-r="mask">
        {w.lineA}
      </h2>
      <h2 className="d2" data-r="mask" style={{ color: "var(--faint)" }}>
        {w.lineB}
      </h2>
      <p className="body max-w-[46ch]" data-r="meta" data-r-delay="140">
        {w.body}
      </p>
    </div>
  );
}

function PulseDot({ c, bridge }: { c: Card; bridge?: boolean }) {
  return (
    <span
      className="pf-dot"
      style={{ "--pf-dur": `${c.dur}s`, "--pf-delay": `${c.delay}s` } as CSSProperties}
      {...(bridge ? { "data-bridge-target": "", "data-bridge-mode": "flow" } : {})}
    >
      <span className="pf-dot-idle" />
      <span className="pf-dot-sync" />
    </span>
  );
}

function CardBody({ c, bridge }: { c: Card; bridge?: boolean }) {
  return (
    <>
      <div className="flex items-center justify-between gap-[10px]">
        <span className="mono mono-fg">{c.k}</span>
        <PulseDot c={c} bridge={bridge} />
      </div>
      <span className="pf-flip mt-[8px] text-[clamp(13px,1.1vw,15px)] tracking-[-.02em]">
        <span className="pf-a">{c.a}</span>
        {c.b && <span className="pf-b">{c.b}</span>}
      </span>
      <span className="pf-tag mono mt-[6px] block" style={{ fontSize: 9 }}>
        {c.tag}
      </span>
    </>
  );
}

export function ProblemSystem() {
  const [desktop, setDesktop] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(min-width: 900px)").matches
  );

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 900px)");
    const on = () => setDesktop(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  return desktop ? <ProblemPinned /> : <ProblemStacked />;
}

/* ================================================================== */
/* Desktop — pinned, scroll-linked                                      */
/* ================================================================== */
function ProblemPinned() {
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const status = useRef<HTMLSpanElement>(null);
  const state = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const sec = root.current;
    const st = stage.current;
    if (!sec || !st) return;

    const cards = CARDS.map((c) => st.querySelector<HTMLElement>(`[data-card="${c.id}"]`)!);
    const slots = Array.from(st.querySelectorAll<HTMLElement>("[data-thread-slot]"));
    const fan = Array.from(st.querySelectorAll<SVGPathElement>(".pf-fan"));
    const fanGroup = st.querySelector<SVGGElement>(".pf-fan-g")!;
    const row = st.querySelector<SVGPathElement>(".pf-row")!;
    const signal = st.querySelector<HTMLElement>(".pf-signal")!;
    const webDot = cards[0].querySelector<HTMLElement>(".pf-dot")!;

    let u = 1;
    let landing = { x: 0, y: 0 };
    let target = { x: 0, y: 0 };
    let lastStatus = "";

    const measure = () => {
      u = st.clientWidth / W;
      landing = { x: signal.offsetLeft + signal.offsetWidth / 2, y: signal.offsetTop + signal.offsetHeight / 2 };
      const card = cards[0];
      const d = relTo(webDot, card);
      // cards are anchored at their centre via translate(-50%,-50%); offsets ignore transforms
      target = {
        x: card.offsetLeft - card.offsetWidth / 2 + d.x + webDot.offsetWidth / 2,
        y: card.offsetTop - card.offsetHeight / 2 + d.y + webDot.offsetHeight / 2,
      };
    };

    const render = (p: number) => {
      // 1 — the carried signal settles on Website, then merges into it
      const s = inOut(seg(p, T.signalIn));
      const merge = seg(p, [T.webOn, T.webOn + 0.05]);
      signal.style.transform = `translate(${(target.x - landing.x) * s}px, ${(target.y - landing.y) * s}px) scale(${1 - merge * 0.5})`;
      signal.style.opacity = p <= 0 ? "0" : String(1 - merge);

      // 2/3 — stroke draws (never all at once)
      fan[0].style.strokeDashoffset = String(1 - drawEase(seg(p, T.lineA)));
      fan[1].style.strokeDashoffset = String(1 - drawEase(seg(p, T.fan)));
      fan[2].style.strokeDashoffset = String(1 - drawEase(seg(p, T.fan)));

      // state flips
      const [web, email, sheet, crm] = cards;
      setFlag(web, "sync", p >= T.webOn);
      setFlag(web, "done", p >= T.webOn);
      setFlag(email, "flip", p >= T.emailRead);
      setFlag(email, "done", p >= T.emailRead);
      setFlag(sheet, "done", p >= T.sheetDone);
      setFlag(crm, "flip", p >= T.crmOwned);
      setFlag(crm, "done", p >= T.crmOwned);
      [email, sheet, crm].forEach((c) => setFlag(c, "sync", p >= T.allSync));

      // 4 — compress into the compact diagram. The shared thread nodes are
      // positioned by <SystemThread/>; these slots are their anchors and
      // travel with the cards so the hand-off is pixel-exact.
      const m = inOut(seg(p, T.morph));
      const cardFade = seg(p, [T.morph[0], T.morph[0] + 0.06]);
      CARDS.forEach((c, i) => {
        const dx = (c.rx - c.x) * u * m;
        const dy = (ROW_Y - c.y) * u * m;
        cards[i].style.transform = `translate(-50%,-50%) translate(${dx}px,${dy}px) scale(${1 - 0.6 * m})`;
        cards[i].style.opacity = String(1 - cardFade);
        const slot = slots[i];
        if (slot) slot.style.transform = `translate(${dx}px,${dy}px)`;
      });
      fanGroup.style.opacity = String(1 - seg(p, [T.morph[0], T.morph[0] + 0.07]));
      row.style.strokeDashoffset = String(1 - drawEase(seg(p, T.row)));
      emitThread();

      // status line
      const conn = p >= T.sheetDone ? 3 : p >= T.lineA[1] ? 1 : 0;
      const next = p >= T.row[0] ? "one system|Connected" : `${conn} connection${conn === 1 ? "" : "s"}|${conn === 0 ? "Disconnected" : conn === 3 ? "Connected" : "Connecting"}`;
      if (next !== lastStatus) {
        lastStatus = next;
        const [a, b] = next.split("|");
        if (status.current) status.current.textContent = `4 tools · ${a}`;
        if (state.current) {
          state.current.textContent = b;
          state.current.style.color = b === "Disconnected" ? "var(--faint)" : "var(--accent-deep)";
        }
      }
    };

    if (prefersReducedMotion()) {
      measure();
      render(T.crmOwned + 0.01); // resolved state, no pin, no morph
      return;
    }

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        id: "problem-pin",
        trigger: sec,
        start: "top top",
        end: () => `+=${Math.round(window.innerHeight * 2.1)}`,
        pin: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onRefresh: (self) => {
          measure();
          render(self.progress);
        },
        onUpdate: (self) => render(self.progress),
      });
    }, sec);

    measure();
    render(0);
    // the bridge dot reads this pin's start — make it re-measure
    const raf = requestAnimationFrame(() => ScrollTrigger.refresh());

    return () => {
      cancelAnimationFrame(raf);
      ctx.revert();
    };
  }, []);

  return (
    <section ref={root} id="problem" data-bridge-root className="relative flex h-[100svh] w-full items-center pt-[72px]">
      <div className="wrap grid w-full grid-cols-12 items-center gap-[clamp(28px,4vw,72px)]">
        <div className="col-span-5">
          <Copy />
        </div>

        <div className="col-span-7">
          <div className="ml-auto" style={{ maxWidth: "calc((100svh - 230px) * 16 / 11)" }}>
            <div className="mb-[12px] flex items-center justify-between">
              <span ref={status} className="mono">4 tools · 0 connections</span>
              <span ref={state} className="mono">Disconnected</span>
            </div>

            <div ref={stage} className="pf-beat relative w-full rounded-[6px]" style={{ aspectRatio: "16 / 11", background: "var(--bg-2)" }}>
              <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full" aria-hidden>
                <g className="pf-fan-g">
                  {FAN.map((d, i) => (
                    <path key={i} className="pf-fan" d={d} pathLength={1} strokeDasharray="1" style={{ strokeDashoffset: 1 }} stroke="var(--accent-deep)" strokeWidth=".5" fill="none" strokeLinecap="round" />
                  ))}
                </g>
                <path id="problem-diagram-line" className="pf-row" d={ROW} pathLength={1} strokeDasharray="1" style={{ strokeDashoffset: 1 }} stroke="var(--accent-deep)" strokeWidth=".45" fill="none" />
              </svg>

              {CARDS.map((c) => (
                <div
                  key={c.id}
                  data-card={c.id}
                  data-sync="0"
                  data-flip="0"
                  data-done="0"
                  className="pf-card absolute flex w-[31%] flex-col rounded-[5px] border p-[clamp(9px,1vw,13px)]"
                  style={{ left: `${(c.x / W) * 100}%`, top: `${(c.y / H) * 100}%`, transform: "translate(-50%,-50%)" }}
                >
                  <CardBody c={c} />
                </div>
              ))}

              {/* Anchors only — the shared thread nodes are rendered once by
                  <SystemThread/> and travel from here into the Services tabs. */}
              <div id="problem-diagram" aria-hidden>
                {CARDS.map((c) => (
                  <span
                    key={c.id}
                    data-thread-slot="problem"
                    data-cmp={c.k}
                    className="pointer-events-none absolute block"
                    style={{ left: `${(c.x / W) * 100}%`, top: `${(c.y / H) * 100}%`, width: 0, height: 0 }}
                  />
                ))}
              </div>

              <span
                className="pf-signal signal-dot absolute z-[4]"
                data-bridge-target=""
                data-bridge-mode="pin"
                data-bridge-pin="problem-pin"
                style={{ left: "50%", top: "50%", marginLeft: -3, marginTop: -3, opacity: 0 }}
                aria-hidden
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ================================================================== */
/* Mobile — stacked, each card resolves in the middle third             */
/* ================================================================== */
const MOBILE_ORDER: CardId[] = ["web", "email", "sheet", "crm"];

function ProblemStacked() {
  const root = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const sec = root.current;
    if (!sec) return;
    const items = Array.from(sec.querySelectorAll<HTMLElement>(".pfm-item"));
    const resolve = (el: HTMLElement, on: boolean) => {
      setFlag(el, "done", on);
      setFlag(el, "sync", on);
      setFlag(el, "flip", on);
    };

    if (prefersReducedMotion()) {
      items.forEach((el) => resolve(el, true));
      return;
    }

    const ctx = gsap.context(() => {
      items.forEach((el, i) => {
        // Website resolves when the carried signal lands on it (viewport centre)
        const trigger = i === 0 ? el.querySelector<HTMLElement>(".pf-dot")! : el;
        ScrollTrigger.create({
          trigger,
          start: i === 0 ? "center center" : "top 66%",
          onEnter: () => resolve(el, true),
          onLeaveBack: () => resolve(el, false),
        });
      });
    }, sec);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} id="problem" className="relative w-full py-[clamp(56px,12vw,90px)]">
      <div className="wrap">
        <Copy />
        <div className="pf-beat mt-[36px] flex flex-col">
          {MOBILE_ORDER.map((id, i) => {
            const c = CARDS.find((x) => x.id === id)!;
            return (
              <div key={id} className="pfm-item" data-done="0" data-sync="0" data-flip="0">
                {i > 0 && (
                  <span className="relative ml-[22px] block h-[34px] w-px" style={{ background: "var(--line)" }} aria-hidden>
                    <span className="pfm-seg absolute inset-0" style={{ background: "var(--accent-deep)" }} />
                  </span>
                )}
                <div className="pf-card flex flex-col rounded-[5px] border p-[14px]">
                  <CardBody c={c} bridge={i === 0} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
