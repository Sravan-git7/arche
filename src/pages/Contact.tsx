import { useEffect, useRef, useState } from "react";
import { siteContent } from "../data/site";
import { usePage } from "../lib/router";
import { useReveal } from "../lib/reveal";
import { gsap, prefersReducedMotion } from "../lib/gsap";
import { readLastTrigger, type VisualTrigger } from "../data/intents";
import { mailtoFallback, submitInquiry, type InquiryPayload } from "../lib/inquiries";

/**
 * PROMPT 17 — Contact: guided, spatial inquiry flow.
 *
 * Four steps, each answered answer compressed into a small tag that rides
 * above the next question (the flow never feels amnesiac). Step changes
 * slide in from the right while the answered option flies up into its tag
 * — a spatial move, not a fade-and-replace.
 *
 * Final submit: the lime signal dot — seeded by the visitor's last-active
 * Ask Arche visual trigger (Prompt 16 handoff, sessionStorage) — travels
 * from the form into a compact static rendering of the system node
 * structure and lights the matching node: REQUEST RECEIVED.
 *
 * PROMPT 37 — the submit is now real. The four collected fields are
 * POSTed to the configured delivery endpoint (see src/lib/inquiries.ts).
 * "REQUEST RECEIVED" is only reachable after a genuine 2xx response;
 * the "sending" phase shows the form with a live "Sending…" state, and
 * any failure (bad endpoint, network error, service down, not yet
 * configured) lands on an honest failure screen with a pre-filled
 * mailto fallback and a Try-again that keeps every answer — no fake
 * confirmations, no silently lost leads.
 */

type BuildOption = "Website" | "AI Agent" | "Automation" | "Video" | "Other";

const BUILD_OPTIONS: { k: BuildOption; hint: string }[] = [
  { k: "Website", hint: "A site that has to perform, not just exist." },
  { k: "AI Agent", hint: "Answers real questions, takes real actions." },
  { k: "Automation", hint: "Manual work, handed to a system." },
  { k: "Video", hint: "Footage turned into content that ships." },
  { k: "Other", hint: "Something between or beyond — tell us." },
];

const TIMELINE_OPTIONS = [
  { k: "Weeks — in a hurry", hint: "There's a date. Work backwards from it." },
  { k: "1–3 months", hint: "Room to do it properly." },
  { k: "3+ months", hint: "Larger scope, or a phased build." },
  { k: "Just exploring", hint: "No date yet — mapping options." },
];

/** Ask Arche trigger → which node lights in the confirmation diagram. */
const TRIGGER_NODE: Record<VisualTrigger, string> = {
  "service:web": "web",
  "service:agent": "agent",
  "service:automation": "auto",
  "service:video": "content",
  system: "core",
  contact: "core",
};

type TagKey = "build" | "change" | "timeline";

/** Ask Arche seed → plain-language signal label (confirmation + payload). */
const SIGNAL_LABEL: Record<VisualTrigger, string> = {
  "service:web": "website",
  "service:agent": "agent",
  "service:automation": "automation",
  "service:video": "video",
  system: "system",
  contact: "system",
};

