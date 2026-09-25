import { useEffect, useMemo, useRef, useState } from "react";
import { services, siteContent } from "../data/site";
import { usePage } from "../lib/router";
import { useReveal } from "../lib/reveal";
import { activeProvider, type PaymentStatus } from "../lib/payments";
import { gsap, prefersReducedMotion } from "../lib/gsap";

type Prefill = { service?: string; pkg?: string };

/**
 * PROMPT 17 — Contact (Guided Inquiry Flow)
 *
 * Redesigned as a progressive-disclosure guided flow rather than a standard form.
 * Each step reveals only after the previous one is answered.
 * Visual confirmation of each answered question (a brief micro-animation).
 *
 *   1. Scope    — service, package (fixed) or custom, timeline, budget
 *   2. Details  — what you're building, contact info, channel
 *   3. Review   — summary → submit inquiry
 *   4. Reserve  — if a fixed package was chosen, optional deposit step
 */
export function ContactPage() {
  usePage("Start a Project — Arche");
  useReveal();

  const c = siteContent.contact;
  const [step, setStep] = useState(0);
  const [service, setService] = useState<string>("");
  const [pkg, setPkg] = useState<string>("Custom");
  const [budget, setBudget] = useState("");
  const [timeline, setTimeline] = useState("");
  const [channel, setChannel] = useState("Email");
  const [form, setForm] = useState({ name: "", email: "", company: "", contact: "", brief: "", reference: "" });
  const [submitted, setSubmitted] = useState(false);
  const [payStatus, setPayStatus] = useState<PaymentStatus>("idle");
  const [payRef, setPayRef] = useState<string>("");

  // Step transition animation refs
  const stepContainerRef = useRef<HTMLDivElement>(null);

  // prefill from service pages
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("arche:prefill");
      if (raw) {
        const p: Prefill = JSON.parse(raw);
        if (p.service) setService(p.service);
        if (p.pkg) setPkg(p.pkg);
        sessionStorage.removeItem("arche:prefill");
      }
    } catch {
      /* fine */
    }
  }, []);

  // Animate step transitions
  useEffect(() => {
    if (!stepContainerRef.current || prefersReducedMotion()) return;
    const container = stepContainerRef.current;
    gsap.fromTo(
      container,
      { opacity: 0, y: 18 },
      { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }
    );
  }, [step]);

  const svc = services.find((s) => s.slug === service);
  const selPkg = useMemo(() => svc?.packages.find((p) => p.name === pkg), [svc, pkg]);

  const canNext0 = !!service && !!timeline;
  const canNext1 = form.name.trim() && /\S+@\S+\.\S+/.test(form.email) && form.brief.trim().length > 4;

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const animateChipSelection = (el: HTMLElement) => {
    if (prefersReducedMotion()) return;
    gsap.fromTo(el, { scale: 0.95 }, { scale: 1, duration: 0.3, ease: "back.out(2)" });
  };

  const goToStep = (target: number) => {
    setStep(target);
    // Scroll the step into view smoothly
    setTimeout(() => {
      stepContainerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 60);
  };

  const submit = () => {
    try {
      const log = JSON.parse(localStorage.getItem("arche:inquiries") || "[]");
      log.push({ service, pkg, budget, timeline, channel, ...form, at: new Date().toISOString() });
      localStorage.setItem("arche:inquiries", JSON.stringify(log));
    } catch {
      /* fine */
    }
    setSubmitted(true);
    goToStep(3);
  };

  const reserve = async () => {
    if (!svc || !selPkg) return;
    setPayStatus("pending");
    try {
      const res = await activeProvider.createCheckout({
        service: svc.title,
        packageName: selPkg.name,
        amountLabel: `${selPkg.deposit || selPkg.price} deposit`,
        customer: { name: form.name, email: form.email },
      });
      setPayStatus(res.status);
      setPayRef(res.reference || "");
    } catch {
      setPayStatus("failed");
    }
  };

  const steps = ["Scope", "Details", "Review", "Confirmation"];

  // Progress bar for visual momentum
  const progress = step / (steps.length - 1);

  return (
    <>
      <section className="w-full pt-[130px] pb-[clamp(50px,7vw,110px)]">
        <div className="wrap">
          <p className="mono mono-a mb-[14px]">{c.label}</p>
          <h1 className="d1 max-w-[13ch]" data-r="mask">
            {c.closing}
          </h1>
          <p className="body mt-[20px] max-w-[52ch]" data-r="meta" data-r-delay="120">
            {c.desc}
          </p>

          {/* stepper with progress bar */}
          <div className="mt-[clamp(34px,4.4vw,64px)]" data-r="meta" data-r-delay="180">
            {/* Progress bar */}
            <div className="mb-[16px] h-[2px] w-full overflow-hidden rounded-full" style={{ background: "var(--line)" }}>
              <div
                className="h-full rounded-full"
                style={{
                  background: "var(--accent-deep)",
                  width: `${progress * 100}%`,
                  transition: "width 0.6s var(--e-out)",
                }}
              />
            </div>
            <div className="flex items-center gap-[10px]">
              {steps.map((s, i) => (
                <div key={s} className="flex items-center gap-[10px]">
                  <button
                    className="mono flex h-[26px] items-center rounded-full px-[12px] transition-all duration-400"
                    style={{
                      border: `1px solid ${i === step ? "var(--accent-deep)" : "var(--line)"}`,
                      color: i === step ? "var(--accent-deep)" : i < step ? "var(--fg)" : "var(--faint)",
                      background: i < step ? "var(--bg-2)" : "transparent",
                      cursor: i < step ? "pointer" : "default",
                    }}
                    onClick={() => i < step && goToStep(i)}
                    disabled={i >= step}
                  >
                    {i < step ? "✓ " : ""}
                    {s}
                  </button>
                  {i < steps.length - 1 && <span className="h-px w-[18px]" style={{ background: "var(--line)" }} />}
                </div>
              ))}
            </div>
          </div>

          <div ref={stepContainerRef} className="mt-[clamp(26px,3vw,44px)] max-w-[860px]">
            {/* STEP 0 — SCOPE */}
            {step === 0 && (
              <div className="flex flex-col gap-[30px]">
                <div>
                  <p className="mono mono-fg mb-[12px]">Which service?*</p>
                  <div className="flex flex-wrap gap-[8px]">
                    {services.map((s) => (
                      <button
                        key={s.slug}
                        className="chip"
                        data-on={service === s.slug ? "1" : "0"}
                        onClick={(e) => {
                          setService(s.slug);
                          setPkg("Custom");
                          animateChipSelection(e.currentTarget);
                        }}
                      >
                        {s.n} {s.title}
                      </button>
                    ))}
                  </div>
                </div>

                {svc && (
                  <div style={{ animation: "demoIn 0.4s var(--e-out) both" }}>
                    <p className="mono mono-fg mb-[12px]">Engagement type</p>
                    <div className="flex flex-wrap gap-[8px]">
                      {svc.packages.map((p) => (
                        <button
                          key={p.name}
                          className="chip"
                          data-on={pkg === p.name ? "1" : "0"}
                          onClick={(e) => {
                            setPkg(p.name);
                            animateChipSelection(e.currentTarget);
                          }}
                        >
                          {p.name} · {p.price}
                        </button>
                      ))}
                      <button
                        className="chip"
                        data-on={pkg === "Custom" ? "1" : "0"}
                        onClick={(e) => {
                          setPkg("Custom");
                          animateChipSelection(e.currentTarget);
                        }}
                      >
                        Custom project
                      </button>
                    </div>
                  </div>
                )}

                <div>
                  <p className="mono mono-fg mb-[12px]">Timeline*</p>
                  <div className="flex flex-wrap gap-[8px]">
                    {c.timelines.map((t) => (
                      <button
                        key={t}
                        className="chip"
                        data-on={timeline === t ? "1" : "0"}
                        onClick={(e) => {
                          setTimeline(t);
                          animateChipSelection(e.currentTarget);
                        }}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {pkg === "Custom" && (
                  <div style={{ animation: "demoIn 0.4s var(--e-out) both" }}>
                    <p className="mono mono-fg mb-[12px]">Budget range</p>
                    <div className="flex flex-wrap gap-[8px]">
                      {c.budgets.map((b) => (
                        <button
                          key={b}
                          className="chip"
                          data-on={budget === b ? "1" : "0"}
                          onClick={(e) => {
                            setBudget(b);
                            animateChipSelection(e.currentTarget);
                          }}
                        >
                          {b}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <button className="btn self-start" disabled={!canNext0} onClick={() => goToStep(1)}>
                  Continue <span className="arw">→</span>
                </button>
              </div>
            )}

            {/* STEP 1 — DETAILS */}
            {step === 1 && (
              <div className="flex flex-col gap-[22px]">
                <div className="grid gap-[20px] sm:grid-cols-2">
                  <label className="flex flex-col">
                    <span className="mono mb-[2px]">Name*</span>
                    <input className="field" value={form.name} onChange={set("name")} placeholder="Your name" />
                  </label>
                  <label className="flex flex-col">
                    <span className="mono mb-[2px]">Company</span>
                    <input className="field" value={form.company} onChange={set("company")} placeholder="Your company" />
                  </label>
                  <label className="flex flex-col">
                    <span className="mono mb-[2px]">Email*</span>
                    <input className="field" type="email" value={form.email} onChange={set("email")} placeholder="you@company.com" />
                  </label>
                  <label className="flex flex-col">
                    <span className="mono mb-[2px]">WhatsApp / phone</span>
                    <input className="field" value={form.contact} onChange={set("contact")} placeholder="+1 555 123 4567" />
                  </label>
                </div>
                <label className="flex flex-col">
                  <span className="mono mb-[2px]">What are you trying to build, automate or improve?*</span>
                  <textarea className="field" rows={4} value={form.brief} onChange={set("brief")} placeholder="A few sentences is enough — we'll take it from there." />
                </label>
                <label className="flex flex-col">
                  <span className="mono mb-[2px]">Website / reference (optional)</span>
                  <input className="field" value={form.reference} onChange={set("reference")} placeholder="https://" />
                </label>
                <div>
                  <p className="mono mono-fg mb-[12px]">Preferred communication</p>
                  <div className="flex flex-wrap gap-[8px]">
                    {c.channels.map((ch) => (
                      <button
                        key={ch}
                        className="chip"
                        data-on={channel === ch ? "1" : "0"}
                        onClick={(e) => {
                          setChannel(ch);
                          animateChipSelection(e.currentTarget);
                        }}
                      >
                        {ch}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-[10px]">
                  <button className="btn btn-ghost" onClick={() => goToStep(0)}>
                    ← Back
                  </button>
                  <button className="btn" disabled={!canNext1} onClick={() => goToStep(2)}>
                    Review <span className="arw">→</span>
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2 — REVIEW */}
            {step === 2 && (
              <div className="flex flex-col gap-[22px]">
                <div className="grid gap-px sm:grid-cols-2" style={{ background: "var(--line)", border: "1px solid var(--line)" }}>
                  {[
                    ["Service", svc?.title || "—"],
                    ["Engagement", pkg + (selPkg ? ` · ${selPkg.price}` : "")],
                    ["Timeline", timeline],
                    ["Budget", pkg === "Custom" ? budget || "To discuss" : selPkg?.price || "—"],
                    ["Name", form.name],
                    ["Email", form.email],
                    ["Company", form.company || "—"],
                    ["Channel", channel],
                  ].map(([k, v], i) => (
                    <div
                      key={k}
                      className="flex flex-col gap-[4px] p-[16px]"
                      style={{
                        background: "var(--bg)",
                        animation: prefersReducedMotion() ? "none" : `demoIn 0.35s var(--e-out) ${i * 40}ms both`,
                      }}
                    >
                      <span className="mono">{k}</span>
                      <span className="body" style={{ color: "var(--fg)" }}>
                        {v}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex flex-col gap-[4px] border p-[16px]" style={{ borderColor: "var(--line)", borderRadius: 6 }}>
                  <span className="mono">Brief</span>
                  <p className="body">{form.brief}</p>
                </div>
                <div className="flex gap-[10px]">
                  <button className="btn btn-ghost" onClick={() => goToStep(1)}>
                    ← Back
                  </button>
                  <button className="btn" onClick={submit}>
                    Submit inquiry <span className="arw">→</span>
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3 — CONFIRMATION / RESERVE */}
            {step === 3 && submitted && (
              <div className="flex flex-col gap-[26px]">
                <div className="border p-[clamp(20px,2.4vw,34px)]" style={{ borderColor: "var(--accent-deep)", borderRadius: 6, background: "var(--card)" }}>
                  {/* Animated confirmation checkmark */}
                  <div
                    className="mb-[14px] flex h-[48px] w-[48px] items-center justify-center rounded-full"
                    style={{
                      background: "var(--accent-deep)",
                      animation: prefersReducedMotion() ? "none" : "demoIn 0.5s var(--e-out) both",
                    }}
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0c0c0d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <p className="mono mono-a mb-[8px]">System received</p>
                  <h2 className="d3 mb-[10px]">We'll take it from here.</h2>
                  <p className="body max-w-[52ch]">
                    Next: a short reply confirming scope{pkg === "Custom" ? ", then a call and a written proposal with timeline and investment." : " and scheduling for your package."}{" "}
                    You'll hear from us at {form.email}.
                  </p>
                </div>

                {selPkg?.deposit && (
                  <div className="border p-[clamp(20px,2.4vw,34px)]" style={{ borderColor: "var(--line)", borderRadius: 6 }}>
                    <div className="mb-[12px] flex flex-wrap items-baseline justify-between gap-[8px]">
                      <h3 className="d4">Reserve your slot — {selPkg.name}</h3>
                      <span className="mono mono-a">{selPkg.deposit || selPkg.price} deposit</span>
                    </div>
                    <p className="body-s mb-[16px] max-w-[56ch]">
                      Optional: reserve your production slot now. {activeProvider.configured ? "You'll be taken to secure checkout." : "No charge is made yet — the reservation is recorded and we'll send a secure payment link to confirm."}
                    </p>
                    {payStatus === "idle" && (
                      <button className="btn" onClick={reserve}>
                        Reserve slot <span className="arw">→</span>
                      </button>
                    )}
                    {payStatus === "pending" && (
                      <p className="mono" aria-live="polite">
                        Processing<span className="mono-a"> ●●●</span>
                      </p>
                    )}
                    {payStatus === "successful" && (
                      <p className="mono" style={{ color: "var(--accent-deep)" }} aria-live="polite">
                        ✓ Reserved — reference {payRef}. Check your email for confirmation.
                      </p>
                    )}
                    {(payStatus === "failed" || payStatus === "cancelled") && (
                      <div className="flex items-center gap-[14px]" aria-live="polite">
                        <p className="mono" style={{ color: "#d64530" }}>
                          {payStatus === "failed" ? "Payment failed." : "Payment cancelled."}
                        </p>
                        <button className="btn btn-ghost" onClick={reserve}>
                          Try again
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <p className="mono">
                  Prefer email? <a className="lnk mono-fg" href={`mailto:${c.email}`}>{c.email}</a>
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
