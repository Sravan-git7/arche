import { useEffect, useRef, useState, type ReactElement } from "react";
import { services } from "../data/site";
import { SCENES } from "./Scenes";
import { TRY } from "./Demos";

import { AutomationDemo } from "./AutomationDemo";
import { AgentDemo } from "./AgentDemo";
import { WebDevDemo } from "./WebDevDemo";
import { VideoEditingDemo } from "./VideoEditingDemo";
import { ServiceTransitionLayer } from "./ServiceTransitionLayer";


/**
 * Services stage — a frame that hosts a live product per tab.
 *
 * The frame knows nothing about what a stage does: each service registers
 * its own component in STAGES and receives { active, mode, preview }.
 * Prompts 06–09 replace these registry entries with genuinely distinct
 * interaction models; the frame, transition and memory rail stay the same.
 *
 * The selected demo mounts immediately. A short, inert snapshot of the
 * outgoing interface carries its actual timeline, page, workflow or agent
 * elements into the next composition. Interrupted films are reverted before
 * measuring the next pair; the latest selected service always wins.
 */

export type DemoMode = "watch" | "try";
export type StageProps = { active: boolean; mode: DemoMode; preview: boolean };

const withScenePad = (el: ReactElement) => (
  <div className="px-[clamp(4px,0.8vw,12px)] pt-[34px] pb-[8px] [&_svg]:mx-auto min-[900px]:[&_svg]:max-h-[392px]">{el}</div>
);

/** Per-service stage registry. */
export const STAGES: Record<string, (p: StageProps) => ReactElement> = Object.fromEntries(
  services.map((s) => {
    const Scene = SCENES[s.slug];
    const Try = TRY[s.slug];
    const Stage = ({ active, mode, preview }: StageProps) =>
      mode === "try" && !preview ? <div className="pt-[30px]"><Try /></div> : withScenePad(<Scene active={active} />);
    return [s.slug, Stage];
  })
);

/** Video Editing — RAW → SELECT → CUT → MOTION → CAPTIONS → GRADE → EXPORT scrubber (Prompt 09 / Prompt 28). */
STAGES["video-editing"] = ({ active, preview }: StageProps) => (
  <VideoEditingDemo active={active} preview={preview} />
);
/** Web Development — IDEA → STRUCTURE → INTERFACE → LIVE (Prompt 08 / Prompt 28). */
STAGES["web-development"] = ({ active, preview }: StageProps) => (
  <WebDevDemo active={active} preview={preview} />
);
/** AI Automation — a real MANUAL then AUTOMATED run (Prompt 06 / Prompt 28). */
STAGES["ai-automation"] = ({ active, preview }: StageProps) => (
  <AutomationDemo active={active} preview={preview} />
);
/** AI Chatbots — three suggested questions; auto-sends first question on view (Prompt 07 / Prompt 28). */
STAGES["ai-chatbots"] = ({ active, preview }: StageProps) => (
  <AgentDemo active={active} preview={preview} />
);

/** Stages that bring their own controls: the frame hides its Watch / Try toggle. */
export const SELF_CONTROLLED = new Set(["video-editing", "web-development", "ai-automation", "ai-chatbots"]);

/** In → out token each service turns its input into. */
const HANDOFF: Record<string, { inn: string; out: string }> = {
  "video-editing": { inn: "RAW", out: "STORY" },
  "web-development": { inn: "VISITOR", out: "LEAD" },
  "ai-chatbots": { inn: "QUESTION", out: "DEMO" },
  "ai-automation": { inn: "EVENT", out: "DONE" },
};

export function DemoToggle({ mode, onChange }: { mode: DemoMode; onChange: (m: DemoMode) => void }) {
  return (
    <div className="flex rounded-full border p-[3px]" style={{ borderColor: "var(--line)", background: "var(--bg)" }} role="tablist" aria-label="Demo mode">
      {(["watch", "try"] as const).map((m) => (
        <button
          key={m}
          type="button"
          role="tab"
          aria-selected={mode === m}
          onClick={() => onChange(m)}
          className="rounded-full px-[11px] py-[4px] font-mono text-[9.5px] tracking-[.14em] whitespace-nowrap uppercase"
          style={{
            background: mode === m ? "var(--fg)" : "transparent",
            color: mode === m ? "var(--bg)" : "var(--faint)",
            transition: "all .3s var(--e-out)",
          }}
          data-cursor={m === "try" ? "TRY" : undefined}
        >
          {m === "try" ? "Try it" : "Watch"}
        </button>
      ))}
    </div>
  );
}

