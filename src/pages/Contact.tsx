import React, { useEffect, useRef, useState } from "react";
import { usePage } from "../lib/router";
import { useReveal } from "../lib/reveal";
import { SlotButton } from "../components/SlotButton";
import { submitInquiry, type InquiryPayload } from "../lib/inquiries";

type BuildOption =
  | "Video Editing"
  | "Web Development"
  | "AI Chatbots"
  | "AI Automation"
  | "Full Connected System";

interface BuildCardOption {
  id: BuildOption;
  title: string;
  desc: string;
}

const BUILD_OPTIONS: BuildCardOption[] = [
  {
    id: "Video Editing",
    title: "Video Editing",
    desc: "Cinematic reels, long-form cuts & colour grading",
  },
  {
    id: "Web Development",
    title: "Web Development",
    desc: "Fast, custom-built flagship websites",
  },
  {
    id: "AI Chatbots",
    title: "AI Chatbots",
    desc: "24/7 lead qualification & calendar booking",
  },
  {
    id: "AI Automation",
    title: "AI Automation",
    desc: "CRM, Sheets, Slack & email workflows",
  },
  {
    id: "Full Connected System",
    title: "Full Connected System",
    desc: "Multiple verticals engineered as one unified engine",
  },
];

interface TimelineOption {
  id: string;
  title: string;
  hint: string;
}

const TIMELINE_OPTIONS: TimelineOption[] = [
  {
    id: "Weeks — Urgent",
    title: "Weeks — Urgent",
    hint: "Hard production deadline. Work backwards from it.",
  },
  {
    id: "1–3 Months",
    title: "1–3 Months",
    hint: "Standard production cycle. Room to engineer properly.",
  },
  {
    id: "3+ Months",
    title: "3+ Months",
    hint: "Larger architectural scope, or phased roadmap.",
  },
  {
    id: "Just Exploring",
    title: "Just Exploring",
    hint: "No firm date yet — mapping capabilities & transparent INR rates.",
  },
];

const QUICK_PROMPTS = [
  "Launch a high-converting website",
  "Automate lead capture & CRM",
  "Consistent short-form video pipeline",
];

