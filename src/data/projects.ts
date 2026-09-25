import { media } from "./media";

export type Project = {
  slug: string;
  n: string;
  name: string;
  service: string; // service slug
  serviceLabel: string;
  status: "Arche Lab" | "Concept" | "Internal Project" | "Prototype" | "Confidential Project";
  year: string;
  scope: string[];
  summary: string;
  img: string;
  ratio: "tall" | "wide" | "square";
};

/**
 * No fabricated clients, metrics or testimonials. Every entry is honestly
 * labelled — Concept, Internal Project, Prototype or Confidential — and
 * represents the type of system Arche builds for each service line.
 */
export const projects: Project[] = [
  {
    slug: "retention-edit-system",
    n: "01",
    name: "Retention Edit System",
    service: "video-editing",
    serviceLabel: "Video Editing",
    status: "Arche Lab",
    year: "2026",
    scope: ["Short-form", "Grading", "Captions"],
    summary:
      "A short-form editing pipeline: selection scan, rhythm pass, caption system and grade — the same sequence applied to every client edit.",
    img: media["w-04"],
    ratio: "wide",
  },
  {
    slug: "longform-narrative-cut",
    n: "02",
    name: "Long-form Narrative Cut",
    service: "video-editing",
    serviceLabel: "Video Editing",
    status: "Concept",
    year: "2026",
    scope: ["Long-form", "Structure", "Sound"],
    summary:
      "A talk recording restructured into a narrative edit — cold open, chapter logic, and a cutdown derived from the same timeline.",
    img: media["w-02"],
    ratio: "tall",
  },
  {
    slug: "studio-site-system",
    n: "03",
    name: "Studio Site System",
    service: "web-development",
    serviceLabel: "Web Development",
    status: "Arche Lab",
    year: "2026",
    scope: ["Design", "Build", "Motion"],
    summary:
      "This website — a data-driven, motion-heavy single-bundle build with route transitions, a reveal grammar and a payment-ready inquiry flow.",
    img: media["w-01"],
    ratio: "wide",
  },
  {
    slug: "conversion-landing-frame",
    n: "04",
    name: "Conversion Landing Frame",
    service: "web-development",
    serviceLabel: "Web Development",
    status: "Prototype",
    year: "2025",
    scope: ["Landing", "Copy structure", "Speed"],
    summary:
      "A reusable landing-page system: one narrative spine, one conversion path, sub-second load — restyled per engagement.",
    img: media["w-03"],
    ratio: "square",
  },
  {
    slug: "intake-routing-flow",
    n: "05",
    name: "Intake Routing Flow",
    service: "ai-automation",
    serviceLabel: "AI Automation",
    status: "Confidential Project",
    year: "2026",
    scope: ["Automation", "Classification", "CRM"],
    summary:
      "Inbound requests classified, enriched and routed into the right pipeline automatically — with a human fallback path for edge cases.",
    img: media["w-07"],
    ratio: "wide",
  },
  {
    slug: "weekly-report-engine",
    n: "06",
    name: "Weekly Report Engine",
    service: "ai-automation",
    serviceLabel: "AI Automation",
    status: "Prototype",
    year: "2025",
    scope: ["Data", "Summaries", "Scheduling"],
    summary:
      "A workflow that assembles the weekly report nobody wanted to build by hand: pulls the numbers, drafts the summary, ships it on schedule.",
    img: media["w-06"],
    ratio: "tall",
  },
  {
    slug: "grounded-support-agent",
    n: "07",
    name: "Grounded Support Agent",
    service: "ai-chatbots",
    serviceLabel: "AI Chatbots",
    status: "Prototype",
    year: "2026",
    scope: ["Support", "RAG", "Escalation"],
    summary:
      "A support agent grounded in real documentation — answers with sources, refuses when unsure, escalates with the full conversation attached.",
    img: media["w-05"],
    ratio: "square",
  },
  {
    slug: "lead-qualifying-agent",
    n: "08",
    name: "Lead-Qualifying Agent",
    service: "ai-chatbots",
    serviceLabel: "AI Chatbots",
    status: "Concept",
    year: "2025",
    scope: ["Leads", "Scoring", "Handoff"],
    summary:
      "A conversational intake that asks the questions a good salesperson would, scores the fit, and books qualified leads directly.",
    img: media["w-08"],
    ratio: "wide",
  },
];

export const projectsByService = (slug: string) => projects.filter((p) => p.service === slug);
