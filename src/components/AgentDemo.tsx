import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "../lib/gsap";
import { announcePreviewDone, markPreviewPlayed } from "../lib/autoplay";

/**
 * A deliberately scoped agent demo: three questions, no free-text input.
 * The full Ask Arche section owns open-ended conversation. Here the visitor
 * sees a question become a considered answer and a small business action.
 *
 * PROMPT 24 — autoplay-first: ~1.5s after the stage first comes on screen it
 * sends ONE of the suggested questions by itself, so the whole reply and the
 * trigger sequence play out unprompted. The other two chips stay visitor-
 * triggered, and any question asked by the visitor cancels the auto-send.
 */

const SLUG = "ai-chatbots";
/** PROMPT 28: Pause exactly 1 second (1000ms) after entering view before auto-sending the first question. */
const AUTO_ASK_MS = 1000;
const QUESTIONS = [
  {
    id: "booking",
    question: "How fast is a demo booked?",
    status: "Checking availability",
    lines: [
      "In this example, the agent checks an open time.",
      "It can prepare the booking and return",
      "the confirmation in the same conversation.",
    ],
    flow: ["AGENT", "CALENDAR", "BOOKING READY"],
  },
  {
    id: "crm",
    question: "Can this connect to my CRM?",
    status: "Mapping the handoff",
    lines: [
      "It can qualify the request, collect the details",
      "that matter, then pass them to your CRM.",
      "We scope the connection around your tools.",
    ],
    flow: ["AGENT", "QUALIFY", "CRM"],
  },
  {
    id: "uncertain",
    question: "What if it isn't sure?",
    status: "Checking context",
    lines: [
      "It asks for clarification rather than guessing.",
      "If it still cannot resolve the request,",
      "it passes the context to a person.",
    ],
    flow: ["QUESTION", "CLARIFY", "HUMAN"],
  },
] as const;

type Phase = "sent" | "thinking" | "reply" | "complete";
type Turn = { id: (typeof QUESTIONS)[number]["id"]; phase: Phase; linesShown: number };

const QUESTION_ENTER = 220;
const HOLD = 500;
const THINK = 600;
const LINE_GAP = 145;

