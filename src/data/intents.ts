/**
 * PROMPT 16 — Ask Arche: intent architecture.
 *
 * The assistant is a scripted, intent-matched responder. This file is the
 * explicit, extensible data structure the prompt asks for:
 *
 *   intent = { id, label, keywords, response, trigger, followUps }
 *
 * To add a capability later, append one entry to INTENTS — no rendering
 * code changes. To swap keyword matching for a real LLM call, replace ONLY
 * `resolveIntent` below: everything downstream (message rendering, streaming
 * cadence, visual-trigger panel, contact handoff) consumes its return shape
 * and needs no changes.
 *
 * Honesty note (per the architecture doc): the UI copy must never claim
 * model-backed understanding. This is matching, and the site says so.
 */

export type VisualTrigger =
  | "service:video"
  | "service:web"
  | "service:agent"
  | "service:automation"
  | "system"
  | "contact";

export type Intent = {
  id: string;
  /** Shown as the "matched intent" chip above the reply. */
  label: string;
  /** Lowercase substrings/keywords the matcher scores against. */
  keywords: string[];
  /** Question-type phrases that outrank incidental service mentions. */
  strongPhrases?: string[];
  /** 2–4 sentences, streamed line by line. Arche voice: direct, no filler. */
  response: string[];
  /** Which mini-visual the panel swaps to while this reply streams. */
  trigger: VisualTrigger;
  /** Next suggested questions — each maps 1:1 onto another real intent. */
  followUps: string[];
};

export const INTENTS: Intent[] = [
  {
    id: "web",
    label: "matched intent · website",
    keywords: [
      "website", "web site", "webdev", "web dev", "web development", "landing page",
      "landing", "webpage", "web page", "portfolio", "site", "redesign", "rebuild",
      "new site", "my site", "a site", "seo", "conversion", "homepage", "pages",
    ],
    response: [
      "We start with what the site needs to do — the action a visitor should take — then structure, design and build around that.",
      "No page builders: the front-end is hand-built, fast, and connected to the tools you already run.",
      "Most sites ship in two to six weeks depending on scope.",
    ],
    trigger: "service:web",
    followUps: ["How long does a website take?", "Can you rebuild an existing site?", "I want to automate my workflow."],
  },
  {
    id: "automation",
    label: "matched intent · automation",
    keywords: [
      "automate", "automation", "automating", "workflow", "workflows", "manual",
      "repetitive", "repetetive", "busywork", "spreadsheet", "spreadsheets", "sheets",
      "data entry", "copy paste", "copying", "pipeline",
      "admin", "back and forth", "manual task", "manual process", "follow up", "follow-ups",
    ],
    strongPhrases: ["manual process", "repetitive task", "no one wants to do", "wastes hours"],
    response: [
      "Tell us the task your team repeats: what starts it, which tools it touches, and where a person has to decide.",
      "We map that path, automate the steps that don't need judgment, and leave a human fallback where it does.",
      "First workflow is typically live in two to four weeks.",
    ],
    trigger: "service:automation",
    followUps: ["Which tools do you connect to?", "Can AI make decisions in the flow?", "What does it cost?"],
  },
  {
    id: "agent",
    label: "matched intent · agent",
    keywords: [
      "agent", "agents", "ai agent", "ai agents", "chatbot", "chat bot", "chat bot?", "assistant", "ai assistant",
      "bot", "support bot", "chatbot for", "gpt", "llm", "customer service", "faq",
      "answer questions", "knowledge base", "grounded", "qualify", "qualifies", "qualifying",
      "qualification", "lead qual", "ai chat", "ai chatbot", "conversational",
      "make decisions", "decisions", "wrong answers",
    ],
    response: [
      "An Arche agent answers from your own knowledge base, asks when it's unsure, and can trigger a real action — routing, booking, qualifying.",
      "It grounds in your content, with guardrails and a handoff to a human when confidence drops.",
      "A first working agent usually runs in two to three weeks.",
    ],
    trigger: "service:agent",
    followUps: ["Can it connect to my CRM?", "How do you prevent wrong answers?", "I need a website."],
  },
  {
    id: "video",
    label: "matched intent · video",
    keywords: [
      "video", "videos", "editing", "edit", "edits", "footage", "reels", "shorts",
      "tiktok", "youtube", "clip", "clips", "captions", "subtitles", "short form",
      "long form", "longform", "shortform", "long-form", "short-form", "podcast", "vlog", "b-roll", "broll",
      "grade", "color grading", "repurpose", "content creation", "post production",
    ],
    response: [
      "We start with the footage you already have — every frame reviewed, the strongest material kept.",
      "Then structure, pacing, captions and grade, finished for wherever it will live.",
      "One recording can become a month of publishable assets.",
    ],
    trigger: "service:video",
    followUps: ["How fast is turnaround?", "Do you handle long-form too?", "What does it cost?"],
  },
  {
    id: "timeline",
    label: "matched intent · timeline",
    keywords: [
      "how long", "timeline", "how fast", "deadline", "turnaround", "quickly", "speed",
      "when can", "duration", "weeks", "days", "urgent", "asap", "soon",
    ],
    strongPhrases: ["how long", "how fast", "turnaround", "when can", "what's the timeline", "deadline", "asap"],
    response: [
      "Video edits ship in days. A landing page runs about two weeks.",
      "Full sites, automations and agents typically take two to eight weeks, scoped in writing before anything starts.",
    ],
    trigger: "system",
    followUps: ["How does a project work?", "What does it cost?", "I need a website."],
  },
  {
    id: "pricing",
    label: "matched intent · pricing",
    keywords: [
      "price", "pricing", "cost", "costs", "budget", "quote", "how much", "rates",
      "rate", "expensive", "charge", "fee", "investment", "afford",
    ],
    strongPhrases: ["how much", "what's the cost", "what does it cost", "pricing", "a quote"],
    response: [
      "Some work has a defined package; custom work is quoted after a short conversation.",
      "Scope, timeline and investment are agreed in writing before anything starts — no hourly drift.",
    ],
    trigger: "contact",
    followUps: ["How does a project work?", "How long does a project take?", "Start a project."],
  },
  {
    id: "process",
    label: "matched intent · process",
    keywords: [
      "process", "how do you work", "how does a project work", "how it works", "steps",
      "get started", "getting started", "engage", "engagement", "begin",
      "start a project", "kick off", "kickoff", "first step",
    ],
    strongPhrases: ["how does a project work", "how do we start", "get started", "start a project", "how do you work", "what are the steps"],
    response: [
      "Send a short brief — the guided form on the contact page takes a minute.",
      "We clarify scope, reply with a written proposal and timeline, and start after your approval.",
      "You always know what's being built and what it costs before it starts.",
    ],
    trigger: "system",
    followUps: ["What does it cost?", "How long does a project take?", "I need an AI agent."],
  },
  {
    id: "integrations",
    label: "matched intent · integrations",
    keywords: [
      "integrate", "integrations", "integration", "connect to", "tools", "stack", "api",
      "apis", "crm", "hubspot", "salesforce", "notion", "slack", "airtable", "stripe",
      "shopify", "calendar", "email", "outlook", "gmail", "whatsapp", "existing tools",
      "zapier", "make.com", "n8n",
    ],
    response: [
      "We connect to the tools you already run — CRMs, inboxes, sheets, calendars, APIs.",
      "The automation wraps around your existing stack; it doesn't ask you to replace it.",
    ],
    trigger: "service:automation",
    followUps: ["I want to automate my workflow.", "Can AI make decisions in the flow?", "How does a project work?"],
  },
  {
    id: "system",
    label: "matched intent · connected system",
    keywords: [
      "everything", "all of it", "connected", "system", "systems", "together",
      "whole", "ecosystem", "end to end", "end-to-end", "full picture", "multiple services",
    ],
    response: [
      "One capability first, built properly — then the rest connects when it's useful, not before.",
      "That's the whole thesis: a website, an agent, an automation and your content pipeline are one system, not four vendors.",
    ],
    trigger: "system",
    followUps: ["How does a project work?", "What does it cost?", "I need a website."],
  },
];

