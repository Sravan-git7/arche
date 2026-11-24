import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "../lib/gsap";
import { announcePreviewDone, markPreviewPlayed } from "../lib/autoplay";

const SLUG = "ai-chatbots";

export interface ChatQuestion {
  id: "booking" | "crm" | "uncertain";
  question: string;
  reasoningStart: string;
  reasoningEnd: string;
  lines: string[];
  flow: string[];
  actionCard: {
    title: string;
    detail: string;
    badge: string;
  };
}

export const QUESTIONS: ChatQuestion[] = [
  {
    id: "booking",
    question: "How fast is a demo booked?",
    reasoningStart: "Checking calendar availability...",
    reasoningEnd: "Verifying slot · 140ms",
    lines: [
      "In this example, the agent checks live availability.",
      "It reserves the slot directly in your calendar",
      "and returns the confirmation in the same conversation.",
    ],
    flow: ["AGENT", "CALENDAR", "BOOKING READY"],
    actionCard: {
      title: "Thu 10:30 · Demo Slot Held",
      detail: "Google Calendar & Calendly synchronized",
      badge: "SLOT HELD",
    },
  },
  {
    id: "crm",
    question: "Can this connect to my CRM?",
    reasoningStart: "Mapping CRM handoff schema...",
    reasoningEnd: "Verifying HubSpot pipeline · 110ms",
    lines: [
      "It qualifies the request, gathers verified contact intent,",
      "and routes the enriched lead directly into HubSpot or Salesforce.",
      "No manual copy-paste between conversations and pipeline.",
    ],
    flow: ["AGENT", "QUALIFY", "CRM"],
    actionCard: {
      title: "CRM Synced · HubSpot",
      detail: "Lead enriched: Tier 1 · Owner assigned",
      badge: "SYNCED",
    },
  },
  {
    id: "uncertain",
    question: "What if it isn't sure?",
    reasoningStart: "Checking context boundaries...",
    reasoningEnd: "Escalation policy validated · 90ms",
    lines: [
      "It asks for clarification rather than hallucinating an answer.",
      "If the topic falls outside verified guidelines,",
      "it immediately routes the full context to your team.",
    ],
    flow: ["QUESTION", "CLARIFY", "HUMAN"],
    actionCard: {
      title: "Escalated to Human",
      detail: "Slack notification dispatched to team",
      badge: "ESCALATED",
    },
  },
];

type Phase = "sent" | "reasoning" | "reply" | "complete";

interface ActiveTurn {
  id: ChatQuestion["id"];
  phase: Phase;
  linesShown: number;
}

