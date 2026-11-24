import { useEffect, useRef, useState, useLayoutEffect } from "react";
import { announcePreviewDone, markPreviewPlayed } from "../lib/autoplay";

const SLUG = "ai-automation";

type Mode = "manual" | "auto";
type Phase = "idle" | "running" | "done";

const STEPS = [
  "Email arrives",
  "Copy the details",
  "Update the sheet",
  "Open the CRM",
  "Send a reply",
  "Create a task",
];

const CARDS = [
  { k: "Inbox", tip: "Marked read, tagged Lead · 0ms", icon: "✉" },
  { k: "Sheet", tip: "Row added: Name, Source, Timestamp", icon: "⊞" },
  { k: "CRM", tip: "Contact created, pipeline stage assigned", icon: "◎" },
  { k: "Slack", tip: "Notification dispatched to #sales", icon: "💬" },
];

export function AutomationDemo({
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
  const [mode, setMode] = useState<Mode>("manual");
  const [phase, setPhase] = useState<Phase>("idle");
  const [manualStep, setManualStep] = useState(-1);
  const [cardStates, setCardStates] = useState<Record<string, "idle" | "active" | "complete">>({
    Inbox: "idle",
    Sheet: "idle",
    CRM: "idle",
    Slack: "idle",
  });
  const [packetProgress, setPacketProgress] = useState<number[]>([0, 0, 0, 0]);
  const [nodePulse, setNodePulse] = useState(false);
  const [elapsedTimer, setElapsedTimer] = useState("0.0s");

  const stageRef = useRef<HTMLDivElement>(null);
  const nodeRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const timers = useRef<number[]>([]);
  const animFrame = useRef<number>(0);
  const startTime = useRef<number>(0);
  const userInteractedRef = useRef(false);

  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
    if (animFrame.current) cancelAnimationFrame(animFrame.current);
  };

  useEffect(() => () => clearTimers(), []);

  // Run Automated Pipeline (1.4s fast run)
  const runAuto = () => {
    clearTimers();
    setPhase("running");
    setCardStates({ Inbox: "idle", Sheet: "idle", CRM: "idle", Slack: "idle" });
    setPacketProgress([0, 0, 0, 0]);
    setNodePulse(true);
    setElapsedTimer("0.0s");
    startTime.current = performance.now();

    const updateTimer = () => {
      const now = performance.now();
      const s = Math.min(1.4, (now - startTime.current) / 1000);
      setElapsedTimer(`${s.toFixed(1)}s`);
      if (s < 1.4) {
        animFrame.current = requestAnimationFrame(updateTimer);
      }
    };
    animFrame.current = requestAnimationFrame(updateTimer);

    // AI core node concentric pulse ring
    timers.current.push(
      window.setTimeout(() => {
        setNodePulse(false);
      }, 500)
    );

    // Synchronized light-packets along 4 SVG bus lines
    const packetStart = performance.now();
    const packetDuration = 650;
    const animatePackets = () => {
      const elapsed = performance.now() - packetStart;
      const progress = Math.min(1, elapsed / packetDuration);
      setPacketProgress([progress, progress, progress, progress]);
      if (progress < 1) {
        requestAnimationFrame(animatePackets);
      }
    };
    timers.current.push(window.setTimeout(() => requestAnimationFrame(animatePackets), 200));

    // Staggered card flip (Waiting -> Updated)
    CARDS.forEach((c, idx) => {
      timers.current.push(
        window.setTimeout(() => {
          setCardStates((prev) => ({ ...prev, [c.k]: "complete" }));
        }, 850 + idx * 60)
      );
    });

    // Resolve run complete at 1.4s
    timers.current.push(
      window.setTimeout(() => {
        setPhase("done");
        setElapsedTimer("1.4s");
        announcePreviewDone(SLUG);

        // Continuous comparison loop: after auto completes, transition back to manual after 3.8s
        if (!userInteractedRef.current) {
          timers.current.push(
            window.setTimeout(() => {
              if (userInteractedRef.current) return;
              setMode("manual");
              runManual();
            }, 3800)
          );
        }
      }, 1400)
    );
  };

  // Run Manual Pipeline (Paced 6 sequential steps to snappier 4.8s for preview)
  const runManual = () => {
    clearTimers();
    setPhase("running");
    setManualStep(0);
    setCardStates({ Inbox: "idle", Sheet: "idle", CRM: "idle", Slack: "idle" });
    setElapsedTimer("0.0s");
    startTime.current = performance.now();

    const updateTimer = () => {
      const now = performance.now();
      const s = Math.min(4.8, (now - startTime.current) / 1000);
      setElapsedTimer(`${s.toFixed(1)}s`);
      if (s < 4.8) {
        animFrame.current = requestAnimationFrame(updateTimer);
      }
    };
    animFrame.current = requestAnimationFrame(updateTimer);

    // Sequence 6 steps
    STEPS.forEach((_, idx) => {
      timers.current.push(
        window.setTimeout(() => {
          setManualStep(idx);
          if (idx === 1) setCardStates((prev) => ({ ...prev, Inbox: "complete" }));
          if (idx === 2) setCardStates((prev) => ({ ...prev, Sheet: "complete" }));
          if (idx === 3) setCardStates((prev) => ({ ...prev, CRM: "complete" }));
          if (idx === 5) setCardStates((prev) => ({ ...prev, Slack: "complete" }));
        }, idx * 750)
      );
    });

    // Complete manual run at 4.8s
    timers.current.push(
      window.setTimeout(() => {
        setPhase("done");
        setElapsedTimer("4.8s");
        announcePreviewDone(SLUG);

        // Continuous comparison loop: after manual completes, transition to auto after 1.2s
        if (!userInteractedRef.current) {
          timers.current.push(
            window.setTimeout(() => {
              if (userInteractedRef.current) return;
              setMode("auto");
              runAuto();
            }, 1200)
          );
        }
      }, 4800)
    );
  };

  const executeMode = (m: Mode) => {
    if (m === "auto") runAuto();
    else runManual();
  };

  const handleModeChange = (m: Mode) => {
    userInteractedRef.current = true;
    setMode(m);
    executeMode(m);
  };

  const handleResetOrRun = () => {
    userInteractedRef.current = true;
    if (phase === "running") {
      clearTimers();
      setPhase("idle");
      setManualStep(-1);
      setElapsedTimer("0.0s");
      setCardStates({ Inbox: "idle", Sheet: "idle", CRM: "idle", Slack: "idle" });
    } else {
      executeMode(mode);
    }
  };

  // Viewport-gated reset & replay
  useEffect(() => {
    clearTimers();
    if (!active) {
      setMode("manual");
      setPhase("idle");
      setManualStep(-1);
      setElapsedTimer("0.0s");
      setCardStates({ Inbox: "idle", Sheet: "idle", CRM: "idle", Slack: "idle" });
      return;
    }

    if (preview || userInteractedRef.current) return;
    markPreviewPlayed(SLUG);

    setMode("manual");
    setPhase("idle");
    setManualStep(-1);
    setElapsedTimer("0.0s");
    setCardStates({ Inbox: "idle", Sheet: "idle", CRM: "idle", Slack: "idle" });

    const initialDelay = window.setTimeout(() => {
      runManual();
    }, 280);

    timers.current.push(initialDelay);
    return () => clearTimers();
  }, [active, runKey, preview]);

  // Clean SVG Path Geometry calculation for Automated Mode
  const [busPaths, setBusPaths] = useState<string[]>(["", "", "", ""]);

  useLayoutEffect(() => {
    if (mode !== "auto") return;
    const stage = stageRef.current;
    const node = nodeRef.current;
    if (!stage || !node) return;

    const sRect = stage.getBoundingClientRect();
    const nRect = node.getBoundingClientRect();

    const sx = nRect.left + nRect.width / 2 - sRect.left;
    const sy = nRect.bottom - sRect.top;

    const paths = cardRefs.current.map((card) => {
      if (!card) return "";
      const cRect = card.getBoundingClientRect();
      const ex = cRect.left + cRect.width / 2 - sRect.left;
      const ey = cRect.top - sRect.top;
      const midY = (sy + ey) * 0.5;
      return `M ${sx} ${sy} C ${sx} ${midY}, ${ex} ${midY}, ${ex} ${ey}`;
    });

    setBusPaths(paths);
  }, [mode, active]);

  return (
    <div
      ref={stageRef}
      className="au au-pane relative flex h-full w-full flex-col justify-between p-[10px] min-[900px]:p-[14px] select-none"
      aria-label="AI Automation Demo"
    >
      {/* ------------------------------------------------------------- */}
      {/* 1. Header Bar: Segmented Switcher & Run Control               */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-none items-center justify-between gap-[10px]">
        {/* Segmented Mode Switcher (.au-seg button) */}
        <div
          role="radiogroup"
          aria-label="Automation Mode"
          className="au-seg flex items-center rounded-full p-[3px] bg-[#EAE7DF] border border-[#141413]/10"
        >
          <button
            type="button"
            role="radio"
            aria-checked={mode === "manual"}
            onClick={() => handleModeChange("manual")}
            className="rounded-full px-[14px] py-[4.5px] font-mono text-[12px] font-semibold uppercase tracking-[0.12em] transition-all cursor-pointer"
            style={{
              background: mode === "manual" ? "#0D0E0C" : "transparent",
              color: mode === "manual" ? "#F4F4EE" : "#343832",
              border: mode === "manual" ? "1px solid #0D0E0C" : "1px solid transparent",
              boxShadow: mode === "manual" ? "0 1px 4px rgba(13,14,12,0.15)" : "none",
            }}
          >
            Manual
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={mode === "auto"}
            onClick={() => handleModeChange("auto")}
            className="rounded-full px-[14px] py-[4.5px] font-mono text-[12px] font-semibold uppercase tracking-[0.12em] transition-all cursor-pointer"
            style={{
              background: mode === "auto" ? "#0D0E0C" : "transparent",
              color: mode === "auto" ? "#F4F4EE" : "#343832",
              border: mode === "auto" ? "1px solid #0D0E0C" : "1px solid transparent",
              boxShadow: mode === "auto" ? "0 1px 4px rgba(13,14,12,0.15)" : "none",
            }}
          >
            Automated
          </button>
        </div>

        {/* Run / Run Again / Running Button (.au-run) */}
        <button
          type="button"
          onClick={handleResetOrRun}
          className="au-run flex items-center gap-[5px] rounded-full bg-[#141413] border border-[#141413] px-[13px] py-[4px] font-mono text-[10px] font-semibold text-[#F4F4EE] shadow-sm transition-all hover:text-[#9EE41A] cursor-pointer"
          data-cursor="RUN"
        >
          <span className="text-[#9EE41A] text-[8.5px]">
            {phase === "running" ? "◼" : "▶"}
          </span>
          <span className="whitespace-nowrap">
            {phase === "running"
              ? "Running…"
              : phase === "done"
              ? "Run again"
              : mode === "manual"
              ? "Run manual"
              : "Run automated"}
          </span>
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. Main Stage Content Area (Warm Stone Recessed Tray)         */}
      {/* ------------------------------------------------------------- */}
      <div className="relative flex-1 my-[8px] overflow-hidden rounded-[10px] border border-[#141413]/10 bg-[#E5E7DC] p-[10px] min-[900px]:p-[12px] shadow-sm flex flex-col justify-center">
        {mode === "manual" ? (
          /* ========================================================= */
          /* MANUAL MODE: 2 Columns Side-by-Side (YOU · 6 STEPS | RESULT) */
          /* ========================================================= */
          <div className="grid h-full w-full grid-cols-1 md:grid-cols-[1.35fr_1fr] gap-[12px] min-[900px]:gap-[16px] items-start">
            {/* Left Column: YOU · 6 STEPS (~58%) */}
            <div className="flex flex-col h-full justify-start py-[2px]">
              <div className="flex items-center justify-between pb-[6px] border-b border-[#0D0E0C]/10">
                <span className="font-mono text-[12px] uppercase tracking-[0.12em] text-[#343832] font-semibold">
                  YOU · 6 STEPS
                </span>
                <span className="font-mono text-[12px] text-[#0D0E0C] font-semibold tabular-nums">
                  {manualStep >= 0 ? `STEP 0${manualStep + 1} OF 06` : "STEP 00 OF 06"}
                </span>
              </div>

              {/* 6 Stacked Horizontal Step Rows */}
              <div className="flex flex-col gap-[6px] mt-[8px]">
                {STEPS.map((s, idx) => {
                  const isCurrent = manualStep === idx;
                  const isDone = manualStep > idx;
                  return (
                    <div
                      key={s}
                      className="relative overflow-hidden rounded-[8px] border py-3 px-4 flex items-center justify-between transition-all"
                      style={{
                        borderColor: isCurrent
                          ? "#9EE41A"
                          : isDone
                          ? "rgba(158, 228, 26, 0.4)"
                          : "rgba(13,14,12,0.08)",
                        background: isDone
                          ? "#F1F9E3"
                          : isCurrent
                          ? "#FFFFFF"
                          : "#FFFFFF",
                      }}
                    >
                      <div className="flex items-center gap-[10px] min-w-0">
                        <span className="font-mono text-[13px] font-bold text-[#343832]">
                          0{idx + 1}
                        </span>
                        <span className="font-sans text-[13.5px] font-semibold text-[#0D0E0C] truncate">
                          {s}
                        </span>
                      </div>

                      {/* Status Checkmark Indicator */}
                      <span
                        className="h-[18px] w-[18px] rounded-full flex items-center justify-center transition-colors flex-none"
                        style={{
                          background: isDone ? "#9EE41A" : isCurrent ? "#0D0E0C" : "transparent",
                          border: isDone
                            ? "1px solid #9EE41A"
                            : isCurrent
                            ? "1px solid #0D0E0C"
                            : "1px solid rgba(13,14,12,0.2)",
                        }}
                      >
                        {isDone ? (
                          <span className="text-[10px] font-bold text-[#0D0E0C]">✓</span>
                        ) : isCurrent ? (
                          <span className="h-[5px] w-[5px] rounded-full bg-[#9EE41A] animate-pulse" />
                        ) : null}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: RESULT · 4 Stacked Status Cards (~42%) */}
            <div className="flex flex-col h-full justify-start py-[2px] border-t md:border-t-0 md:border-l border-[#0D0E0C]/10 md:pl-[14px]">
              <div className="flex items-center justify-between pb-[6px] border-b border-[#0D0E0C]/10">
                <span className="font-mono text-[12px] uppercase tracking-[0.12em] text-[#343832] font-semibold">
                  RESULT
                </span>
                <span className="font-mono text-[12px] text-[#343832] font-semibold">
                  4 OUTPUTS
                </span>
              </div>

              {/* 4 Stacked Result Cards */}
              <div className="flex flex-col gap-[6px] mt-[8px]">
                {CARDS.map((c) => {
                  const isDone = cardStates[c.k] === "complete";
                  return (
                    <div
                      key={c.k}
                      className="au-card rounded-[8px] border p-3 transition-all bg-[#F1F2EA]"
                      data-state={isDone ? "complete" : "idle"}
                      style={{
                        borderColor: isDone ? "#9EE41A" : "rgba(13,14,12,0.08)",
                        boxShadow: isDone
                          ? "0 2px 8px rgba(158,228,26,0.15)"
                          : "0 1px 4px rgba(13,14,12,0.03)",
                      }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[13px] text-[#343832]">{c.icon}</span>
                          <span className="font-mono text-[13px] font-bold text-[#0D0E0C]">
                            {c.k.toUpperCase()}
                          </span>
                        </div>
                        <span
                          className="font-mono text-[10px] uppercase px-2 py-0.5 rounded font-semibold"
                          style={{
                            background: isDone ? "#9EE41A" : "rgba(13,14,12,0.05)",
                            color: isDone ? "#0D0E0C" : "#343832",
                            border: isDone ? "1px solid #9EE41A" : "1px solid rgba(13,14,12,0.08)",
                          }}
                        >
                          {isDone ? "UPDATED ✓" : "WAITING"}
                        </span>
                      </div>
                      <p className="font-mono text-[12px] font-medium text-[#343832] mt-1.5 truncate">
                        {c.tip}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* ========================================================= */
          /* AUTOMATED MODE: Centered AI Node + 4 Symmetrical Bus Lines */
          /* ========================================================= */
          <div className="relative flex h-full w-full flex-col justify-between items-center py-[4px]">
            {/* SVG Bus Paths Layer */}
            <svg
              className="pointer-events-none absolute inset-0 h-full w-full overflow-visible z-10"
              aria-hidden="true"
            >
              {busPaths.map((d, i) => (
                <g key={i}>
                  <path
                    d={d}
                    fill="none"
                    stroke="rgba(20,20,19,0.1)"
                    strokeWidth="1.5"
                    strokeDasharray="4 3"
                  />
                  <path
                    d={d}
                    fill="none"
                    stroke="#9EE41A"
                    strokeWidth="2"
                    style={{
                      opacity: cardStates[CARDS[i].k] === "complete" ? 0.85 : 0.2,
                      transition: "opacity 0.4s",
                    }}
                  />
                  {phase === "running" && packetProgress[i] > 0 && packetProgress[i] < 1 && (
                    <circle
                      r="4"
                      fill="#9EE41A"
                      filter="drop-shadow(0 0 4px #9EE41A)"
                      style={{
                        offsetPath: `path('${d}')`,
                        offsetDistance: `${packetProgress[i] * 100}%`,
                      }}
                    />
                  )}
                </g>
              ))}
            </svg>

            {/* Centered Charcoal AI Core Hub */}
            <div className="relative z-20 flex flex-col items-center pt-[2px]">
              <div
                ref={nodeRef}
                data-slab="engine"
                className="relative flex h-[50px] w-[50px] items-center justify-center rounded-full bg-[#141413] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_6px_18px_rgba(20,20,19,0.18)]"
              >
                {nodePulse && (
                  <span className="au-ring pointer-events-none absolute -inset-[8px] rounded-full border-2 border-[#9EE41A] animate-ping opacity-60" />
                )}
                <span className="font-mono text-[13px] font-bold tracking-wider text-[#9EE41A]">
                  AI
                </span>
                <span className="au-node-port absolute -bottom-[3px] left-1/2 -translate-x-1/2 h-[6px] w-[6px] rounded-full bg-[#9EE41A]" />
              </div>
              <span className="font-mono text-[8.5px] uppercase tracking-[0.16em] text-[#6E6D68] mt-[4px]">
                READS · DECIDES · ROUTES
              </span>
            </div>

            {/* Lower 4 Result Cards */}
            <div className="relative z-20 grid grid-cols-2 sm:grid-cols-4 gap-[8px] w-full pt-[10px]">
              {CARDS.map((c, idx) => {
                const isComplete = cardStates[c.k] === "complete";
                return (
                  <div
                    key={c.k}
                    ref={(el) => {
                      cardRefs.current[idx] = el;
                    }}
                    className="au-card relative rounded-[8px] border border-[#0D0E0C]/10 bg-[#F1F2EA] p-[10px_12px] transition-all duration-300 shadow-sm"
                    style={{
                      boxShadow: isComplete
                        ? "0 4px 14px rgba(158,228,26,0.15)"
                        : "0 2px 6px rgba(13,14,12,0.04)",
                      transform: isComplete ? "translateY(-2px)" : "none",
                    }}
                    data-state={isComplete ? "complete" : "idle"}
                  >
                    <span
                      className="au-card-port absolute -top-[4px] left-1/2 -translate-x-1/2 h-[6px] w-[6px] rounded-full transition-colors duration-300"
                      style={{ background: isComplete ? "#9EE41A" : "#8A8D89" }}
                    />
                    <div className="flex items-center justify-between gap-[4px] mb-[4px]">
                      <span className="font-mono text-[13px] font-bold text-[#0D0E0C]">
                        {c.k}
                      </span>
                      <span
                        className="h-[6px] w-[6px] rounded-full transition-colors"
                        style={{ background: isComplete ? "#9EE41A" : "#8A8D89" }}
                      />
                    </div>
                    <div className="font-mono text-[10px] uppercase tracking-wider">
                      {isComplete ? (
                        <span className="text-[#0D0E0C] font-semibold bg-[#9EE41A]/20 px-[6px] py-[1.5px] rounded border border-[#9EE41A]">UPDATED ✓</span>
                      ) : (
                        <span className="text-[#343832]">WAITING</span>
                      )}
                    </div>
                    <p className="font-mono text-[12px] font-medium text-[#343832] mt-[4px] truncate">
                      {c.tip}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. Bottom Strip: Live Elapsed Status & Multiplier Telemetry   */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-none items-center justify-between gap-[8px] font-mono text-[9.5px]">
        <div className="flex items-center gap-[6px] text-[#6E6D68]">
          <span className="h-[5px] w-[5px] rounded-full bg-[#9EE41A]" />
          <span>
            AUTO-PREVIEW · {mode.toUpperCase()} RUN ·{" "}
            {phase === "running" ? "RUNNING" : phase === "done" ? "COMPLETE" : "READY"} · {elapsedTimer}
          </span>
        </div>

        <div className="flex items-center gap-[6px]">
          <span className="text-[#8E8E88]">SIMULATED</span>
          {mode === "auto" && phase === "done" ? (
            <span className="text-[#141413] font-semibold bg-[#DCEEC4] px-[6px] py-[1.5px] rounded border border-[rgba(158,228,26,0.3)]">
              1.4s · 5× FASTER
            </span>
          ) : (
            <span className="text-[#8E8E88]">· {elapsedTimer}</span>
          )}
        </div>
      </div>
    </div>
  );
}
