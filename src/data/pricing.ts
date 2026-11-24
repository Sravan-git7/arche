/**
 * ARCHE CREATIVE STUDIOS — Pricing Model
 *
 * Transparent studio pricing architecture in INR.
 * Derived from the central service catalog and package definitions.
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
  "video-production": {
    slug: "video-production",
    n: "01",
    serviceTitle: "Video Production & Editing",
    startingAt: "₹799",
    unit: "per video",
    startingFraming: "Video Production & Editing starts from ₹799 per video.",
    scopeDrivers: "source footage volume, narrative pacing, custom motion graphics, sound design, and export aspect ratios.",
    caveat: "All packages include transparent deliverables, limits, and revision rounds.",
    parameters: {
      turnaround: "Short-form: 3–5 working days · Long-form: 5–8 working days",
      deposit: "50% upfront to confirm schedule, balance on approval",
      revisions: "1–2 consolidated revision rounds per video",
      handoff: "High-retention master video exports + project files",
    },
    startingScopes: [
      {
        name: "Short-Form Basic",
        price: "₹799",
        unit: "per video",
        summary: "Clean cuts and pacing for social clips up to 30s.",
        includes: [
          "Final duration up to 30 seconds (source up to 5 mins)",
          "Clean cuts & removal of pauses",
          "English captions & basic transitions",
          "Basic audio balancing & color correction",
          "One vertical 9:16 export · 1 revision round",
        ],
      },
      {
        name: "Short-Form Standard",
        price: "₹1,499",
        unit: "per video",
        summary: "Hook-focused high-retention reel or short up to 60s.",
        includes: [
          "Final duration up to 60 seconds (source up to 15 mins)",
          "Hook-focused editing & dynamic pacing",
          "Styled English captions & text callouts",
          "B-roll / overlays & sound design",
          "One vertical 9:16 export · 2 revision rounds",
        ],
      },
      {
        name: "Long-Form Standard",
        price: "₹4,999",
        unit: "per video",
        summary: "Full YouTube video or podcast edit up to 10 mins.",
        includes: [
          "Final duration up to 10 mins (source up to 60 mins)",
          "Narrative flow, chapter headings & B-roll placement",
          "Branded intro/outro & visual titles",
          "Dialogue cleanup, audio balance & color correction",
          "One 16:9 export · 2 revision rounds",
        ],
      },
    ],
  },

  "pitch-decks-storytelling": {
    slug: "pitch-decks-storytelling",
    n: "02",
    serviceTitle: "Pitch Decks & Storytelling",
    startingAt: "₹3,999",
    unit: "per deck",
    startingFraming: "Pitch Decks & Storytelling projects start from ₹3,999.",
    scopeDrivers: "number of slides, narrative structuring requirements, custom diagrams, market research, and delivery urgency.",
    caveat: "Every deck is structured to communicate clearly and hold investor attention.",
    parameters: {
      turnaround: "Clear Deck: 3–4 days · Narrative: 5–7 days · Investor: 7–10 days",
      deposit: "50% upfront to initiate sprint, balance on final delivery",
      revisions: "1–2 structured revision rounds included",
      handoff: "Presentation-ready PDF + fully editable PPTX source files",
    },
    startingScopes: [
      {
        name: "Clear Deck (Basic)",
        price: "₹3,999",
        unit: "up to 8 slides",
        summary: "Clean visual design based on supplied, approved content.",
        includes: [
          "Up to 8 custom designed slides",
          "Clean visual hierarchy, typography & brand colors",
          "Simple icons, image placement & basic charts",
          "Editable PPTX + presentation-ready PDF",
          "One consolidated revision round",
        ],
      },
      {
        name: "Narrative Pitch Deck (Standard)",
        price: "₹7,999",
        unit: "up to 12 slides",
        summary: "Structured storytelling and slide redesign for startups and sales.",
        includes: [
          "Up to 12 structured slides",
          "Storyline flow & content refinement",
          "Bespoke data charts, diagrams & visual metaphors",
          "Visual redesign of existing slides or draft notes",
          "Editable PPTX + PDF · Two revision rounds",
        ],
      },
      {
        name: "Investor-Ready Deck (Premium)",
        price: "₹14,999",
        unit: "up to 16 slides",
        summary: "Comprehensive pitch package for fundraising, venture competitions and keynotes.",
        includes: [
          "Up to 16 slides with narrative architecture",
          "Problem-solution framing & market sizing graphics",
          "Custom visual diagrams, financial layout & traction slides",
          "Includes 1-page executive pitch summary (PDF)",
          "Two structured revision rounds · Editable PPTX + PDF",
        ],
      },
    ],
  },

  "web-development": {
    slug: "web-development",
    n: "03",
    serviceTitle: "Web Development",
    startingAt: "₹4,999",
    unit: "one-time",
    startingFraming: "Web Development projects start from ₹4,999.",
    scopeDrivers: "number of pages, interactive/motion components, CMS needs, CRM integrations, and responsive complexity.",
    caveat: "Zero bloated page builders. Handcrafted for speed, mobile responsiveness and conversion.",
    parameters: {
      turnaround: "Landing page: 4–6 days · Starter site: 7–10 days · Business site: 2–3 weeks",
      deposit: "50% upfront to reserve sprint, balance upon launch sign-off",
      revisions: "Iterative staging previews with direct feedback rounds",
      handoff: "Production deployment, clean source code & handover guide",
    },
    startingScopes: [
      {
        name: "Landing Page (Starter)",
        price: "₹4,999",
        unit: "one page",
        summary: "Single-page conversion layout engineered for marketing campaigns.",
        includes: [
          "High-conversion single-page layout",
          "Mobile responsive & fast loading performance",
          "Contact form or WhatsApp CTA integration",
          "Basic on-page SEO & social share meta",
          "One consolidated revision round",
        ],
      },
      {
        name: "Starter Business Site (Standard)",
        price: "₹9,999",
        unit: "up to 4 pages",
        summary: "Multi-page website for growing businesses and modern studios.",
        includes: [
          "Up to 4 custom pages (Home, About, Services, Contact)",
          "Branded visual design & subtle animations",
          "Lead capture forms & social channel links",
          "Performance optimization & mobile-first QA",
          "Two revision rounds · Handover documentation",
        ],
      },
      {
        name: "Advanced Business Site (Premium)",
        price: "₹18,999",
        unit: "up to 8 pages",
        summary: "Comprehensive digital flagship with bespoke interactions.",
        includes: [
          "Up to 8 custom designed pages",
          "Custom UI animations & interactive sections",
          "CMS integration for blog/news or dynamic portfolio",
          "Analytics, event tracking & lead notification routing",
          "30-day post-launch support window",
        ],
      },
    ],
  },

  "ai-solutions-automation": {
    slug: "ai-solutions-automation",
    n: "04",
    serviceTitle: "AI Solutions & Automation",
    startingAt: "₹5,999",
    unit: "starting from",
    startingFraming: "AI Solutions & Automation projects start from ₹5,999.",
    scopeDrivers: "complexity of automation logic, number of connected apps, AI model fine-tuning, and knowledge base volume.",
    caveat: "Built on proven automation platforms and LLM APIs with robust error handling.",
    parameters: {
      turnaround: "Basic assistant: 4–6 days · Workflow: 5–7 days · Advanced system: 10–14 days",
      deposit: "50% upfront to configure, balance on live test validation",
      revisions: "Live scenario testing & prompt tuning cycles",
      handoff: "Deployed system, API connections & team video walkthrough",
    },
    startingScopes: [
      {
        name: "Basic Website Assistant (Starter)",
        price: "₹5,999",
        unit: "one assistant",
        summary: "24/7 intelligent FAQ chatbot trained on your business data.",
        includes: [
          "Trained on website content, FAQs, pricing and services",
          "Custom embeddable chat widget matching your brand",
          "Lead capture flow (collects name, email, query)",
          "Instant email notification alerts on new inquiries",
          "Setup on third-party platform + handover guide",
        ],
      },
      {
        name: "Workflow Pipeline (Standard)",
        price: "₹8,999",
        unit: "up to 3 workflows",
        summary: "Autonomous multi-step pipeline connecting leads to CRM and alerts.",
        includes: [
          "Up to 3 multi-step automated workflows",
          "Lead capture to Google Sheets / CRM sync",
          "Automated email confirmations & WhatsApp/Slack alerts",
          "Error-handling & human fallback notifications",
          "Full testing with real scenarios · Two revision passes",
        ],
      },
      {
        name: "Advanced Assistant & Automation (Premium)",
        price: "₹17,999",
        unit: "complete system",
        summary: "Unified AI assistant and multi-platform automation pipeline.",
        includes: [
          "Website or WhatsApp conversational AI assistant",
          "Custom prompt engineering & multi-document grounding",
          "End-to-end automation connecting forms, sheets, CRM & notifications",
          "Lead qualification & calendar booking integration",
          "30 days post-launch support & tuning window",
        ],
      },
    ],
  },
};

// Aliases for legacy slug lookups
pricingData["video-editing"] = pricingData["video-production"];
pricingData["ai-automation"] = pricingData["ai-solutions-automation"];
pricingData["ai-chatbots"] = pricingData["ai-solutions-automation"];
