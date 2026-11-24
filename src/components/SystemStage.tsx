import { useEffect, useRef, useState, type ReactElement } from "react";
import { services } from "../data/site";
import { SCENES } from "./Scenes";
import { TRY } from "./Demos";

import { AutomationDemo } from "./AutomationDemo";
import { AgentDemo } from "./AgentDemo";
import { WebDevDemo } from "./WebDevDemo";
import { VideoEditingDemo } from "./VideoEditingDemo";
import { PitchDeckDemo } from "./PitchDeckDemo";
import { ServiceTransitionLayer } from "./ServiceTransitionLayer";

export type DemoMode = "watch" | "try";
export type StageProps = { active: boolean; mode: DemoMode; preview: boolean };

const withScenePad = (el: ReactElement) => (
  <div className="h-full w-full">{el}</div>
);

/** Per-service stage registry. */
export const STAGES: Record<string, (p: StageProps) => ReactElement> = Object.fromEntries(
  services.map((s) => {
    const Scene = SCENES[s.slug];
    const Try = TRY[s.slug];
    const Stage = ({ active, mode, preview }: StageProps) =>
      mode === "try" && !preview ? <div className="pt-[20px]"><Try /></div> : withScenePad(<Scene active={active} />);
    return [s.slug, Stage];
  })
);

/** Video Editing — Editorial Suite */
STAGES["video-editing"] = ({ active, preview }: StageProps) => (
  <VideoEditingDemo active={active} preview={preview} />
);
STAGES["video-production"] = ({ active, preview }: StageProps) => (
  <VideoEditingDemo active={active} preview={preview} />
);
STAGES["pitch-decks-storytelling"] = ({ active }: StageProps) => (
  withScenePad(<PitchDeckDemo active={active} />)
);
/** Web Development — Blueprint Architecture */
STAGES["web-development"] = ({ active, preview }: StageProps) => (
  <WebDevDemo active={active} preview={preview} />
);
/** AI Automation — Dispatch Pipeline */
STAGES["ai-automation"] = ({ active, preview }: StageProps) => (
  <AutomationDemo active={active} preview={preview} />
);
STAGES["ai-solutions-automation"] = ({ active, preview }: StageProps) => (
  <AutomationDemo active={active} preview={preview} />
);
/** AI Chatbots — Agent Engine */
STAGES["ai-chatbots"] = ({ active, preview }: StageProps) => (
  <AgentDemo active={active} preview={preview} />
);

export const SELF_CONTROLLED = new Set([
  "video-editing",
  "video-production",
  "pitch-decks-storytelling",
  "web-development",
  "ai-automation",
  "ai-solutions-automation",
  "ai-chatbots",
]);

/** In → out token each service turns its input into. */
const HANDOFF: Record<string, { inn: string; out: string }> = {
  "video-editing": { inn: "RAW", out: "CONTENT" },
  "video-production": { inn: "RAW", out: "CONTENT" },
  "pitch-decks-storytelling": { inn: "IDEA", out: "PITCH" },
  "web-development": { inn: "VISITOR", out: "LEAD" },
  "ai-chatbots": { inn: "QUESTION", out: "ACTION" },
  "ai-automation": { inn: "EVENT", out: "DONE" },
  "ai-solutions-automation": { inn: "EVENT", out: "DONE" },
};