export function AgentDemo({
  active = true,
  preview = false,
  auto = false,
}: {
  active?: boolean;
  preview?: boolean;
  auto?: boolean;
}) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [used, setUsed] = useState<Set<Turn["id"]>>(() => new Set());
  const [busy, setBusy] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const timers = useRef<Set<number>>(new Set());
  const busyRef = useRef(false);
  const scroll = useRef<HTMLDivElement>(null);
  const autoTimer = useRef(0);
  const autoStarted = useRef(false);
  const autoTurn = useRef<Turn["id"] | null>(null);

  const clearTimers = () => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current.clear();
  };

  useEffect(() => () => clearTimers(), []);

  useEffect(() => {
    if (turns.length) scroll.current?.scrollTo({ top: scroll.current.scrollHeight, behavior: "smooth" });
  }, [turns]);

  const after = (ms: number, cb: () => void) => {
    const id = window.setTimeout(() => {
      timers.current.delete(id);
      cb();
    }, ms);
    timers.current.add(id);
  };

  const update = (id: Turn["id"], changes: Partial<Turn>) => {
    setTurns((current) => current.map((t) => (t.id === id ? { ...t, ...changes } : t)));
  };

  const ask = (id: Turn["id"]) => {
    if (preview || busyRef.current || used.has(id)) return;
    // the visitor asked something: the demo's own auto-send stands down
    if (autoTimer.current) {
      window.clearTimeout(autoTimer.current);
      autoTimer.current = 0;
    }
    const question = QUESTIONS.find((q) => q.id === id)!;

    busyRef.current = true;
    setBusy(true);
    setUsed((current) => new Set(current).add(id));
    setTurns((current) => [...current, { id, phase: "sent", linesShown: 0 } satisfies Turn]);
    setAnnouncement("Question sent. The agent is considering it.");

    if (prefersReducedMotion()) {
      update(id, { phase: "complete", linesShown: question.lines.length });
      busyRef.current = false;
      setBusy(false);
      setAnnouncement(`Agent reply: ${question.lines.join(" ")}`);
      return;
    }

    // Bubble slides in for 220ms, then a genuine 500ms pause before the
    // three-dot thinking indicator occupies the thread for 600ms.
    const thinkAt = QUESTION_ENTER + HOLD;
    const replyAt = thinkAt + THINK;
    after(thinkAt, () => {
      update(id, { phase: "thinking" });
      setAnnouncement(`Agent thinking. ${question.status}.`);
    });
    after(replyAt, () => {
      // The action strip appears on the same render as the dark reply bubble.
      update(id, { phase: "reply", linesShown: 1 });
    });
    question.lines.slice(1).forEach((_, i) => {
      after(replyAt + (i + 1) * LINE_GAP, () => update(id, { linesShown: i + 2 }));
    });
    after(replyAt + (question.lines.length - 1) * LINE_GAP + 310, () => {
      update(id, { phase: "complete" });
      busyRef.current = false;
      setBusy(false);
      setAnnouncement(`Agent reply: ${question.lines.join(" ")}`);
      if (autoTurn.current === id) {
        autoTurn.current = null;
        announcePreviewDone(SLUG);
      }
    });
  };

  /* PROMPT 28 — AI Chatbots: the moment this tab becomes active and is in viewport,
     wait exactly 1 second, then programmatically "send" the first suggested question
     using the exact identical code path. */
  useEffect(() => {
    if (autoStarted.current || !active || preview) return;
    const id = window.setTimeout(() => {
      autoTimer.current = 0;
      autoStarted.current = true;
      markPreviewPlayed(SLUG);
      const first = QUESTIONS.find((q) => !used.has(q.id)) ?? QUESTIONS[0];
      autoTurn.current = first.id;
      ask(first.id);
    }, AUTO_ASK_MS);
    autoTimer.current = id;
    return () => {
      window.clearTimeout(id);
      if (autoTimer.current === id) autoTimer.current = 0;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, preview]);

  const reset = () => {
    clearTimers();
    autoTurn.current = null;
    busyRef.current = false;
    setBusy(false);
    setTurns([]);
    setUsed(new Set());
    setAnnouncement("Conversation reset. Choose a question to begin.");
  };

  const last = turns[turns.length - 1];
  const running = last && last.phase !== "complete";
  const label =
    !last ? "Ready" : last.phase === "thinking" ? QUESTIONS.find((q) => q.id === last.id)!.status : running ? "Responding" : "Ready";

  return (
    <div className="agent-demo relative flex min-h-[366px] flex-col gap-[10px] px-[14px] pt-[39px] pb-[13px] min-[900px]:h-[var(--svc-stage-h,440px)]" aria-label="AI agent mini demo">
      <div className="flex flex-none items-center justify-between gap-[8px]">
        <div className="flex items-center gap-[8px]">
          <span
            className={`agent-indicator block h-[6px] w-[6px] rounded-full ${preview && active ? "animate-pulse" : ""}`}
            style={{ background: "var(--accent-deep)" }}
          />
          <span className="mono mono-fg">Arche agent</span>
          <span className="mono">· {label}</span>
        </div>
        {turns.length > 0 && !preview && (
          <button type="button" onClick={reset} className="mono lnk" data-cursor="RESET" aria-label="Reset conversation">
            Reset
          </button>
        )}
      </div>

      <div className="agent-chat flex min-h-[170px] flex-1 flex-col overflow-hidden rounded-[5px] border" style={{ borderColor: "var(--line)", background: "var(--card)" }}>
        <div ref={scroll} className="flex-1 space-y-[12px] overflow-y-auto px-[11px] py-[12px]" aria-busy={busy}>
          {turns.map((turn) => {
            const item = QUESTIONS.find((q) => q.id === turn.id)!;
            const replying = turn.phase === "reply" || turn.phase === "complete";
            return (
              <div key={turn.id} className="space-y-[9px]">
                <div className="agent-question flex justify-end">
                  <p className="m-0 max-w-[88%] rounded-[14px_14px_4px_14px] border px-[11px] py-[7px] text-[12.5px] leading-[1.42] tracking-[-.01em]" style={{ borderColor: "var(--line)", color: "var(--fg)", background: "var(--bg)" }}>
                    {item.question}
                  </p>
                </div>

                {turn.phase === "thinking" && (
                  <div className="agent-thinking flex items-center gap-[6px] pl-[4px]" role="status" aria-label="Agent thinking">
                    {[0, 1, 2].map((i) => (
                      <span key={i} className="agent-thinking-dot h-[5px] w-[5px] rounded-full" style={{ background: "var(--accent-deep)", animationDelay: `${i * 120}ms` }} />
                    ))}
                  </div>
                )}

                {replying && (
                  <div className="agent-reply max-w-[91%]">
                    <div className="inline-flex max-w-full flex-col gap-[2px] rounded-[14px_14px_14px_4px] px-[11px] py-[8px]" style={{ background: "var(--fg)", color: "var(--bg)" }}>
                      {item.lines.slice(0, turn.linesShown).map((line) => (
                        <span key={line} className="agent-reply-line block text-[12.5px] leading-[1.43] tracking-[-.01em]">{line}</span>
                      ))}
                    </div>
                    <div className="agent-flow mt-[7px] inline-flex max-w-full flex-wrap items-center gap-[5px] rounded-full border px-[8px] py-[5px]" style={{ borderColor: "var(--line)", background: "var(--bg)" }} aria-label={item.flow.join(" to ")}>
                      {item.flow.map((step, i) => (
                        <span key={step} className="agent-flow-part flex items-center gap-[5px]" style={{ animationDelay: `${i * 70}ms` }}>
                          <span className="block h-[5px] w-[5px] rounded-full" style={{ background: i === item.flow.length - 1 ? "var(--accent-deep)" : "var(--faint)" }} />
                          <span className="mono whitespace-nowrap" style={{ color: i === item.flow.length - 1 ? "var(--accent-deep)" : "var(--fg)", fontSize: 8.5 }}>{step}</span>
                          {i < item.flow.length - 1 && <span className="mono" aria-hidden style={{ color: "var(--faint)", fontSize: 8 }}>→</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* This is the only input in the mini-demo: 3 bounded questions. */}
      <div className="flex flex-none flex-wrap gap-[6px]" aria-label="Suggested questions">
        {QUESTIONS.map((item) => {
          const asked = used.has(item.id);
          return (
            <button
              key={item.id}
              type="button"
              className="chip agent-suggestion text-left"
              data-asked={asked ? "1" : "0"}
              aria-pressed={asked}
              title={asked ? "Already asked. Reset to ask again." : undefined}
              style={{ padding: "7px 10px", opacity: asked ? 0.46 : busy ? 0.64 : 1 }}
              onClick={() => ask(item.id)}
              data-cursor={asked || busy || preview ? undefined : "ASK"}
            >
              {item.question}
            </button>
          );
        })}
      </div>
      <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">{announcement}</span>
    </div>
  );
}