export function ServiceStage({
  slug,
  previewSlug,
  active,
  visited,
  onSelect,
  onStageSettled,
}: {
  slug: string;
  previewSlug: string | null;
  active: boolean;
  visited: ReadonlySet<string>;
  onSelect?: (i: number) => void;
  onStageSettled?: (slug: string) => void;
}) {
  const target = previewSlug ?? slug;
  const [shown, setShown] = useState(target);
  const [mode, setMode] = useState<DemoMode>("watch");
  const layer = useRef<HTMLDivElement>(null);
  useEffect(() => {
    setShown(target);
  }, [target]);
  const isPreview = previewSlug !== null && shown === previewSlug;
  const showToggle = !isPreview && !SELF_CONTROLLED.has(shown);
  const hand = HANDOFF[shown] ?? { inn: "INPUT", out: "OUTPUT" };
  const sv = services.find((x) => x.slug === shown) ?? services[0];

  const renderStage = (s: string, stageActive: boolean) => {
    const Component = STAGES[s];
    if (!Component) return <div />;
    const isThisPreview = previewSlug !== null && s === previewSlug;
    return (
      <Component
        active={active && stageActive}
        mode={isThisPreview ? "watch" : mode}
        preview={isThisPreview}
      />
    );
  };

  return (
    <div
      id="services-stage"
      role="tabpanel"
      aria-labelledby={`svc-tab-${slug}`}
      data-service={slug}
      data-rendered-service={shown}
      className="relative overflow-hidden"
      style={{ background: "var(--bg-2)", borderRadius: 4, minHeight: 380 }}
    >
      {/* click-through: only the toggle itself takes pointer events, so stage
          content underneath (e.g. a demo's own controls) stays clickable */}
      <div className="pointer-events-none absolute inset-x-[10px] top-[10px] z-[4] flex items-center justify-between gap-[10px]">
        <span
          className="mono rounded-full px-[9px] py-[4px]"
          style={{
            background: "var(--bg)",
            color: isPreview ? "var(--fg)" : "var(--faint)",
            opacity: isPreview ? 1 : 0,
            transition: "opacity .25s var(--e-out)",
          }}
          aria-hidden={!isPreview}
        >
          Preview · {sv.short} — click to open
        </span>
        {showToggle && <div style={{ pointerEvents: "auto" }}>
          <DemoToggle mode={mode} onChange={setMode} />
        </div>}
      </div>

      {/* Fixed height on desktop: switching or previewing a tab must never
          move the tab rail out from under the cursor. When the section is
          pinned (Prompt 33) the module must fit the viewport on short
          screens, so the height reads --svc-stage-h (set on the section). */}
      <div
        ref={layer}
        className="relative flex flex-col justify-center min-[900px]:h-[var(--svc-stage-h,440px)] min-[900px]:overflow-hidden"
        style={{ minHeight: 320, transformOrigin: "50% 50%" }}
      >
        <ServiceTransitionLayer
          currentSlug={shown}
          targetSlug={target}
          stageContainerRef={layer}
          renderStage={renderStage}
          onTransitionComplete={(settledSlug) => {
            setShown(settledSlug);
            onStageSettled?.(settledSlug);
          }}
          isAutoplayReady={active}
        />
      </div>

      {/* memory rail — services the visitor has opened stay lit */}
      <div className="relative z-[2] flex items-center gap-[10px] border-t px-[16px] py-[12px]" style={{ borderColor: "var(--line)" }}>
        {services.map((s, i) => {
          const current = s.slug === shown;
          const lit = visited.has(s.slug) || current;
          return (
            <span key={s.slug} data-rail-tab={s.slug} className="flex items-center gap-[10px]">
              <button
                type="button"
                onClick={() => onSelect?.(i)}
                className="flex items-center gap-[8px] cursor-pointer bg-transparent border-0 p-0 text-left"
                aria-label={`Select ${s.title}`}
              >
                <span
                  data-rail-dot={s.slug}
                  {...(i === 0 ? { "data-signal": "rail-1" } : {})}
                  className="relative block h-[7px] w-[7px] rounded-full"
                  style={{
                    background: current ? "var(--accent-deep)" : lit ? "var(--fg)" : "transparent",
                    border: `1px ${current && isPreview ? "dashed" : "solid"} ${lit ? "var(--accent-deep)" : "var(--line)"}`,
                    boxShadow: current ? "0 0 0 4px color-mix(in srgb, var(--accent-deep) 22%, transparent)" : "none",
                    transition: "all 0.4s var(--e-out)",
                  }}
                >
                  <span
                    className="rail-pulse-ring pointer-events-none absolute inset-[-4px] rounded-full"
                    style={{ border: "1.5px solid var(--accent)", opacity: 0 }}
                  />
                </span>
                <span className="mono max-[899px]:hidden" style={{ color: current ? "var(--accent-ink)" : lit ? "var(--fg)" : "var(--faint)" }}>
                  {s.short}
                </span>
              </button>
              {i < services.length - 1 && (
                <span className="block h-px w-[18px]" style={{ background: visited.has(services[i + 1].slug) ? "var(--accent-deep)" : "var(--line)", transition: "background 0.4s" }} />
              )}
            </span>
          );
        })}
        <span className="ml-auto flex items-center gap-[10px]">
          <span className="mono">{hand.inn}</span>
          <span className="mono" style={{ color: "var(--accent-ink)" }}>→</span>
          <span className="mono" style={{ color: "var(--accent-ink)" }}>{hand.out}</span>
        </span>
      </div>
    </div>
  );
}