const STAGE_SUBTITLES: Record<string, string> = {
  "video-editing": "EDITORIAL SUITE",
  "video-production": "EDITORIAL SUITE",
  "web-development": "ARCHITECTURE",
  "ai-chatbots": "AGENT ENGINE",
  "ai-automation": "DISPATCH PIPELINE",
  "ai-solutions-automation": "DISPATCH PIPELINE",
  "pitch-decks-storytelling": "STORY ARCHITECTURE",
};

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
  const layer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setShown(target);
  }, [target]);

  const isPreview = previewSlug !== null && shown === previewSlug;
  const hand = HANDOFF[shown] ?? { inn: "INPUT", out: "OUTPUT" };
  const sv = services.find((x) => x.slug === shown) ?? services[0];
  const stageSubtitle = STAGE_SUBTITLES[shown] ?? "STUDIO STAGE";

  const renderStage = (s: string, stageActive: boolean) => {
    const Component = STAGES[s];
    if (!Component) return <div />;
    const isThisPreview = previewSlug !== null && s === previewSlug;
    return (
      <Component
        active={active && stageActive}
        mode="watch"
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
      className="relative flex flex-col justify-between overflow-hidden rounded-[14px]"
      style={{
        background: "#ECEAE2",
        boxShadow: "inset 0 2px 6px rgba(20,20,19,0.05)",
        border: "1px solid rgba(20,20,19,0.07)",
        height: 480,
        minHeight: 460,
        maxHeight: 520,
      }}
    >
      {/* ------------------------------------------------------------- */}
      {/* Shared Showcase Header Status Bar                             */}
      {/* ------------------------------------------------------------- */}
      <div className="relative z-10 flex h-[38px] flex-none items-center justify-between border-b border-[rgba(20,20,19,0.06)] px-[14px] bg-[#ECEAE2]/80 backdrop-blur-sm">
        <div className="flex items-center gap-[7px]">
          <span className="h-[6px] w-[6px] rounded-full bg-[#9EE41A] shadow-sm animate-pulse flex-none" />
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#141413]">
            {sv.n} / {sv.title.toUpperCase()} · {stageSubtitle}
          </span>
        </div>
        <div className="flex items-center gap-[6px]">
          {isPreview ? (
            <span className="font-mono text-[9px] uppercase tracking-wider text-[#141413] bg-white px-[8px] py-[2px] rounded-full border border-[rgba(20,20,19,0.08)] shadow-sm">
              PREVIEW · CLICK TO LOCK
            </span>
          ) : (
            <span className="font-mono text-[9px] uppercase tracking-wider text-[#6E6D68]">
              CALIBRATED STAGE
            </span>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* Locked Stage Content Viewport (Consistent desktop height)     */}
      {/* ------------------------------------------------------------- */}
      <div
        ref={layer}
        className="relative flex-1 w-full overflow-hidden flex flex-col justify-center"
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

      {/* ------------------------------------------------------------- */}
      {/* Shared Showcase Footer Telemetry Strip                        */}
      {/* ------------------------------------------------------------- */}
      <div className="relative z-10 flex h-[38px] flex-none items-center justify-between border-t border-dashed border-[rgba(20,20,19,0.12)] px-[16px] bg-[#ECEAE2]/60">
        {/* Memory Rail Dots */}
        <div className="flex items-center gap-[10px]">
          {services.map((s, i) => {
            const current = s.slug === shown;
            const lit = visited.has(s.slug) || current;
            return (
              <span key={s.slug} data-rail-tab={s.slug} className="flex items-center gap-[8px]">
                <button
                  type="button"
                  onClick={() => onSelect?.(i)}
                  className="flex items-center gap-[6px] cursor-pointer bg-transparent border-0 p-0 text-left"
                  aria-label={`Select ${s.title}`}
                >
                  <span
                    data-rail-dot={s.slug}
                    {...(i === 0 ? { "data-signal": "rail-1" } : {})}
                    className="relative block h-[7px] w-[7px] rounded-full transition-all duration-300"
                    style={{
                      background: current ? "#9EE41A" : lit ? "#141413" : "transparent",
                      border: `1px solid ${lit ? "#141413" : "rgba(20,20,19,0.2)"}`,
                      boxShadow: current ? "0 0 0 3px rgba(158,228,26,0.3)" : "none",
                    }}
                  >
                    <span
                      className="rail-pulse-ring pointer-events-none absolute inset-[-4px] rounded-full"
                      style={{ border: "1.5px solid #9EE41A", opacity: 0 }}
                    />
                  </span>
                  <span
                    className="font-mono text-[9px] uppercase tracking-wider max-[899px]:hidden"
                    style={{
                      color: current ? "#141413" : lit ? "#6E6D68" : "#A8A69E",
                      fontWeight: current ? 600 : 400,
                    }}
                  >
                    {s.short}
                  </span>
                </button>
                {i < services.length - 1 && (
                  <span
                    className="block h-px w-[14px]"
                    style={{ background: visited.has(services[i + 1].slug) ? "#141413" : "rgba(20,20,19,0.12)" }}
                  />
                )}
              </span>
            );
          })}
        </div>

        {/* Right Telemetry Handoff Token */}
        <div className="flex items-center gap-[6px] font-mono text-[10px]">
          <span className="text-[#6E6D68]">{hand.inn}</span>
          <span className="text-[#9EE41A] font-bold">→</span>
          <span className="text-[#141413] font-semibold">{hand.out}</span>
        </div>
      </div>
    </div>
  );
}