/** Honest fallback — no pretend understanding; hands off to the team. */
export const FALLBACK: { label: string; response: string[]; trigger: VisualTrigger } = {
  label: "no matched intent",
  response: [
    "I don't have a specific answer for that yet.",
    "Here's how to reach the team directly — they reply to every real brief.",
  ],
  trigger: "contact",
};

export type Resolution = {
  intent: Intent | null;
  label: string;
  response: string[];
  trigger: VisualTrigger;
  followUps: string[];
};

/**
 * THE SEAM. Keyword/intent scoring today; an LLM call tomorrow.
 * The only contract: return a label, lines of response, a visual trigger
 * and follow-up suggestions. Nothing else in the assistant needs to change.
 *
 * Scoring: strong question-phrases ("how long…") outrank incidental service
 * mentions; long keywords match as substrings (so "websites" hits "website"),
 * short ones require a word boundary (so "airspeed" doesn't hit "speed").
 * A minimum score keeps single weak hits from masquerading as a match.
 */
export function resolveIntent(query: string): Resolution {
  const q = query.toLowerCase().trim();

  const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  let best: Intent | null = null;
  let bestScore = 0;
  for (const intent of INTENTS) {
    let score = 0;
    for (const p of intent.strongPhrases ?? []) {
      if (q.includes(p)) score += 4;
    }
    for (const kw of intent.keywords) {
      if (kw.length >= 6) {
        if (q.includes(kw)) score += 2;
      } else if (new RegExp(`\\b${escape(kw)}\\b`).test(q)) {
        score += 1;
      }
    }
    if (score > bestScore) {
      best = intent;
      bestScore = score;
    }
  }

  if (best && bestScore >= 2) {
    return {
      intent: best,
      label: best.label,
      response: best.response,
      trigger: best.trigger,
      followUps: best.followUps,
    };
  }

  return {
    intent: null,
    label: FALLBACK.label,
    response: FALLBACK.response,
    trigger: FALLBACK.trigger,
    followUps: ["I need a website.", "I want to automate my workflow.", "I need an AI agent.", "I have footage to edit."],
  };
}

/** The four starting chips — 1:1 with the four core service intents. */
export const STARTER_CHIPS = [
  "I need a website.",
  "I want to automate my workflow.",
  "I need an AI agent.",
  "I have footage that never ships.",
];

/** Persistence for the Prompt 16 → 17 handoff: Contact reads this as the seed. */
const LAST_TRIGGER_KEY = "arche:lastTrigger";

export function rememberLastTrigger(t: VisualTrigger): void {
  try {
    sessionStorage.setItem(LAST_TRIGGER_KEY, t);
  } catch {
    /* storage unavailable — handoff just defaults */
  }
}

export function readLastTrigger(): VisualTrigger | null {
  try {
    const v = sessionStorage.getItem(LAST_TRIGGER_KEY);
    if (v && ["service:video", "service:web", "service:agent", "service:automation", "system", "contact"].includes(v)) {
      return v as VisualTrigger;
    }
  } catch {
    /* ignore */
  }
  return null;
}