export function ContactPage() {
  usePage("Start a Project — Arche");
  useReveal();

  const c = siteContent.contact;
  const [step, setStep] = useState(0);
  const [build, setBuild] = useState<BuildOption | null>(null);
  const [change, setChange] = useState("");
  const [timeline, setTimeline] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [phase, setPhase] = useState<"form" | "sending" | "received" | "failed">("form");
  const [failReason, setFailReason] = useState<"unconfigured" | "network" | "rejected">("network");
  const [tagged, setTagged] = useState<Record<TagKey, boolean>>({ build: false, change: false, timeline: false });
  const [dismissed, setDismissed] = useState<Record<TagKey, boolean>>({ build: false, change: false, timeline: false });
  const [seed, setSeed] = useState<VisualTrigger | null>(null);

  const stepRef = useRef<HTMLDivElement>(null);
  const sendBtnRef = useRef<HTMLButtonElement>(null);
  const sendRectRef = useRef<DOMRect | null>(null);
  const pendingTag = useRef<TagKey | null>(null);

  // Prompt 16 → 17 handoff: the last Ask Arche trigger seeds the confirmation
  // Prompt 26 handoff: prefilled service selection from dedicated service pages
  useEffect(() => {
    setSeed(readLastTrigger());
    try {
      const stored = sessionStorage.getItem("arche:prefill");
      if (stored) {
        const parsed = JSON.parse(stored);
        let targetBuild: BuildOption | null = null;
        if (parsed.build) {
          targetBuild = parsed.build as BuildOption;
        } else if (parsed.service) {
          const map: Record<string, BuildOption> = {
            "video-editing": "Video",
            "web-development": "Website",
            "ai-chatbots": "AI Agent",
            "ai-automation": "Automation",
          };
          targetBuild = map[parsed.service] || null;
        }
        if (targetBuild) {
          setBuild(targetBuild);
        }
        if (parsed.pkg) {
          setChange(`Interested in ${parsed.pkg}.`);
        }
        sessionStorage.removeItem("arche:prefill");
      }
    } catch {
      /* ignore */
    }
  }, []);

  // step slide-in from the right (only for real step changes, not the
  // form→sending re-render — the form must not lurch on submit)
  useEffect(() => {
    if (phase !== "form" || !stepRef.current || prefersReducedMotion()) return;
    gsap.fromTo(
      stepRef.current,
      { x: 46, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.55, ease: "expo.out" }
    );
  }, [step, phase]);

  // after a step render, land any in-flight tag ghost at its slot
  useEffect(() => {
    const key = pendingTag.current;
    if (!key) return;
    const slot = document.querySelector<HTMLElement>(`[data-tag-slot="${key}"]`);
    const ghost = document.querySelector<HTMLElement>(".tag-ghost");
    if (slot && ghost) {
      const from = ghost.getBoundingClientRect();
      const to = slot.getBoundingClientRect();
      gsap.to(ghost, {
        x: to.left - from.left + (to.width - from.width) / 2,
        y: to.top - from.top + (to.height - from.height) / 2,
        scale: (to.width / from.width) * 0.92,
        duration: 0.55,
        ease: "expo.inOut",
        onComplete: () => {
          ghost.remove();
          setTagged((t) => ({ ...t, [key]: true }));
          pendingTag.current = null;
        },
      });
    } else {
      ghost?.remove();
      setTagged((t) => ({ ...t, [key]: true }));
      pendingTag.current = null;
    }
  }, [step]);

  const flyTag = (key: TagKey, fromEl: HTMLElement | null, text: string) => {
    pendingTag.current = key;
    if (prefersReducedMotion() || !fromEl) {
      setTagged((t) => ({ ...t, [key]: true }));
      pendingTag.current = null;
      return;
    }
    const r = fromEl.getBoundingClientRect();
    const ghost = document.createElement("div");
    ghost.className = "tag-ghost mono";
    ghost.textContent = text;
    ghost.style.cssText = `position:fixed;left:${r.left + r.width / 2}px;top:${r.top + r.height / 2}px;width:${Math.max(r.width, 90)}px;translate:-50% -50%;z-index:80;pointer-events:none;`;
    document.body.appendChild(ghost);
  };

  const chooseBuild = (o: BuildOption, el: HTMLElement) => {
    if (build !== o) {
      setBuild(o);
      setDismissed((d) => ({ ...d, build: false }));
    }
    window.setTimeout(() => {
      flyTag("build", el, `Building: ${o}`);
      setStep(1);
    }, 340);
  };

  const chooseTimeline = (o: string, el: HTMLElement) => {
    setTimeline(o);
    setDismissed((d) => ({ ...d, timeline: false }));
    window.setTimeout(() => {
      flyTag("timeline", el, `Timeline: ${o}`);
      setStep(3);
    }, 340);
  };

  const submitChange = (el: HTMLElement | null) => {
    setDismissed((d) => ({ ...d, change: false }));
    flyTag("change", el, change.trim() ? `Change: ${change.trim().slice(0, 22)}…` : "Change: noted");
    // P37: the timeline step must actually be reachable — before this fix
    // the flow jumped 1 → 3 and every inquiry shipped timeline: "—".
    setStep(2);
  };

  const goBack = (target: number) => {
    if (target === 0) setDismissed((d) => ({ ...d, build: true }));
    if (target === 2) setDismissed((d) => ({ ...d, timeline: true }));
    if (target === 1) setDismissed((d) => ({ ...d, change: true }));
    setStep(target);
  };

  const canSubmit = name.trim().length > 1 && /\S+@\S+\.\S+/.test(email);

  /** Everything the flow collected, shaped for delivery (PROMPT 37). */
  const payload = (): InquiryPayload => ({
    name: name.trim(),
    email: email.trim(),
    company: company.trim() || undefined,
    building: build ?? "Other",
    whatNeedsToChange: change.trim() || "—",
    timeline: timeline ?? "—",
    askArcheSignal: seed ? SIGNAL_LABEL[seed] : undefined,
  });

  const submit = async () => {
    if (!canSubmit || phase !== "form") return;
    setPhase("sending");

    // Local archive (kept from before — a per-visitor record, NOT the
    // real pipeline; the real delivery is below).
    try {
      const log = JSON.parse(localStorage.getItem("arche:inquiries") || "[]");
      log.push({ build, change, timeline, name, email, company, seed, at: new Date().toISOString() });
      localStorage.setItem("arche:inquiries", JSON.stringify(log));
    } catch {
      /* fine */
    }

    // The honest gate: only a genuine 2xx from the delivery endpoint
    // may lead to "REQUEST RECEIVED".
    const result = await submitInquiry(payload());
    if (result.ok) {
      // capture the button's position before the form unmounts — the
      // signal dot flies from here into the node diagram
      sendRectRef.current = sendBtnRef.current?.getBoundingClientRect() ?? null;
      setPhase("received");
    } else {
      setFailReason(result.reason);
      setPhase("failed");
    }
  };

  // signal dot flight: form → node diagram (Prompt 16 seed picks the node)
  useEffect(() => {
    if (phase !== "received") return;
    const nodeEl = document.querySelector<HTMLElement>("[data-receive-node]");
    const note = document.querySelector<HTMLElement>("[data-receive-note]");
    if (!nodeEl) return;

    if (prefersReducedMotion()) {
      nodeEl.classList.add("node-lit");
      return;
    }

    // the note reveals only when the signal arrives
    if (note) gsap.set(note, { opacity: 0 });
    const from = sendRectRef.current;
    const to = nodeEl.getBoundingClientRect();
    const dot = document.createElement("span");
    dot.className = "signal-dot";
    const startX = from ? from.left + from.width / 2 : window.innerWidth / 2;
    const startY = from ? from.top + from.height / 2 : window.innerHeight + 40;
    dot.style.cssText = `position:fixed;left:${startX}px;top:${startY}px;z-index:90;width:8px;height:8px;`;
    document.body.appendChild(dot);
    gsap.fromTo(
      dot,
      { x: 0, y: 0, scale: 1.4, opacity: 1 },
      {
        x: to.left + to.width / 2 - startX,
        y: to.top + to.height / 2 - startY,
        scale: 0.9,
        duration: 0.95,
        ease: "expo.inOut",
        onComplete: () => {
          dot.remove();
          nodeEl.classList.add("node-lit");
          gsap.fromTo(
            nodeEl,
            { scale: 1.7 },
            { scale: 1, duration: 0.7, ease: "elastic.out(1, 0.55)" }
          );
          const note = document.querySelector<HTMLElement>("[data-receive-note]");
          if (note) gsap.fromTo(note, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.6, ease: "power3.out", delay: 0.12 });
        },
      }
    );
  }, [phase]);

  const tagData: { key: TagKey; label: string; landed: boolean }[] = [];
  const isPending = (k: TagKey) => pendingTag.current === k;
  if (build && (tagged.build || isPending("build")) && !dismissed.build)
    tagData.push({ key: "build", label: `Building: ${build}`, landed: tagged.build });
  if ((tagged.change || isPending("change")) && !dismissed.change && change.trim())
    tagData.push({ key: "change", label: `Change: ${change.trim().slice(0, 26)}${change.trim().length > 26 ? "…" : ""}`, landed: tagged.change });
  if (timeline && (tagged.timeline || isPending("timeline")) && !dismissed.timeline)
    tagData.push({ key: "timeline", label: `Timeline: ${timeline}`, landed: tagged.timeline });

  const stepTitles = ["WHAT ARE YOU BUILDING?", "WHAT NEEDS TO CHANGE?", "TIMELINE / SCALE", "WHERE DO WE REPLY?"];

  return (
    <section className="w-full pt-[130px] pb-[clamp(60px,8vw,130px)]">
      <div className="wrap max-w-[880px]">
        <p className="mono mono-a mb-[14px]" data-r="meta">
          {c.label}
        </p>
        <h1 className="d1 max-w-[14ch]" data-r="mask">
          {c.closing}
        </h1>
        <p className="body mt-[18px] max-w-[52ch]" data-r="meta" data-r-delay="120">
          Four short steps — more conversation than form. Rough answers are fine; we'll sharpen
          them together.
        </p>

        {/* progress */}
        {(phase === "form" || phase === "sending") && (
          <div className="mt-[clamp(30px,4vw,52px)] flex items-center gap-[14px]" data-r="meta">            <span className="mono">
              0{Math.min(step + 1, 4)} / 04
            </span>
            <span className="relative h-px flex-1 overflow-hidden" style={{ background: "var(--line)" }}>
              <span
                className="absolute inset-y-0 left-0"
                style={{ width: `${((step + 1) / 4) * 100}%`, background: "var(--accent-deep)", transition: "width .6s var(--e-out)" }}
              />
            </span>
          </div>
        )}

        {/* accumulated tags */}
        {(phase === "form" || phase === "sending") && tagData.length > 0 && (
          <div className="mt-[16px] flex flex-wrap items-center gap-[8px]">
            {tagData.map((t) => (
              <span
                key={t.key}
                data-tag-slot={t.key}
                className="mono inline-flex items-center gap-[7px] rounded-full px-[11px] py-[5px]"
                style={{
                  border: "1px solid var(--line)",
                  color: "var(--muted)",
                  background: "var(--bg-2)",
                  opacity: t.landed ? 1 : 0,
                  transition: "opacity .2s",
                }}
              >
                {t.label}
                <button
                  aria-label={`Edit ${t.key}`}
                  className="cursor-pointer leading-none"
                  style={{ color: "var(--faint)" }}
                  onClick={() => goBack(t.key === "build" ? 0 : t.key === "change" ? 1 : 2)}
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}

        {/* ------------------------------ STEPS ------------------------------ */}
        {phase === "form" || phase === "sending" ? (
          <div ref={stepRef} className="mt-[clamp(26px,3.4vw,46px)]">
            {step === 0 && (
              <div>
                <StepTitle n="01" title={stepTitles[0]} />
                <div className="mt-[8px] flex flex-col">
                  {BUILD_OPTIONS.map((o) => (
                    <button
                      key={o.k}
                      onClick={(e) => chooseBuild(o.k, e.currentTarget)}
                      data-cursor="SELECT"
                      className="group flex items-baseline justify-between gap-[16px] border-b py-[18px] text-left"
                      style={{
                        borderColor: build === o.k ? "var(--accent-deep)" : "var(--line)",
                        background: build === o.k ? "var(--bg-2)" : "transparent",
                        transition: "border-color .3s, background .3s, padding-left .3s var(--e-out)",
                      }}
                    >
                      <span className="flex items-baseline gap-[16px]">
                        <span className="d3 group-hover:translate-x-[6px]" style={{ transition: "transform .35s var(--e-out)", fontSize: "clamp(22px,3vw,34px)" }}>
                          {o.k}
                        </span>
                        <span className="body-s hidden sm:block" style={{ color: "var(--faint)" }}>
                          {o.hint}
                        </span>
                      </span>
                      <span className="mono" style={{ color: build === o.k ? "var(--accent-deep)" : "var(--faint)" }}>
                        {build === o.k ? "Selected →" : "→"}
                      </span>
                    </button>
                  ))}
                </div>
                {build && (
                  <div className="mt-[16px] flex items-center justify-between p-[12px_16px] rounded-[6px] border" style={{ borderColor: "var(--accent-deep)", background: "var(--bg-2)" }}>
                    <span className="mono text-[11px]">
                      Pre-selected: <strong style={{ color: "var(--accent-deep)" }}>{build}</strong>
                    </span>
                    <button
                      type="button"
                      className="btn btn-primary text-[11px] py-[6px] px-[14px]"
                      onClick={(e) => chooseBuild(build, e.currentTarget)}
                    >
                      Continue with {build} →
                    </button>
                  </div>
                )}
                <p className="body-s mt-[14px]" style={{ color: "var(--faint)" }}>
                  Pick the closest — "Other" is a perfectly good answer.
                </p>
              </div>
            )}

            {step === 1 && (
              <div>
                <StepTitle n="02" title={stepTitles[1]} />
                <label className="mt-[18px] flex flex-col">
                  <span className="sr-only">What needs to change?</span>
                  <textarea
                    className="field min-h-[130px] resize-y"
                    autoFocus
                    value={change}
                    onChange={(e) => setChange(e.target.value)}
                    placeholder="What's slow, broken, or missing? What should be true a few months from now?"
                  />
                </label>
                <div className="mt-[16px] flex items-center gap-[14px]">
                  <button
                    className="btn"
                    disabled={change.trim().length < 3}
                    onClick={(e) => submitChange(e.currentTarget)}
                    data-cursor="START"
                  >
                    Continue <span className="arw">→</span>
                  </button>
                  <span className="body-s" style={{ color: "var(--faint)" }}>
                    A sentence or two is plenty.
                  </span>
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <StepTitle n="03" title={stepTitles[2]} />
                <div className="mt-[8px] flex flex-col">
                  {TIMELINE_OPTIONS.map((o) => (
                    <button
                      key={o.k}
                      onClick={(e) => chooseTimeline(o.k, e.currentTarget)}
                      data-cursor="SELECT"
                      className="group flex items-baseline justify-between gap-[16px] border-b py-[18px] text-left"
                      style={{
                        borderColor: timeline === o.k ? "var(--accent-deep)" : "var(--line)",
                        background: timeline === o.k ? "var(--bg-2)" : "transparent",
                        transition: "border-color .3s, background .3s",
                      }}
                    >
                      <span className="d4">{o.k}</span>
                      <span className="body-s hidden sm:block" style={{ color: "var(--faint)" }}>
                        {o.hint}
                      </span>
                      <span className="mono" style={{ color: "var(--faint)" }}>
                        →
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <StepTitle n="04" title={stepTitles[3]} />
                <div className="mt-[18px] grid gap-[16px] sm:grid-cols-2">
                  <label className="flex flex-col">
                    <span className="mono mb-[6px]">Name</span>
                    <input className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="Who's building this?" />
                  </label>
                  <label className="flex flex-col">
                    <span className="mono mb-[6px]">Email</span>
                    <input className="field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
                  </label>
                  <label className="flex flex-col sm:col-span-2">
                    <span className="mono mb-[6px]">
                      Company <span style={{ color: "var(--faint)" }}>(optional)</span>
                    </span>
                    <input className="field" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Only if you'd like to share" />
                  </label>
                </div>
                <div className="mt-[20px] flex items-center gap-[16px]">
                  <button
                    ref={sendBtnRef}
                    className="btn"
                    disabled={!canSubmit || phase === "sending"}
                    onClick={submit}
                    data-cursor={phase === "sending" ? undefined : "START"}
                    data-magnetic
                  >
                    {phase === "sending" ? (
                      <span className="flex items-center gap-[10px]">
                        <span className="signal-dot" style={{ width: 7, height: 7 }} />
                        Sending
                      </span>
                    ) : (
                      <>
                        Send request <span className="arw">→</span>
                      </>
                    )}
                  </button>
                  <span className="body-s" style={{ color: "var(--faint)" }}>
                    No newsletters, no drip — a human replies.
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : phase === "failed" ? (
          /* -------------------- HONEST FAILURE (PROMPT 37) --------------------
             Never a fake "REQUEST RECEIVED". The visitor keeps every
             answer (the form state is untouched) and gets one working
             path out: a pre-filled email with the whole inquiry in the
             body. */
          <div className="mt-[clamp(30px,4vw,56px)] max-w-[560px]">
            <p className="mono mono-a mb-[10px]" style={{ color: "var(--accent-deep)" }}>
              {failReason === "unconfigured" ? "NOT CONNECTED YET" : "SOMETHING WENT WRONG"}
            </p>
            <h2 className="d3 mb-[12px]">The request didn't reach us.</h2>
            <p className="body max-w-[48ch]">
              {failReason === "unconfigured"
                ? "This build's delivery pipeline isn't wired up yet, so we can't confirm your request went through."
                : failReason === "network"
                ? "The connection dropped before we could send it."
                : "The delivery service refused the request."}{" "}
              Nothing was lost — your answers are kept on this page.
            </p>
            <div className="mt-[18px] flex flex-col gap-[10px] rounded-[8px] border p-[16px_18px]" style={{ borderColor: "var(--accent-deep)", background: "var(--bg-2)" }}>
              <span className="mono text-[10px]" style={{ color: "var(--muted)" }}>
                FASTEST FIX — EMAIL US DIRECTLY (ALL FOUR ANSWERS ARE PRE-FILLED IN THE MESSAGE)
              </span>
              <a className="lnk mono-fg" href={mailtoFallback(c.email, payload())}>
                {c.email}
              </a>
            </div>
            <div className="mt-[18px] flex items-center gap-[16px]">
              <button className="btn btn-ghost" onClick={() => setPhase("form")}>
                Try again <span className="arw">→</span>
              </button>
              <span className="body-s" style={{ color: "var(--faint)" }}>
                Your answers stay right where you left them.
              </span>
            </div>
          </div>
        ) : (
          /* ----------------------- REQUEST RECEIVED -----------------------
             Only reachable after a genuine 2xx from the delivery
             endpoint — see src/lib/inquiries.ts. */
          <div className="mt-[clamp(30px,4vw,56px)] grid items-center gap-[clamp(26px,4vw,54px)] sm:grid-cols-2">
            <div>
              <p className="mono mono-a mb-[10px]" style={{ color: "var(--accent-deep)" }}>
                REQUEST RECEIVED
              </p>
              <h2 className="d3 mb-[12px]">It's in the system.</h2>
              <p className="body max-w-[44ch]" data-receive-note="">
                Thanks {name.trim().split(" ")[0]}{build ? ` — a ${build.toLowerCase()} it is` : ""}. A
                real reply goes to <span style={{ color: "var(--fg)" }}>{email}</span>, usually within
                two working days, with next steps and honest scoping.
              </p>
              {seed && (
                <p className="mono mt-[14px]" style={{ color: "var(--faint)" }}>
                  Signal carried over from Ask Arche —{" "}
                  <span style={{ color: "var(--accent-deep)" }}>
                    {SIGNAL_LABEL[seed]}
                  </span>
                </p>
              )}
              <p className="mono mt-[20px]">
                Prefer email?{" "}
                <a className="lnk mono-fg" href={`mailto:${c.email}`}>
                  {c.email}
                </a>
              </p>
            </div>

            {/* compact, static rendering of the System Moment node structure */}
            <div className="relative aspect-square w-full max-w-[320px] justify-self-center sm:justify-self-end" aria-hidden>
              <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" fill="none">
                <line x1="50" y1="50" x2="22" y2="24" stroke="var(--line)" strokeWidth="0.6" />
                <line x1="50" y1="50" x2="80" y2="20" stroke="var(--line)" strokeWidth="0.6" />
                <line x1="50" y1="50" x2="82" y2="62" stroke="var(--line)" strokeWidth="0.6" />
                <line x1="50" y1="50" x2="24" y2="80" stroke="var(--line)" strokeWidth="0.6" />
                <line x1="50" y1="50" x2="58" y2="88" stroke="var(--line)" strokeWidth="0.6" />
                <line x1="22" y1="24" x2="80" y2="20" stroke="var(--line)" strokeWidth="0.35" opacity="0.6" />
                <line x1="24" y1="80" x2="58" y2="88" stroke="var(--line)" strokeWidth="0.35" opacity="0.6" />
              </svg>
              <ReceiveNode x={22} y={24} id="web" seed={seed} label="WEB" />
              <ReceiveNode x={80} y={20} id="agent" seed={seed} label="AGENT" />
              <ReceiveNode x={82} y={62} id="auto" seed={seed} label="AUTO" />
              <ReceiveNode x={24} y={80} id="content" seed={seed} label="CONTENT" />
              <ReceiveNode x={50} y={50} id="core" seed={seed} label="" core />
              <ReceiveNode x={58} y={88} id="extra" seed={seed} label="" />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function StepTitle({ n, title }: { n: string; title: string }) {
  return (
    <div className="flex items-baseline gap-[14px]">
      <span className="mono" style={{ color: "var(--accent-deep)" }}>
        {n}
      </span>
      <h2 className="d3" style={{ fontSize: "clamp(20px,2.6vw,30px)" }}>
        {title}
      </h2>
    </div>
  );
}

function ReceiveNode({
  x,
  y,
  id,
  seed,
  label,
  core = false,
}: {
  x: number;
  y: number;
  id: string;
  seed: VisualTrigger | null;
  label: string;
  core?: boolean;
}) {
  const willLight = seedMatches(seed, id);
  const size = core ? 26 : label ? 13 : 9;
  return (
    <span
      data-receive-node={willLight ? "" : undefined}
      className="receive-node absolute rounded-full"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width: size,
        height: size,
        translate: "-50% -50%",
        background: willLight ? "var(--bg-2)" : "var(--line)",
        border: willLight ? "1.5px solid var(--accent-deep)" : "1px solid var(--line)",
        transition: "background .4s, border-color .4s",
      }}
    >
      {label && (
        <span className="mono absolute left-1/2 top-full mt-[6px] -translate-x-1/2 whitespace-nowrap text-[8px]" style={{ color: "var(--faint)" }}>
          {label}
        </span>
      )}
    </span>
  );
}

function seedMatches(seed: VisualTrigger | null, id: string): boolean {
  const target = seed ? TRIGGER_NODE[seed] : "core";
  return target === id;
}
