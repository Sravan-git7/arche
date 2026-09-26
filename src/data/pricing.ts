/**
 * Arche Pricing Model (PROMPT 27)
 *
 * Honest, studio-style pricing architecture — no fake three-tier SaaS tables.
 * Every service outlines:
 *  1. A starting-price framing ("Projects typically start at...")
 *  2. A scope-driver explanation ("Final scope depends on...")
 *  3. An honest caveat ("Every project is scoped individually — this isn't a fixed package.")
 *  4. Scope parameters (turnaround, deposit, deliverables)
 */

export type ServicePricingData = {
  slug: string;
  n: string;
  serviceTitle: string;
  startingAt: string;
  unit: string;
  startingFraming: string;
  scopeDrivers: string;
  caveat: string;
  parameters: {
    turnaround: string;
    deposit: string;
    revisions: string;
    handoff: string;
  };
  startingScopes: {
    name: string;
    price: string;
    unit: string;
    summary: string;
    includes: string[];
  }[];
};

export const pricingData: Record<string, ServicePricingData> = {
  "video-editing": {
    slug: "video-editing",
    n: "01",
    serviceTitle: "Video Editing",
    startingAt: "$2,400",
    unit: "batch / scope-based",
    startingFraming: "Video Editing projects typically start at $2,400.",
    scopeDrivers: "raw footage volume, narrative complexity, publishing cadence, and format variations (vertical short-form vs long-form masters).",
    caveat: "Every project is scoped individually — this isn't a fixed package.",
    parameters: {
      turnaround: "2–5 working days per batch",
      deposit: "50% to schedule, balance on delivery",
      revisions: "2 dedicated revision passes per cut",
      handoff: "Full project source archives + master exports",
    },
    startingScopes: [
      {
        name: "Short-Form Batch",
        price: "$2,400",
        unit: "per batch",
        summary: "Batch of high-retention vertical edits cut from your raw footage.",
        includes: [
          "8 short-form vertical edits (Reels / TikTok / Shorts)",
          "Dynamic typography & retention-focused pacing",
          "Color grade & clean audio mixing",
          "2 revision rounds per video with 48h turnaround",
        ],
      },
      {
        name: "Long-Form Master",
        price: "Custom quote",
        unit: "per episode",
        summary: "Editorial assembly for YouTube, podcasts, and keynotes.",
        includes: [
          "Up to 20 min final master cut with narrative structure",
          "Audio restoration, sound effects & pacing polish",
          "Custom visual chapter titles & motion graphics",
          "1 short-form vertical cutdown included",
        ],
      },
    ],
  },

  "web-development": {
    slug: "web-development",
    n: "02",
    serviceTitle: "Web Development",
    startingAt: "$3,500",
    unit: "scope-based",
    startingFraming: "Web Development projects typically start at $3,500.",
    scopeDrivers: "number of unique templates, custom motion/interactive components, CMS requirements, and CRM webhook integrations.",
    caveat: "Every project is scoped individually — this isn't a fixed package.",
    parameters: {
      turnaround: "2–4 weeks (landing page) · 4–8 weeks (full site)",
      deposit: "50% to schedule, balance on deployment",
      revisions: "Iterative staging reviews with direct engineer access",
      handoff: "Complete codebase repository, documentation & edge deployment",
    },
    startingScopes: [
      {
        name: "Conversion Landing Page",
        price: "$3,500",
        unit: "one-time",
        summary: "A single high-performance page engineered around one clear conversion action.",
        includes: [
          "Custom design system & bespoke interface motion",
          "TypeScript / Tailwind implementation — zero page-builder bloat",
          "Form routing directly into your CRM & analytics tracking",
          "Sub-second load times & 95+ Lighthouse score",
        ],
      },
      {
        name: "Marketing System Site",
        price: "Custom quote",
        unit: "scope-based",
        includes: [
          "Multi-page bespoke architecture & interactive components",
          "Custom CMS / content model for internal updates",
          "Technical SEO, OpenGraph assets & semantic accessibility",
          "30-day post-launch support and tuning window",
        ],
        summary: "An operating system for your brand that turns traffic into qualified pipeline.",
      },
    ],
  },

  "ai-chatbots": {
    slug: "ai-chatbots",
    n: "03",
    serviceTitle: "AI Chatbots",
    startingAt: "$2,800",
    unit: "setup & grounding",
    startingFraming: "AI Chatbot projects typically start at $2,800.",
    scopeDrivers: "knowledge source complexity, tool actions (calendar booking, CRM lookups, API triggers), and escalation routing rules.",
    caveat: "Every project is scoped individually — this isn't a fixed package.",
    parameters: {
      turnaround: "2–3 weeks to production deployment",
      deposit: "50% to schedule, balance on deployment",
      revisions: "Weekly prompt refinement & transcript review cycles",
      handoff: "Hosted agent widget, webhook endpoints & knowledge update guide",
    },
    startingScopes: [
      {
        name: "Support & Knowledge Agent",
        price: "$2,800",
        unit: "setup & tune",
        summary: "24/7 grounded conversational agent resolving questions over your documentation.",
        includes: [
          "Knowledge base ingestion (docs, FAQs, pricing, policies)",
          "Strict hallucination guardrails & brand tone calibration",
          "Custom embeddable web widget styled to your brand",
          "Human escalation routing with full chat transcripts",
        ],
      },
      {
        name: "Lead Qualification Bot",
        price: "Custom quote",
        unit: "scope-based",
        summary: "Conversational qualification engine that captures, scores, and routes leads.",
        includes: [
          "Custom qualification decision logic & intent scoring",
          "Direct tool calling (calendar booking, CRM contact creation)",
          "Real-time alerts via Slack / Email on qualified leads",
          "30-day conversation tuning and optimization window",
        ],
      },
    ],
  },

  "ai-automation": {
    slug: "ai-automation",
    n: "04",
    serviceTitle: "AI Automation",
    startingAt: "$1,800",
    unit: "audit & pipeline build",
    startingFraming: "AI Automation projects typically start at $1,800.",
    scopeDrivers: "number of integrated tools, AI extraction/decision complexity, data volume, and human-in-the-loop fallback interfaces.",
    caveat: "Every project is scoped individually — this isn't a fixed package.",
    parameters: {
      turnaround: "2–4 weeks to live pipeline rollout",
      deposit: "50% to schedule, balance on handover",
      revisions: "Stress-testing across real historic cases & edge conditions",
      handoff: "Documented workflow blueprints, error alerts & video walkthroughs",
    },
    startingScopes: [
      {
        name: "Process Audit & Roadmap",
        price: "$1,800",
        unit: "fixed scope",
        summary: "Deep mapping of repetitive operations to identify high-ROI automation opportunities.",
        includes: [
          "Process mapping session with your operations team",
          "Bottleneck analysis & manual hours audit",
          "Detailed automation architecture blueprint",
          "Guaranteed fixed quote for the implementation phase",
        ],
      },
      {
        name: "Core Workflow Pipeline",
        price: "Custom quote",
        unit: "scope-based",
        summary: "Autonomous end-to-end workflow connecting your tools without human copy-paste.",
        includes: [
          "Multi-tool integration (CRM, email, databases, sheets, APIs)",
          "AI extraction & classification nodes inside the flow",
          "Real-time error handling & Slack notification alerts",
          "30-day post-launch monitoring and maintenance window",
        ],
      },
    ],
  },
};
