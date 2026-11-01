/**
 * Service Discovery Conversation Engine for Ask Arche.
 *
 * Rules-based, multi-turn project discovery guide that identifies requirements,
 * asks contextual follow-ups, generates structured project briefs, and hands
 * off to the Contact flow.
 */

export type VisualTrigger =
  | "service:video"
  | "service:web"
  | "service:agent"
  | "service:automation"
  | "system"
  | "contact";

export interface ProjectBrief {
  service: string;
  scope: string;
  details: string;
  timeline: string;
  seed: string;
}

export type DiscoveryDomain = "web" | "automation" | "agent" | "video" | "unsure";
export type DiscoveryStep = "initial" | "clarify_type" | "clarify_details" | "brief_ready";

export interface DiscoveryState {
  domain: DiscoveryDomain | null;
  step: DiscoveryStep;
  serviceTitle: string;
  selectedType: string;
  selectedDetails: string;
  brief: ProjectBrief | null;
}

export interface DiscoveryResult {
  lines: string[];
  trigger: VisualTrigger;
  label: string;
  followUps: string[];
  brief: ProjectBrief | null;
  nextState: DiscoveryState;
}

export const INITIAL_DISCOVERY_STATE: DiscoveryState = {
  domain: null,
  step: "initial",
  serviceTitle: "",
  selectedType: "",
  selectedDetails: "",
  brief: null,
};

export const STARTER_CHIPS: string[] = [
  "I need a website.",
  "I want to automate my business.",
  "I need an AI chatbot.",
  "I need an AI agent.",
  "I need video editing.",
  "I want to connect my existing tools.",
  "I'm not sure what I need.",
];

export const GREETING = "I'm the Arche discovery assistant. What is your team looking to build or solve?";