export function ContactPage() {
  usePage("Start a Project — Arché Creative Studios");
  useReveal();

  const [step, setStep] = useState(0);
  const [build, setBuild] = useState<BuildOption | null>(null);
  const [change, setChange] = useState("");
  const [timeline, setTimeline] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [phase, setPhase] = useState<"form" | "sending" | "received">("form");
  const [touched, setTouched] = useState({ name: false, email: false });

  const advanceTimer = useRef<number | null>(null);

  // Read prefilled service selection from session if redirected from service pages
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("arche:prefill");
      if (stored) {
        const parsed = JSON.parse(stored);
        const map: Record<string, BuildOption> = {
          "video-editing": "Video Editing",
          "video-production": "Video Editing",
          "web-development": "Web Development",
          "ai-chatbots": "AI Chatbots",
          "ai-automation": "AI Automation",
          "ai-solutions-automation": "AI Automation",
          full: "Full Connected System",
        };
        if (parsed.service && map[parsed.service]) {
          setBuild(map[parsed.service]);
        } else if (parsed.build && map[parsed.build.toLowerCase()]) {
          setBuild(map[parsed.build.toLowerCase()]);
        }
        if (parsed.pkg || parsed.package) {
          setChange(`Interested in ${parsed.pkg || parsed.package}.`);
        }
        sessionStorage.removeItem("arche:prefill");
      }
    } catch {
      /* ignore */
    }

    return () => {
      if (advanceTimer.current !== null) {
        window.clearTimeout(advanceTimer.current);
      }
    };
  }, []);

  const chooseBuild = (o: BuildOption) => {
    setBuild(o);
    if (advanceTimer.current !== null) window.clearTimeout(advanceTimer.current);
    advanceTimer.current = window.setTimeout(() => {
      advanceTimer.current = null;
      setStep(1);
    }, 280);
  };

  const chooseTimeline = (t: string) => {
    setTimeline(t);
    if (advanceTimer.current !== null) window.clearTimeout(advanceTimer.current);
    advanceTimer.current = window.setTimeout(() => {
      advanceTimer.current = null;
      setStep(3);
    }, 280);
  };

  const handleQuickPrompt = (prompt: string) => {
    setChange((prev) => (prev.trim() ? `${prev.trim()} · ${prompt}` : prompt));
  };

  const canSubmit = name.trim().length > 1 && /\S+@\S+\.\S+/.test(email);

  const payload = (): InquiryPayload => ({
    name: name.trim(),
    email: email.trim(),
    phone: phone.trim() || undefined,
    company: company.trim() || undefined,
    building: build ?? "Full Connected System",
    whatNeedsToChange: change.trim() || "—",
    timeline: timeline ?? "1–3 Months",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || phase === "sending") return;

    setPhase("sending");
    try {
      await submitInquiry(payload());
    } catch {
      /* Graceful fallback for local demo environments */
    }
    setPhase("received");
  };

  // WhatsApp pre-filled direct handoff message
  const waSummary = encodeURIComponent(
    `Hi Arché, I just submitted a project brief on arche.studio:\n\n• Capability: ${
      build || "Full Connected System"
    }\n• Scope / Goal: ${change.trim() || "General Inquiry"}\n• Timeline: ${
      timeline || "1–3 Months"
    }\n• Lead: ${name.trim()} (${email.trim()})${
      phone.trim() ? ` · WhatsApp: ${phone.trim()}` : ""
    }${company.trim() ? ` · Company: ${company.trim()}` : ""}`
  );
  const waUrl = `https://wa.me/917995937536?text=${waSummary}`;

  const resetForm = () => {
    setStep(0);
    setBuild(null);
    setChange("");
    setTimeline(null);
    setName("");
    setEmail("");
    setPhone("");
    setCompany("");
    setPhase("form");
  };

  return (
    <section className="relative z-10 w-full pt-32 pb-24 px-6 md:px-8">
      <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
        {/* =========================================================
            LEFT COLUMN: Display Headline, Context & Live Brief Card
           ========================================================= */}
        <div className="lg:col-span-5 lg:sticky lg:top-28 space-y-6">
          {/* Eyebrow Pill */}
          <div className="glass-eyebrow-pill inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.06] border border-white/15 backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-[#9EE41A] shadow-[0_0_8px_#9EE41A]" />
            <span className="font-mono text-[11px] font-semibold tracking-[0.14em] uppercase text-[#F4F1E0]">
              START A PROJECT · 60-SECOND BRIEF
            </span>
          </div>

          {/* Two-Tone Metallic Display Headline */}
          <h1 className="text-[clamp(2.5rem,4.6vw,3.85rem)] font-bold tracking-tight leading-[1.02]">
            <span className="shiny-ink-text block">Let&apos;s architect</span>
            <span className="text-[#9EE41A] drop-shadow-[0_0_24px_rgba(158,228,26,0.30)] block">
              your next system.
            </span>
          </h1>

          {/* Context Subtitle */}
          <p className="text-[15px] sm:text-[16px] leading-relaxed text-[#C9CEC3] max-w-[44ch]">
            Four quick steps — more conversation than form. Direct response from the founders
            within 1 working day.
          </p>

          {/* Live Brief Summary Card (Smoked Dark Glass) */}
          <div className="rounded-2xl bg-white/[0.04] backdrop-blur-md border border-white/[0.12] p-5 space-y-3.5 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <span className="font-mono text-[10.5px] font-semibold tracking-wider uppercase text-[#9EE41A]">
                • LIVE BRIEF ARCHITECTURE
              </span>
              <span className="font-mono text-[10px] text-[#A3AA9D]">
                {phase === "received" ? "COMPLETED" : `STEP 0${step + 1} / 04`}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              {/* 01 Building */}
              <div className="flex items-center justify-between py-1 border-b border-white/[0.06]">
                <span className="font-mono text-[11px] text-[#A3AA9D]">01 Building:</span>
                {build ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (phase === "form") setStep(0);
                    }}
                    className="font-mono text-[11px] font-semibold text-[#F4F1E0] hover:text-[#9EE41A] transition-colors underline cursor-pointer"
                  >
                    {build} ✎
                  </button>
                ) : (
                  <span className="font-mono text-[11px] text-[#636A5E] italic">Pending</span>
                )}
              </div>

              {/* 02 Goal */}
              <div className="flex items-center justify-between py-1 border-b border-white/[0.06]">
                <span className="font-mono text-[11px] text-[#A3AA9D]">02 Goal:</span>
                {change.trim() ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (phase === "form") setStep(1);
                    }}
                    className="font-mono text-[11px] font-semibold text-[#F4F1E0] hover:text-[#9EE41A] transition-colors underline truncate max-w-[200px] cursor-pointer"
                  >
                    {change.slice(0, 24)}... ✎
                  </button>
                ) : (
                  <span className="font-mono text-[11px] text-[#636A5E] italic">Pending</span>
                )}
              </div>

              {/* 03 Timeline */}
              <div className="flex items-center justify-between py-1 border-b border-white/[0.06]">
                <span className="font-mono text-[11px] text-[#A3AA9D]">03 Timeline:</span>
                {timeline ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (phase === "form") setStep(2);
                    }}
                    className="font-mono text-[11px] font-semibold text-[#F4F1E0] hover:text-[#9EE41A] transition-colors underline cursor-pointer"
                  >
                    {timeline} ✎
                  </button>
                ) : (
                  <span className="font-mono text-[11px] text-[#636A5E] italic">Pending</span>
                )}
              </div>

              {/* 04 Contact */}
              <div className="flex items-center justify-between py-1">
                <span className="font-mono text-[11px] text-[#A3AA9D]">04 Contact:</span>
                {name.trim() ? (
                  <span className="font-mono text-[11px] font-semibold text-[#F4F1E0] truncate max-w-[180px]">
                    {name} ({email || "…"})
                  </span>
                ) : (
                  <span className="font-mono text-[11px] text-[#636A5E] italic">Pending</span>
                )}
              </div>
            </div>
          </div>

          {/* Direct Studio Channels */}
          <div className="pt-2 space-y-3">
            <span className="font-mono text-[10.5px] font-semibold tracking-wider uppercase text-[#9CA496] block">
              DIRECT FOUNDER CHANNELS
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <a
                href="https://wa.me/917995937536"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 hover:border-[#9EE41A]/50 hover:bg-white/[0.08] transition-all text-[#F4F1E0] text-xs font-mono"
              >
                <span className="h-2 w-2 rounded-full bg-[#25D366] shadow-[0_0_6px_#25D366]" />
                <span>+91 79959 37536</span>
              </a>
              <a
                href="mailto:archecreativestudios@gmail.com"
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 hover:border-[#9EE41A]/50 hover:bg-white/[0.08] transition-all text-[#F4F1E0] text-xs font-mono truncate"
              >
                <span>✉ Email Founders</span>
              </a>
            </div>
            <p className="font-mono text-[10px] text-[#868E80] tracking-wide">
              100% confidential · Clear INR proposals · No aggressive sales pressure
            </p>
          </div>
        </div>

        {/* =========================================================
            RIGHT COLUMN: Flagship #F4F1E0 Cream-Ivory Intake Card
           ========================================================= */}
        <div className="lg:col-span-7">
          <div
            className="relative rounded-[28px] p-6 sm:p-8 md:p-10 border border-white/60 transition-all duration-300"
            style={{
              background: "rgba(244, 241, 224, 0.94)",
              backdropFilter: "blur(24px)",
              boxShadow: "inset 0 1.5px 0 #FFFFFF, 0 28px 64px -18px rgba(0, 0, 0, 0.55)",
            }}
          >
            {/* ----------------- Top Stepper Header ----------------- */}
            {(phase === "form" || phase === "sending") && (
              <div className="border-b border-[#141413]/10 pb-5 mb-6">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[12.5px] font-bold uppercase tracking-wider text-[#2E322B]">
                    STEP 0{step + 1} OF 04
                  </span>
                  {step > 0 && (
                    <button
                      type="button"
                      disabled={phase === "sending"}
                      onClick={() => setStep((s) => s - 1)}
                      className="font-mono text-xs font-bold text-[#2E322B] hover:text-[#0B0C0A] transition-colors cursor-pointer disabled:opacity-40"
                    >
                      ← Back
                    </button>
                  )}
                </div>

                {/* Animated Razor-Thin Progress Bar */}
                <div className="h-1 w-full bg-[#141413]/10 rounded-full overflow-hidden mt-3">
                  <div
                    className="h-full bg-[#84CC16] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] rounded-full"
                    style={{ width: `${((step + 1) / 4) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* ----------------- Form Steps Container ----------------- */}
            {(phase === "form" || phase === "sending") && (
              <div className="transition-all duration-260 ease-out">
                {/* STEP 01 — What are you building? */}
                {step === 0 && (
                  <div className="space-y-5">
                    <div>
                      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0B0C0A]">
                        What are you building?
                      </h2>
                      <p className="text-[15px] font-medium text-[#1C1E1A] mt-1">
                        Select the primary capability your system needs:
                      </p>
                    </div>

                    {/* 2x2 Grid + 1 Full-Width Card */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                      {BUILD_OPTIONS.slice(0, 4).map((opt) => {
                        const isSelected = build === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => chooseBuild(opt.id)}
                            className={`group relative rounded-2xl p-4 sm:p-5 text-left transition-all duration-200 cursor-pointer ${
                              isSelected
                                ? "bg-[#0B0C0A] text-[#F4F1E0] shadow-lg border border-[#0B0C0A]"
                                : "bg-white/80 hover:bg-white text-[#0B0C0A] border border-[#141413]/12 hover:border-[#141413]/40 hover:-translate-y-0.5"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="font-mono text-xs font-bold uppercase tracking-wider">
                                {opt.title}
                              </span>
                              {isSelected ? (
                                <span className="h-5 w-5 rounded-full bg-[#9EE41A] text-[#11120F] flex items-center justify-center text-xs font-bold">
                                  ✓
                                </span>
                              ) : (
                                <span className="font-mono text-xs text-[#2E322B] group-hover:text-[#0B0C0A] group-hover:translate-x-0.5 transition-transform">
                                  →
                                </span>
                              )}
                            </div>
                            <p
                              className={`text-[13.5px] font-medium leading-relaxed ${
                                isSelected ? "text-[#CBD1C5]" : "text-[#1C1E1A]"
                              }`}
                            >
                              {opt.desc}
                            </p>
                          </button>
                        );
                      })}
                    </div>

                    {/* Full-width 5th option: Full Connected System */}
                    {(() => {
                      const opt = BUILD_OPTIONS[4];
                      const isSelected = build === opt.id;
                      return (
                        <button
                          type="button"
                          onClick={() => chooseBuild(opt.id)}
                          className={`w-full group relative rounded-2xl p-4 sm:p-5 text-left transition-all duration-200 cursor-pointer ${
                            isSelected
                              ? "bg-[#0B0C0A] text-[#F4F1E0] shadow-lg border border-[#0B0C0A]"
                              : "bg-white/80 hover:bg-white text-[#0B0C0A] border border-[#141413]/12 hover:border-[#141413]/40 hover:-translate-y-0.5"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#84CC16]">
                              • {opt.title}
                            </span>
                            {isSelected ? (
                              <span className="h-5 w-5 rounded-full bg-[#9EE41A] text-[#11120F] flex items-center justify-center text-xs font-bold">
                                ✓
                              </span>
                            ) : (
                              <span className="font-mono text-xs text-[#2E322B] group-hover:text-[#0B0C0A] group-hover:translate-x-0.5 transition-transform">
                                →
                              </span>
                            )}
                          </div>
                          <p
                            className={`text-[13.5px] font-medium leading-relaxed ${
                              isSelected ? "text-[#CBD1C5]" : "text-[#1C1E1A]"
                            }`}
                          >
                            {opt.desc}
                          </p>
                        </button>
                      );
                    })()}

                    {build && (
                      <div className="pt-2 flex justify-end">
                        <SlotButton
                          onClick={() => setStep(1)}
                          variant="hero-primary"
                          arrow="right"
                          className="!bg-[#141413] !text-[#F4F1E0] !border-[#141413] hover:!bg-[#222520] hover:!border-[#222520] hover:!shadow-[0_0_24px_rgba(20,20,19,0.35)] !h-[42px] !px-6 !text-[11.5px] !font-bold"
                        >
                          Continue to Goal
                        </SlotButton>
                      </div>
                    )}
                  </div>
                )}

                {/* STEP 02 — What needs to change? */}
                {step === 1 && (
                  <div className="space-y-5">
                    <div>
                      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0B0C0A]">
                        What needs to change?
                      </h2>
                      <p className="text-[15px] font-medium text-[#1C1E1A] mt-1">
                        What&apos;s slow, broken, or missing? What should be true a few months from now?
                      </p>
                    </div>

                    {/* Recessed Warm Stone Textarea */}
                    <div className="space-y-3">
                      <textarea
                        value={change}
                        onChange={(e) => setChange(e.target.value)}
                        placeholder="E.g. We are losing leads after hours, our current site doesn't represent our brand tier, and video turnaround takes 3 weeks..."
                        rows={4}
                        className="w-full rounded-2xl bg-[#E8E5D3]/75 border border-[#141413]/14 focus:border-[#141413] focus:bg-[#E8E5D3] p-4 text-[#0B0C0A] placeholder:text-[#2E322B]/75 text-[15px] leading-relaxed outline-none transition-all shadow-inner resize-y min-h-[130px]"
                      />

                      {/* Quick-Prompt Chips */}
                      <div className="space-y-1.5">
                        <span className="font-mono text-[11px] uppercase tracking-wider text-[#2E322B] font-bold block">
                          QUICK PROMPTS (CLICK TO ADD):
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {QUICK_PROMPTS.map((prompt) => (
                            <button
                              key={prompt}
                              type="button"
                              onClick={() => handleQuickPrompt(prompt)}
                              className="font-mono text-[11px] font-semibold px-3 py-1.5 rounded-full bg-white/80 hover:bg-[#0B0C0A] hover:text-[#F4F1E0] text-[#0B0C0A] border border-[#141413]/12 transition-all cursor-pointer shadow-sm active:scale-95"
                            >
                              + {prompt}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Step 2 Actions */}
                    <div className="pt-3 flex items-center justify-between">
                      <span className="text-xs text-[#2E322B] italic font-medium">
                        {change.trim().length > 0 ? "Looking good." : "A sentence or two is plenty."}
                      </span>
                      <SlotButton
                        onClick={() => setStep(2)}
                        variant="hero-primary"
                        arrow="right"
                        className="!bg-[#141413] !text-[#F4F1E0] !border-[#141413] hover:!bg-[#222520] hover:!border-[#222520] hover:!shadow-[0_0_24px_rgba(20,20,19,0.35)] !h-[42px] !px-6 !text-[11.5px] !font-bold"
                      >
                        Continue to Timeline
                      </SlotButton>
                    </div>
                  </div>
                )}

                {/* STEP 03 — Timeline & Scale */}
                {step === 2 && (
                  <div className="space-y-5">
                    <div>
                      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0B0C0A]">
                        What&apos;s your timeline?
                      </h2>
                      <p className="text-[15px] font-medium text-[#1C1E1A] mt-1">
                        How quickly does this system need to be live in production?
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                      {TIMELINE_OPTIONS.map((opt) => {
                        const isSelected = timeline === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => chooseTimeline(opt.id)}
                            className={`group relative rounded-2xl p-4 sm:p-5 text-left transition-all duration-200 cursor-pointer ${
                              isSelected
                                ? "bg-[#0B0C0A] text-[#F4F1E0] shadow-lg border border-[#0B0C0A]"
                                : "bg-white/80 hover:bg-white text-[#0B0C0A] border border-[#141413]/12 hover:border-[#141413]/40 hover:-translate-y-0.5"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="font-mono text-xs font-bold uppercase tracking-wider">
                                {opt.title}
                              </span>
                              {isSelected ? (
                                <span className="h-5 w-5 rounded-full bg-[#9EE41A] text-[#11120F] flex items-center justify-center text-xs font-bold">
                                  ✓
                                </span>
                              ) : (
                                <span className="font-mono text-xs text-[#2E322B] group-hover:text-[#0B0C0A] group-hover:translate-x-0.5 transition-transform">
                                  →
                                </span>
                              )}
                            </div>
                            <p
                              className={`text-[13.5px] font-medium leading-relaxed ${
                                isSelected ? "text-[#CBD1C5]" : "text-[#1C1E1A]"
                              }`}
                            >
                              {opt.hint}
                            </p>
                          </button>
                        );
                      })}
                    </div>

                    {timeline && (
                      <div className="pt-2 flex justify-end">
                        <SlotButton
                          onClick={() => setStep(3)}
                          variant="hero-primary"
                          arrow="right"
                          className="!bg-[#141413] !text-[#F4F1E0] !border-[#141413] hover:!bg-[#222520] hover:!border-[#222520] hover:!shadow-[0_0_24px_rgba(20,20,19,0.35)] !h-[42px] !px-6 !text-[11.5px] !font-bold"
                        >
                          Continue to Contact
                        </SlotButton>
                      </div>
                    )}
                  </div>
                )}

                {/* STEP 04 — Where do we reply? */}
                {step === 3 && (
                  <form onSubmit={handleSubmit} noValidate className="space-y-5">
                    <div>
                      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0B0C0A]">
                        Where do we reply?
                      </h2>
                      <p className="text-[15px] font-medium text-[#1C1E1A] mt-1">
                        Direct response from the founders with an initial architecture and transparent INR proposal.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                      {/* Name input */}
                      <label className="flex flex-col gap-1.5 text-left">
                        <span className="font-mono text-[11.5px] font-bold uppercase tracking-wider text-[#0B0C0A]">
                          Name <span className="text-[#9EE41A]">*</span>
                        </span>
                        <input
                          type="text"
                          required
                          autoComplete="name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                          placeholder="Rohit Sharma"
                          className="rounded-xl bg-[#E8E5D3]/75 border border-[#141413]/14 focus:border-[#141413] focus:bg-[#E8E5D3] px-4 py-3 text-[#0B0C0A] placeholder:text-[#2E322B]/75 text-[14.5px] font-medium outline-none transition-all shadow-inner"
                        />
                        {touched.name && name.trim().length <= 1 && (
                          <span className="text-[11px] font-mono text-red-600">
                            Please provide your name.
                          </span>
                        )}
                      </label>

                      {/* Email input */}
                      <label className="flex flex-col gap-1.5 text-left">
                        <span className="font-mono text-[11.5px] font-bold uppercase tracking-wider text-[#0B0C0A]">
                          Work Email <span className="text-[#9EE41A]">*</span>
                        </span>
                        <input
                          type="email"
                          required
                          autoComplete="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                          placeholder="rohit@company.com"
                          className="rounded-xl bg-[#E8E5D3]/75 border border-[#141413]/14 focus:border-[#141413] focus:bg-[#E8E5D3] px-4 py-3 text-[#0B0C0A] placeholder:text-[#2E322B]/75 text-[14.5px] font-medium outline-none transition-all shadow-inner"
                        />
                        {touched.email && !/\S+@\S+\.\S+/.test(email) && (
                          <span className="text-[11px] font-mono text-red-600">
                            Please provide a valid email.
                          </span>
                        )}
                      </label>

                      {/* WhatsApp / Phone */}
                      <label className="flex flex-col gap-1.5 text-left">
                        <span className="font-mono text-[11.5px] font-bold uppercase tracking-wider text-[#0B0C0A]">
                          WhatsApp / Phone
                        </span>
                        <input
                          type="tel"
                          autoComplete="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+91 98765 43210"
                          className="rounded-xl bg-[#E8E5D3]/75 border border-[#141413]/14 focus:border-[#141413] focus:bg-[#E8E5D3] px-4 py-3 text-[#0B0C0A] placeholder:text-[#2E322B]/75 text-[14.5px] font-medium outline-none transition-all shadow-inner"
                        />
                      </label>

                      {/* Company */}
                      <label className="flex flex-col gap-1.5 text-left">
                        <span className="font-mono text-[11.5px] font-bold uppercase tracking-wider text-[#0B0C0A]">
                          Company (Optional)
                        </span>
                        <input
                          type="text"
                          autoComplete="organization"
                          value={company}
                          onChange={(e) => setCompany(e.target.value)}
                          placeholder="Your brand or studio"
                          className="rounded-xl bg-[#E8E5D3]/75 border border-[#141413]/14 focus:border-[#141413] focus:bg-[#E8E5D3] px-4 py-3 text-[#0B0C0A] placeholder:text-[#2E322B]/75 text-[14.5px] font-medium outline-none transition-all shadow-inner"
                        />
                      </label>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-2">
                      <SlotButton
                        type="submit"
                        variant="hero-primary"
                        arrow="right"
                        className="w-full !bg-[#141413] !text-[#F4F1E0] !border-[#141413] hover:!bg-[#222520] hover:!border-[#222520] hover:!shadow-[0_0_28px_rgba(20,20,19,0.45)] !h-[48px] !text-[13px] !font-bold disabled:opacity-50 disabled:pointer-events-none"
                      >
                        {phase === "sending" ? "Dispatching Brief..." : "Send Project Brief"}
                      </SlotButton>
                    </div>

                    <p className="font-mono text-[11px] text-center text-[#2E322B] font-semibold tracking-wide">
                      No automated newsletters or drip sequences. A human architect replies.
                    </p>
                  </form>
                )}
              </div>
            )}

            {/* ----------------- Confirmation State ----------------- */}
            {phase === "received" && (
              <div className="text-center py-6 sm:py-8 space-y-6">
                {/* Glowing Checkmark Badge */}
                <div className="h-16 w-16 mx-auto rounded-full bg-[#141413] border-2 border-[#9EE41A] shadow-[0_0_28px_rgba(158,228,26,0.40)] flex items-center justify-center text-[#9EE41A] text-2xl font-bold">
                  ✓
                </div>

                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0B0C0A]">
                    Brief received.
                  </h2>
                  <p className="text-[15.5px] text-[#1C1E1A] font-medium mt-2 max-w-[48ch] mx-auto leading-relaxed">
                    Thanks {name.split(" ")[0] || "there"}. We will review your architecture and reply
                    to <strong className="text-[#0B0C0A] font-bold">{email}</strong> within 1 working day with next
                    steps and honest scoping.
                  </p>
                </div>

                {/* Brief Summary Box */}
                <div className="max-w-[460px] mx-auto rounded-2xl bg-[#E8E5D3]/75 border border-[#141413]/10 p-5 text-left text-xs text-[#0B0C0A] space-y-2 shadow-inner">
                  <p className="font-mono text-[11px] uppercase font-bold text-[#2E322B] tracking-wider mb-2">
                    CONFIRMED SPECIFICATION
                  </p>
                  <p>
                    <span className="font-mono text-[#5C5F59]">Capability:</span>{" "}
                    <strong>{build || "Full Connected System"}</strong>
                  </p>
                  <p>
                    <span className="font-mono text-[#5C5F59]">Goal / Need:</span>{" "}
                    <span>{change.trim() || "System architecture & development"}</span>
                  </p>
                  <p>
                    <span className="font-mono text-[#5C5F59]">Timeline:</span>{" "}
                    <strong>{timeline || "1–3 Months"}</strong>
                  </p>
                  <p>
                    <span className="font-mono text-[#5C5F59]">Contact:</span>{" "}
                    <span>
                      {name} ({email})
                    </span>
                  </p>
                </div>

                {/* Direct WhatsApp Follow-up Button */}
                <div className="max-w-[460px] mx-auto space-y-3 pt-2">
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2.5 rounded-full py-3.5 px-6 bg-[#25D366] text-[#11120F] font-bold font-mono text-xs uppercase tracking-wider shadow-[0_0_24px_rgba(37,211,102,0.40)] hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <span>Send via WhatsApp too →</span>
                  </a>

                  <div>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="font-mono text-[11px] text-[#5C5F59] hover:text-[#141413] underline transition-colors cursor-pointer"
                    >
                      Start a new project brief
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