export function AgentDemo({
  active = false,
  isInView: _isInView,
  runKey = 0,
  preview = false,
}: {
  active?: boolean;
  isInView?: boolean;
  runKey?: number;
  preview?: boolean;
}) {
  const [currentTurn, setCurrentTurn] = useState<ActiveTurn | null>(null);
  const [usedQuestions, setUsedQuestions] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const timers = useRef<number[]>([]);
  const userInteractedRef = useRef(false);
  const questionIndexRef = useRef(0);

  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };

  useEffect(() => () => clearTimers(), []);

  // Programmatic question triggering with auto-cycle
  const ask = (qId: ChatQuestion["id"]) => {
    clearTimers();
    setBusy(true);
    setUsedQuestions((prev) => new Set(prev).add(qId));

    const item = QUESTIONS.find((q) => q.id === qId)!;
    setAnnouncement(`Question sent: ${item.question}`);

    if (prefersReducedMotion()) {
      setCurrentTurn({ id: qId, phase: "complete", linesShown: item.lines.length });
      setBusy(false);
      return;
    }

    // Step 1: User bubble glides in (x: 12px -> 0, 0.3s)
    setCurrentTurn({ id: qId, phase: "sent", linesShown: 0 });

    // Step 2: Reasoning trace expands for 0.8s
    timers.current.push(
      window.setTimeout(() => {
        setCurrentTurn((prev) => (prev ? { ...prev, phase: "reasoning" } : null));
      }, 300)
    );

    // Step 3: Agent bubble line-by-line reveal
    timers.current.push(
      window.setTimeout(() => {
        setCurrentTurn((prev) => (prev ? { ...prev, phase: "reply", linesShown: 1 } : null));
      }, 1100)
    );

    timers.current.push(
      window.setTimeout(() => {
        setCurrentTurn((prev) => (prev ? { ...prev, phase: "reply", linesShown: 2 } : null));
      }, 1350)
    );

    timers.current.push(
      window.setTimeout(() => {
        setCurrentTurn((prev) => (prev ? { ...prev, phase: "reply", linesShown: 3 } : null));
      }, 1600)
    );

    // Step 4: Action card snaps in underneath
    timers.current.push(
      window.setTimeout(() => {
        setCurrentTurn((prev) => (prev ? { ...prev, phase: "complete", linesShown: item.lines.length } : null));
        setBusy(false);
        setAnnouncement(`Action complete: ${item.actionCard.title}`);
        announcePreviewDone(SLUG);

        // Schedule next question in continuous loop if user hasn't manually taken over
        if (!userInteractedRef.current) {
          timers.current.push(
            window.setTimeout(() => {
              if (userInteractedRef.current) return;
              questionIndexRef.current = (questionIndexRef.current + 1) % QUESTIONS.length;
              const nextQ = QUESTIONS[questionIndexRef.current].id;
              ask(nextQ);
            }, 4200)
          );
        }
      }, 1900)
    );
  };

  // Viewport-gated reset & replay
  useEffect(() => {
    clearTimers();
    if (!active) {
      setCurrentTurn(null);
      setBusy(false);
      setUsedQuestions(new Set());
      return;
    }

    if (preview || userInteractedRef.current) return;
    markPreviewPlayed(SLUG);

    setCurrentTurn(null);
    setBusy(false);
    setUsedQuestions(new Set());

    const timer = window.setTimeout(() => {
      if (userInteractedRef.current) return;
      ask("booking");
    }, 280);

    timers.current.push(timer);
    return () => clearTimers();
  }, [active, runKey, preview]);

  const reset = () => {
    clearTimers();
    setBusy(false);
    setCurrentTurn(null);
    setUsedQuestions(new Set());
    setAnnouncement("Conversation reset. Choose a prompt chip to begin.");
  };

  const item = currentTurn ? QUESTIONS.find((q) => q.id === currentTurn.id) : null;

  return (
    <div
      className="agent-demo relative flex h-full w-full flex-col justify-between p-[12px] min-[900px]:p-[16px] select-none"
      aria-label="AI Chatbots Demo"
    >
      {/* ------------------------------------------------------------- */}
      {/* 1. Header Bar: Status Indicator & Reset                       */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-none items-center justify-between gap-[10px]">
        <div className="flex items-center gap-[7px]">
          <span
            className="h-[6px] w-[6px] rounded-full"
            style={{
              background: busy ? "#9EE41A" : "#8A8D89",
              boxShadow: busy ? "0 0 8px rgba(158,228,26,0.6)" : "none",
            }}
          />
          <span className="font-mono text-[10.5px] font-semibold uppercase tracking-wider text-[#141413]">
            ARCHE AGENT
          </span>
          <span className="font-mono text-[10px] text-[#5C5F59]">
            · {busy ? "PROCESSING" : currentTurn ? "ANSWERED" : "READY"}
          </span>
        </div>

        {currentTurn && (
          <button
            type="button"
            onClick={reset}
            className="font-mono text-[10px] uppercase tracking-wider text-[#5C5F59] hover:text-[#141413] px-[8px] py-[2px] rounded border border-[#141413]/10 bg-[#F1F2EA] transition-colors"
            data-cursor="RESET"
            aria-label="Reset conversation"
          >
            Reset
          </button>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. Light Warm-Stone Conversation Stage                        */}
      {/* ------------------------------------------------------------- */}
      <div
        data-slab="s2"
        className="agent-chat relative flex-1 my-[8px] flex flex-col justify-between overflow-hidden rounded-[10px] border border-[#141413]/10 bg-[#E5E7DC] p-[12px] min-[900px]:p-[14px]"
        style={{
          boxShadow: "0 2px 10px rgba(20,20,19,0.06)",
        }}
      >
        {/* Scrollable Conversation Viewport */}
        <div className="flex-1 overflow-y-auto space-y-[10px] pr-[2px]">
          {item && currentTurn ? (
            <div className="space-y-[10px]">
              {/* 1. User Message Bubble */}
              <div data-slab="s1" className="flex justify-end">
                <div
                  className="rounded-[12px_12px_3px_12px] border border-[#141413]/10 bg-[#141413] px-[12px] py-[7px] text-[12.5px] font-medium text-[#F4F4EE] shadow-sm transition-all duration-300"
                  style={{
                    transform: "translateX(0)",
                    opacity: 1,
                  }}
                >
                  {item.question}
                </div>
              </div>

              {/* 2. Compact Beveled Reasoning Trace Strip (Live Neon Pulse) */}
              {currentTurn.phase === "reasoning" && (
                <div className="flex items-center gap-[8px] rounded-[6px] border border-[#9EE41A] bg-[#F1F9E3] px-[10px] py-[6px] shadow-sm animate-pulse">
                  <div className="flex items-center gap-[4px]">
                    <span className="h-[4px] w-[4px] rounded-full bg-[#9EE41A]" />
                    <span className="h-[4px] w-[4px] rounded-full bg-[#9EE41A] opacity-60" />
                    <span className="h-[4px] w-[4px] rounded-full bg-[#9EE41A] opacity-30" />
                  </div>
                  <span className="font-mono text-[9.5px] text-[#141413] tracking-wide font-medium">
                    {item.reasoningStart}
                  </span>
                  <span className="ml-auto font-mono text-[9px] text-[#9EE41A] font-semibold bg-[#141413] px-[6px] py-[1px] rounded">
                    {item.reasoningEnd}
                  </span>
                </div>
              )}

              {/* 3. White Beveled Agent Response Bubble */}
              {(currentTurn.phase === "reply" || currentTurn.phase === "complete") && (
                <div className="agent-reply flex flex-col items-start gap-[8px]">
                  <div
                    data-slab="engine"
                    className="inline-flex max-w-[94%] flex-col gap-[3px] rounded-[12px_12px_12px_3px] bg-[#F1F2EA] border border-[#141413]/10 p-[12px] text-[#141413] shadow-sm"
                    style={{
                      boxShadow: "0 2px 10px rgba(20,20,19,0.06)",
                    }}
                  >
                    {item.lines.slice(0, currentTurn.linesShown).map((line, idx) => (
                      <span
                        key={idx}
                        className="agent-reply-line text-[12px] leading-[1.45] tracking-tight block text-[#141413]"
                      >
                        {line}
                      </span>
                    ))}
                  </div>

                  {/* 4. Structured White Beveled Action Card with Lime Confirmation Dot */}
                  {currentTurn.phase === "complete" && (
                    <div
                      data-slab="s3"
                      className="w-full max-w-[94%] rounded-[8px] border border-[#9EE41A]/50 bg-[#F1F2EA] p-[10px] shadow-[0_2px_8px_rgba(20,20,19,0.06)] flex items-center justify-between gap-[10px] transition-all"
                    >
                      <div className="flex items-center gap-[8px]">
                        <span className="h-[7px] w-[7px] rounded-full bg-[#9EE41A] shadow-[0_0_6px_#9EE41A] flex-none" />
                        <div>
                          <strong className="text-[12px] font-semibold text-[#141413] block">
                            {item.actionCard.title}
                          </strong>
                          <span className="font-mono text-[9.5px] text-[#5C5F59] block">
                            {item.actionCard.detail}
                          </span>
                        </div>
                      </div>
                      <span className="rounded bg-[#141413] px-[8px] py-[2px] font-mono text-[9px] font-semibold text-[#9EE41A]">
                        {item.actionCard.badge}
                      </span>
                    </div>
                  )}

                  {/* Flow Telemetry Strip (.agent-flow) */}
                  <div
                    className="agent-flow flex items-center gap-[5px] rounded-full border border-[#141413]/10 bg-[#F1F2EA] px-[9px] py-[3px] shadow-sm"
                    aria-label={item.flow.join(" to ")}
                  >
                    {item.flow.map((step, idx) => (
                      <span key={step} className="flex items-center gap-[4px] font-mono text-[8.5px]">
                        <span
                          className="h-[4px] w-[4px] rounded-full"
                          style={{ background: idx === item.flow.length - 1 ? "#9EE41A" : "#8A8D89" }}
                        />
                        <span
                          style={{
                            color: idx === item.flow.length - 1 ? "#141413" : "#5C5F59",
                            fontWeight: idx === item.flow.length - 1 ? 700 : 400,
                          }}
                        >
                          {step}
                        </span>
                        {idx < item.flow.length - 1 && <span className="text-[#5C5F59]">→</span>}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Empty State Prompt Guidance */
            <div className="flex h-full flex-col items-center justify-center text-center p-[16px]">
              <span className="h-[8px] w-[8px] rounded-full bg-[#9EE41A] mb-[8px] shadow-[0_0_8px_#9EE41A]" />
              <p className="font-medium text-[13px] text-[#141413] mb-[2px]">
                Ask Arche Agent
              </p>
              <p className="font-mono text-[10.5px] text-[#5C5F59] max-w-[32ch]">
                Select a suggested prompt chip below to see reasoning and automated business action.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. Recessed White Prompt-Chip Tray at Bottom                 */}
      {/* ------------------------------------------------------------- */}
      <div
        className="flex flex-none flex-wrap items-center gap-[6px] rounded-[8px] border border-[#141413]/10 bg-[#F1F2EA] p-[6px] shadow-sm"
        aria-label="Suggested questions"
      >
        {QUESTIONS.map((q, idx) => {
          const isAsked = usedQuestions.has(q.id);
          return (
            <button
              key={q.id}
              type="button"
              data-slab={idx === 0 ? "s4" : idx === 1 ? "s5" : "s6"}
              onClick={() => {
                userInteractedRef.current = true;
                ask(q.id);
              }}
              disabled={busy}
              className="rounded-full px-[10px] py-[5px] font-mono text-[9.5px] font-medium border transition-all disabled:opacity-50 cursor-pointer"
              style={{
                background: isAsked ? "#141413" : "#EAE7DF",
                borderColor: isAsked ? "#141413" : "rgba(20,20,19,0.1)",
                color: isAsked ? "#9EE41A" : "#141413",
              }}
            >
              {q.question}
            </button>
          );
        })}
      </div>

      <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {announcement}
      </span>
    </div>
  );
}
