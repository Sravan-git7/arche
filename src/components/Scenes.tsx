import { type ReactElement } from "react";
import { AgentDemo } from "./AgentDemo";
import { WebDevDemo } from "./WebDevDemo";
import { VideoEditingDemo } from "./VideoEditingDemo";
import { AutomationDemo } from "./AutomationDemo";

/**
 * Service scenes router. All 4 services now host dedicated live interaction models:
 * - Video Editing: Scrubbable Timeline (RAW -> SELECT -> CUT -> MOTION -> CAPTIONS -> GRADE -> EXPORT)
 * - Web Development: IDEA -> STRUCTURE -> INTERFACE -> LIVE
 * - AI Chatbots: Conversational Mini-Agent with suggested chips & action
 * - AI Automation: Manual vs Automated Workflow Runner
 */

export function SceneVideo({ active }: { active: boolean }) {
  return <VideoEditingDemo active={active} auto={active} />;
}

export function SceneWeb({ active }: { active: boolean }) {
  return <WebDevDemo active={active} auto={active} />;
}

export function SceneChatbot({ active }: { active: boolean }) {
  return <AgentDemo active={active} auto={active} />;
}

export function SceneAutomation({ active }: { active: boolean }) {
  return <AutomationDemo active={active} auto={active} />;
}

export const SCENES: Record<string, (p: { active: boolean }) => ReactElement> = {
  "video-editing": SceneVideo,
  "web-development": SceneWeb,
  "ai-automation": SceneAutomation,
  "ai-chatbots": SceneChatbot,
};
