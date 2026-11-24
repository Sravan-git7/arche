import { type ReactElement } from "react";
import { AgentDemo } from "./AgentDemo";
import { WebDevDemo } from "./WebDevDemo";
import { VideoEditingDemo } from "./VideoEditingDemo";
import { AutomationDemo } from "./AutomationDemo";
import { PitchDeckDemo } from "./PitchDeckDemo";

/**
 * Service scenes router. All 4 services host dedicated live interaction models:
 * - Video Production & Editing: Scrubbable Timeline (RAW -> SELECT -> CUT -> MOTION -> CAPTIONS -> GRADE -> EXPORT)
 * - Pitch Decks & Storytelling: Narrative Slide Sequencer (PROBLEM -> SOLUTION -> OPPORTUNITY -> IMPACT)
 * - Web Development: IDEA -> STRUCTURE -> INTERFACE -> LIVE
 * - AI Solutions & Automation: Manual vs Automated Workflow Runner & Agent Engine
 */

export function SceneVideo({ active }: { active: boolean }) {
  return <VideoEditingDemo active={active} />;
}

export function ScenePitchDeck({ active }: { active: boolean }) {
  return <PitchDeckDemo active={active} />;
}

export function SceneWeb({ active }: { active: boolean }) {
  return <WebDevDemo active={active} />;
}

export function SceneChatbot({ active }: { active: boolean }) {
  return <AgentDemo active={active} />;
}

export function SceneAutomation({ active }: { active: boolean }) {
  return <AutomationDemo active={active} />;
}

export const SCENES: Record<string, (p: { active: boolean }) => ReactElement> = {
  // New primary slugs
  "video-production": SceneVideo,
  "pitch-decks-storytelling": ScenePitchDeck,
  "web-development": SceneWeb,
  "ai-solutions-automation": SceneAutomation,

  // Legacy fallback aliases
  "video-editing": SceneVideo,
  "pitch-decks": ScenePitchDeck,
  "storytelling": ScenePitchDeck,
  "web-dev": SceneWeb,
  "ai-automation": SceneAutomation,
  "ai-chatbots": SceneChatbot,
};