/** Normalize input text for robust keyword and intent detection */
function normalize(text: string): string {
  return text
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[-_/]+/g, " ")
    .replace(/[^\p{L}\p{N}\s']/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasAny(norm: string, words: string[]): boolean {
  const padded = ` ${norm} `;
  return words.some((w) => {
    const term = normalize(w);
    if (!term) return false;
    if (padded.includes(` ${term} `)) return true;
    return !term.includes(" ") && term.length >= 4 && padded.includes(` ${term}s `);
  });
}

function matchesDomainContext(norm: string, domain: DiscoveryDomain | null): boolean {
  if (!domain) return false;
  if (domain === "web") {
    return hasAny(norm, ["brand", "business", "landing", "page", "portfolio", "showcase", "application", "app", "interface", "store", "ecommerce", "guideline", "copy", "design", "scratch", "narrative", "redesign", "existing", "ready", "wireframe", "figma", "content", "web", "site", "corporate", "saas"]);
  }
  if (domain === "automation") {
    return hasAny(norm, ["lead", "intake", "qualification", "onboard", "client", "contract", "sync", "slack", "sheet", "spreadsheet", "report", "data", "entry", "crm", "database", "api", "billing", "invoice", "email", "support", "sales", "order", "inventory", "process", "workflow", "automate", "busywork", "pipeline", "task", "follow up", "hubspot", "salesforce", "gmail", "outlook", "stripe", "shopify", "webhook", "airtable", "notion", "zendesk", "connection", "tool", "tools"]);
  }
  if (domain === "agent") {
    return hasAny(norm, ["website", "whatsapp", "sms", "internal", "team", "operations", "concierge", "support", "chat", "slack", "channel", "multi", "answer", "faq", "doc", "docs", "knowledge", "calendar", "schedule", "booking", "meet", "meeting", "lead", "qualif", "crm", "api", "database", "update", "lookup", "action", "bot", "assistant"]);
  }
  if (domain === "video") {
    return hasAny(norm, ["short", "reels", "tiktok", "shorts", "long", "youtube", "podcast", "product", "launch", "brand", "film", "course", "education", "series", "video", "content", "footage", "raw", "script", "ready", "outline", "pacing", "cadence", "weekly", "batch", "edit", "editing", "cut"]);
  }
  if (domain === "unsure") {
    return hasAny(norm, ["website", "convert", "outdated", "web", "manual", "wastes", "repetitive", "automate", "workflow", "hours", "respond", "inquiries", "agent", "support", "customer", "fast enough", "footage", "content", "video", "publish", "recording"]);
  }
  return false;
}

/**
 * Multi-turn Discovery Step Handler
 */
export function processDiscoveryTurn(rawInput: string, prevState: DiscoveryState): DiscoveryResult {
  const input = rawInput.trim();
  const norm = normalize(input);

  // 1. Check for Reset or General Questions (Pricing, Timeline, Process)
  if (hasAny(norm, ["what does it cost", "how much", "pricing", "price", "quote", "cost", "rates"])) {
    return {
      lines: [
        "Every project is scoped individually with a written proposal and fixed milestones before work begins.",
        "Starting investment guidelines: Video ($2,400/batch), Web Development ($3,500), AI Agents ($2,800), AI Automation ($1,800).",
        "Which service would you like to scope for a detailed written quote?",
      ],
      trigger: "contact",
      label: "Arche · Pricing & Scoping",
      followUps: ["I need a website.", "I want to automate my business.", "I need an AI agent.", "I need video editing."],
      brief: null,
      nextState: INITIAL_DISCOVERY_STATE,
    };
  }

  if (hasAny(norm, ["how long", "timeline", "how fast", "turnaround", "deadline", "duration"])) {
    return {
      lines: [
        "Video edits ship in 2–5 working days per batch. Full websites, automations and agents typically take 2–4 weeks.",
        "All timelines and milestones are agreed in writing before kickoff. What are you looking to build?",
      ],
      trigger: "system",
      label: "Arche · Delivery Timelines",
      followUps: ["I need a website.", "I want to automate my business.", "I need an AI agent.", "I need video editing."],
      brief: null,
      nextState: INITIAL_DISCOVERY_STATE,
    };
  }

  if (hasAny(norm, ["how do you work", "how does a project work", "process", "what are the steps"])) {
    return {
      lines: [
        "Our process: 1. Discovery brief & fixed quote → 2. Rapid design & prototypes → 3. Development sprints with weekly demos → 4. Deployment, testing & 30-day warranty.",
        "Ready to define your requirement?",
      ],
      trigger: "system",
      label: "Arche · Process",
      followUps: ["I need a website.", "I want to automate my business.", "I need an AI agent.", "I need video editing."],
      brief: null,
      nextState: INITIAL_DISCOVERY_STATE,
    };
  }

  // 2. If user clicks "Explore [Service] demo" or "Ask about another service"
  if (hasAny(norm, ["ask about another", "start over", "something else", "different service"])) {
    return {
      lines: [
        "Understood. Let's start fresh. Which capability does your team need?",
      ],
      trigger: "system",
      label: "Arche Discovery",
      followUps: STARTER_CHIPS,
      brief: null,
      nextState: INITIAL_DISCOVERY_STATE,
    };
  }

  // 3. STEP-BASED CONVERSATION LOGIC (Only if input matches current domain context)
  const isContextMatch = matchesDomainContext(norm, prevState.domain);

  // Domain: UNSURE
  if (prevState.domain === "unsure" && prevState.step === "clarify_type" && isContextMatch) {
    if (hasAny(norm, ["website", "convert", "outdated", "web"])) {
      return routeToDomain("web", "Website need identified");
    }
    if (hasAny(norm, ["manual", "wastes", "repetitive", "automate", "workflow", "hours"])) {
      return routeToDomain("automation", "Workflow bottleneck identified");
    }
    if (hasAny(norm, ["respond", "inquiries", "agent", "support", "customer", "fast enough"])) {
      return routeToDomain("agent", "Response time bottleneck identified");
    }
    if (hasAny(norm, ["footage", "content", "video", "publish", "recording"])) {
      return routeToDomain("video", "Content asset bottleneck identified");
    }
  }

  // Domain: WEB
  if (prevState.domain === "web" && isContextMatch) {
    if (prevState.step === "clarify_type") {
      const type = input.length > 3 ? input : "Bespoke Web Project";
      return {
        lines: [
          `Got it — a ${type}.`,
          "Do you already have content and design direction ready, or are we developing structure from scratch?",
        ],
        trigger: "service:web",
        label: "Arche Discovery · Web Scope",
        followUps: [
          "Brand guidelines & copy ready",
          "Design & narrative from scratch",
          "Redesigning an existing website",
        ],
        brief: null,
        nextState: {
          ...prevState,
          step: "clarify_details",
          selectedType: type,
        },
      };
    }

    if (prevState.step === "clarify_details") {
      const details = input.length > 3 ? input : "Custom motion front-end";
      const brief: ProjectBrief = {
        service: "High-Performance Web Development",
        scope: `${prevState.selectedType} with custom 2D DOM motion`,
        details: `${details} · Hand-built, zero page-builder bloat, sub-second TTFB`,
        timeline: "2–4 weeks (fixed written milestone guarantee)",
        seed: "web",
      };
      return {
        lines: [
          "Here is your project brief:",
          `• Service: Web Development (${prevState.selectedType})`,
          `• Scope: ${details} with responsive 2D DOM motion architecture`,
          "• Quality Standards: Sub-second load times, 95+ Lighthouse audit score, full keyboard accessibility",
          "• Estimated Delivery: 2–4 weeks agreed in writing before kickoff",
          "Ready to turn this brief into a written proposal with fixed milestones?",
        ],
        trigger: "contact",
        label: "Arche Brief · Web Development",
        followUps: [
          "Start project with this brief →",
          "Explore Web Development demo",
          "Ask about another service",
        ],
        brief,
        nextState: {
          ...prevState,
          step: "brief_ready",
          selectedDetails: details,
          brief,
        },
      };
    }
  }

  // Domain: AUTOMATION
  if (prevState.domain === "automation" && isContextMatch) {
    if (prevState.step === "clarify_type") {
      const type = input.length > 3 ? input : "Business Workflow Automation";
      return {
        lines: [
          `Understood — automating ${type}.`,
          "Which primary tools does this workflow need to connect?",
        ],
        trigger: "service:automation",
        label: "Arche Discovery · Tool Connections",
        followUps: [
          "CRM (HubSpot / Salesforce) & Slack",
          "Inboxes (Gmail / Outlook) & Spreadsheets",
          "Stripe, Shopify & Webhooks",
          "Custom internal database or API",
        ],
        brief: null,
        nextState: {
          ...prevState,
          step: "clarify_details",
          selectedType: type,
        },
      };
    }

    if (prevState.step === "clarify_details") {
      const details = input.length > 3 ? input : "Connected business tools";
      const brief: ProjectBrief = {
        service: "AI Workflow Automation",
        scope: `${prevState.selectedType} connecting ${details}`,
        details: "Event-driven routing with human verification gate for exceptions",
        timeline: "2–3 weeks to production readiness",
        seed: "automation",
      };
      return {
        lines: [
          "Here is your automation project brief:",
          `• Service: Workflow Automation (${prevState.selectedType})`,
          `• Target Stack: ${details}`,
          "• Reliability: One trigger routes to all tools with human fallback for edge cases",
          "• Estimated Delivery: 2–3 weeks to full deployment",
          "We can map your tools and prepare an integration spec. Ready to proceed?",
        ],
        trigger: "contact",
        label: "Arche Brief · Automation",
        followUps: [
          "Start project with this brief →",
          "View live Automation demo",
          "Ask about another service",
        ],
        brief,
        nextState: {
          ...prevState,
          step: "brief_ready",
          selectedDetails: details,
          brief,
        },
      };
    }
  }

  // Domain: AGENT
  if (prevState.domain === "agent" && isContextMatch) {
    if (prevState.step === "clarify_type") {
      const type = input.length > 3 ? input : "Autonomous AI Assistant";
      return {
        lines: [
          `An agent operating via ${type}.`,
          "Beyond answering questions, does it need to trigger real actions in your business tools?",
        ],
        trigger: "service:agent",
        label: "Arche Discovery · Agent Capabilities",
        followUps: [
          "Answers & FAQ only (grounded in docs)",
          "Calendar scheduling & booking meetings",
          "Lead qualification & CRM lookup",
          "Custom API lookups & database updates",
        ],
        brief: null,
        nextState: {
          ...prevState,
          step: "clarify_details",
          selectedType: type,
        },
      };
    }

    if (prevState.step === "clarify_details") {
      const details = input.length > 3 ? input : "Grounded retrieval & actions";
      const brief: ProjectBrief = {
        service: "Autonomous AI Agent",
        scope: `${prevState.selectedType} with ${details}`,
        details: "Grounded retrieval, hard guardrails, and human escalation handoff",
        timeline: "2–3 weeks",
        seed: "agent",
      };
      return {
        lines: [
          "Here is your AI Agent project brief:",
          `• Service: AI Agent & Chatbot (${prevState.selectedType})`,
          `• Capabilities: ${details}`,
          "• Reliability: Strict grounding in verified documentation with human handoff fallback",
          "• Estimated Delivery: 2–3 weeks to a working prototype",
          "Ready to scope an agent grounded in your own content?",
        ],
        trigger: "contact",
        label: "Arche Brief · AI Agent",
        followUps: [
          "Start project with this brief →",
          "Try live Agent demo",
          "Ask about another service",
        ],
        brief,
        nextState: {
          ...prevState,
          step: "brief_ready",
          selectedDetails: details,
          brief,
        },
      };
    }
  }

  // Domain: VIDEO
  if (prevState.domain === "video" && isContextMatch) {
    if (prevState.step === "clarify_type") {
      const type = input.length > 3 ? input : "Post-Production Pipeline";
      return {
        lines: [
          `A ${type} pipeline.`,
          "What is your expected publishing frequency or monthly batch size?",
        ],
        trigger: "service:video",
        label: "Arche Discovery · Video Cadence",
        followUps: [
          "Batch of 4–8 videos per month",
          "Weekly release schedule (1–2 edits/week)",
          "One-off flagship brand/product video",
          "High-volume social content engine",
        ],
        brief: null,
        nextState: {
          ...prevState,
          step: "clarify_details",
          selectedType: type,
        },
      };
    }

    if (prevState.step === "clarify_details") {
      const details = input.length > 3 ? input : "Regular monthly edits";
      const brief: ProjectBrief = {
        service: "Video Post-Production & Motion",
        scope: `${prevState.selectedType} on a ${details}`,
        details: "Sound design, typography/captions, pacing cuts, color grade, 48h revisions",
        timeline: "2–5 working days per batch",
        seed: "video",
      };
      return {
        lines: [
          "Here is your video post-production brief:",
          `• Service: Video Editing (${prevState.selectedType})`,
          `• Cadence: ${details}`,
          "• Delivery: Batch delivery in 2–5 working days with 48h revision turnaround",
          "• Craft: Audio leveling, captions, motion pacing, and color grade",
          "Ready to send raw footage or discuss references?",
        ],
        trigger: "contact",
        label: "Arche Brief · Video Editing",
        followUps: [
          "Start project with this brief →",
          "Try live Video Scrubber demo",
          "Ask about another service",
        ],
        brief,
        nextState: {
          ...prevState,
          step: "brief_ready",
          selectedDetails: details,
          brief,
        },
      };
    }
  }

  // 4. CLASSIFY INITIAL INQUIRIES OR TOPIC SHIFTS

  // Website trigger detection
  if (hasAny(norm, ["website", "web dev", "webdev", "site", "landing page", "web page", "webpage", "portfolio", "rebuild", "redesign", "web application"])) {
    return routeToDomain("web");
  }

  // Automation & Tool trigger detection
  if (hasAny(norm, ["automate", "automation", "workflow", "workflows", "tools", "connect my tools", "integrate", "lead management", "crm", "zapier", "make", "repetitive", "manual", "spreadsheet"])) {
    return routeToDomain("automation");
  }

  // AI Chatbot / Agent trigger detection
  if (hasAny(norm, ["chatbot", "chat bot", "ai chatbot", "agent", "ai agent", "assistant", "ai assistant", "bot", "support bot", "customer support"])) {
    return routeToDomain("agent");
  }

  // Video trigger detection
  if (hasAny(norm, ["video", "videos", "editing", "footage", "reels", "shorts", "youtube", "tiktok", "podcast", "post production"])) {
    return routeToDomain("video");
  }

  // Unsure trigger detection
  if (hasAny(norm, ["not sure", "don't know", "dont know", "help me decide", "what should i", "recommend", "options", "where to start"])) {
    return routeToDomain("unsure");
  }

  // General studio inquiry
  if (hasAny(norm, ["what does arche do", "what do you do", "who are you", "services", "arche"])) {
    return {
      lines: [
        "Arche is a multi-disciplinary studio building high-performance websites, AI automations, and custom software.",
        "We identify operational friction, then engineer the connected pieces so everything works together.",
        "Which area would you like to explore for your business?",
      ],
      trigger: "system",
      label: "Arche · Overview",
      followUps: ["I need a website.", "I want to automate my business.", "I need an AI agent.", "I need video editing."],
      brief: null,
      nextState: INITIAL_DISCOVERY_STATE,
    };
  }

  // Fallback for unclassified queries
  return {
    lines: [
      "I don't have a specific answer for that yet — I'm a service discovery guide for Arche.",
      "Would you like to scope a website, workflow automation, AI agent, or video editing project?",
    ],
    trigger: "contact",
    label: "no matched intent",
    followUps: ["I need a website.", "I want to automate my business.", "I need an AI agent.", "I need video editing."],
    brief: null,
    nextState: INITIAL_DISCOVERY_STATE,
  };
}

function routeToDomain(domain: DiscoveryDomain, customIntro?: string): DiscoveryResult {
  switch (domain) {
    case "web":
      return {
        lines: [
          customIntro || "We design and build bespoke, high-performance websites with fluid motion and sub-second load times.",
          "To shape the right scope: what kind of website do you need?",
        ],
        trigger: "service:web",
        label: "Arche Discovery · Web Development",
        followUps: [
          "Brand / Business website",
          "Conversion Landing page",
          "Portfolio / Showcase",
          "Web application interface",
        ],
        brief: null,
        nextState: {
          domain: "web",
          step: "clarify_type",
          serviceTitle: "Web Development",
          selectedType: "",
          selectedDetails: "",
          brief: null,
        },
      };

    case "automation":
      return {
        lines: [
          customIntro || "We build reliable, event-driven workflows for lead qualification, CRM synchronization, and business operations that eliminate manual copy-pasting and busywork.",
          "Which core process is currently consuming the most manual time?",
        ],
        trigger: "service:automation",
        label: "Arche Discovery · AI Automation",
        followUps: [
          "Inbound lead intake & qualification",
          "Client onboarding & contract hand-offs",
          "Cross-tool sync (CRM, Slack, Sheets)",
          "Report generation & data entry",
        ],
        brief: null,
        nextState: {
          domain: "automation",
          step: "clarify_type",
          serviceTitle: "AI Workflow Automation",
          selectedType: "",
          selectedDetails: "",
          brief: null,
        },
      };

    case "agent":
      return {
        lines: [
          customIntro || "We build autonomous agents grounded strictly in your proprietary documentation and business tools — with hard guardrails that prevent hallucination.",
          "Where should the assistant primarily operate?",
        ],
        trigger: "service:agent",
        label: "Arche Discovery · AI Agent",
        followUps: [
          "Embedded website assistant",
          "WhatsApp / SMS client messaging",
          "Internal team assistant (Slack / Notion)",
          "Omni-channel customer support",
        ],
        brief: null,
        nextState: {
          domain: "agent",
          step: "clarify_type",
          serviceTitle: "Autonomous AI Agent",
          selectedType: "",
          selectedDetails: "",
          brief: null,
        },
      };

    case "video":
      return {
        lines: [
          customIntro || "We transform raw footage into tight, high-retention video assets — structured pacing, crisp sound design, captions, and color grade.",
          "What format of video are you primarily producing?",
        ],
        trigger: "service:video",
        label: "Arche Discovery · Video Editing",
        followUps: [
          "Short-form (Reels, TikTok, Shorts)",
          "Long-form (YouTube, Podcasts, Keynotes)",
          "Product demo & launch videos",
          "Paid social ads & marketing creatives",
        ],
        brief: null,
        nextState: {
          domain: "video",
          step: "clarify_type",
          serviceTitle: "Video Post-Production",
          selectedType: "",
          selectedDetails: "",
          brief: null,
        },
      };

    case "unsure":
      return {
        lines: [
          "Arche connects your digital presence: we build high-speed websites, automate back-office workflows, build custom AI agents, and edit content.",
          "What is the primary operational bottleneck in your business right now?",
        ],
        trigger: "system",
        label: "Arche Discovery · Needs Assessment",
        followUps: [
          "Our website looks outdated or doesn't convert",
          "Our team wastes hours on repetitive manual work",
          "We can't respond fast enough to incoming customer inquiries",
          "We have raw footage/content that never gets published",
        ],
        brief: null,
        nextState: {
          domain: "unsure",
          step: "clarify_type",
          serviceTitle: "Needs Assessment",
          selectedType: "",
          selectedDetails: "",
          brief: null,
        },
      };
  }
}
