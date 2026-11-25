/**
 * ARCHE CREATIVE STUDIOS — SERVICE DETAILS DATA
 *
 * Detailed editorial and conversion content for all 4 core verticals:
 * 01 · Video Editing
 * 02 · Pitch Decks & Storytelling
 * 03 · Web Development
 * 04 · AI Automation
 *
 * All rates, turnaround times, and deliverables are 100% grounded in
 * Arché's official service catalog and pricing definitions.
 */

export interface DeliverableItem {
  name: string;
  detail: string;
}

export interface OutcomeItem {
  n: "01" | "02" | "03";
  title: string;
  desc: string;
}

export interface PricingTier {
  id: string;
  name: string;
  tagline: string;
  price: string;
  unit: string;
  popular?: boolean;
  turnaround: string;
  revisions: string;
  deliverables: string[];
}

export interface ServiceDetail {
  slug: "video-editing" | "pitch-decks" | "web-development" | "ai-automation" | string;
  aliasSlugs?: string[];
  n: "01" | "02" | "03" | "04";
  shortName: string;
  title: string;
  categoryTag: string;
  eyebrow: string;
  heroHeadline1: string;
  heroHeadline2: string;
  valuePromise: string;
  stageBadge: string;
  problemStatement: {
    leadIn: string;
    leadWords: string[];
    bodyParagraphs: string[];
  };
  whatsIncludedCard: {
    title: string;
    startingAt: string;
    unit: string;
    summary: string;
    deliverables: DeliverableItem[];
  };
  outcomes: OutcomeItem[];
  qualifier: {
    headlineLead: string;
    headlineAccent: string;
    leadIn: string;
    checklist: string[];
  };
  tierComparison: {
    sectionHeadline: string;
    sectionSubtitle: string;
    tiers: PricingTier[];
    note: string;
  };
  faqs: {
    q: string;
    a: string;
  }[];
  crossLinks: {
    slug: string;
    n: string;
    title: string;
    tagline: string;
    startingAt: string;
  }[];
}

export const SERVICE_DETAILS: Record<string, ServiceDetail> = {
  "video-editing": {
    slug: "video-editing",
    aliasSlugs: ["video-production"],
    n: "01",
    shortName: "Video Editing",
    title: "Video Production & Editing",
    categoryTag: "CREATIVE & FILM",
    eyebrow: "SERVICE 01 · VIDEO PRODUCTION & EDITING",
    heroHeadline1: "Raw footage transformed into",
    heroHeadline2: "high-retention visual stories.",
    valuePromise:
      "From high-velocity social reels to cinema long-form narratives, we cut, grade, and master every frame to hold human attention and accelerate brand reach.",
    stageBadge: "BROADCAST EDITORIAL CONSOLE · 60FPS TIMELINE",
    problemStatement: {
      leadIn: "The cost of mediocre video:",
      leadWords: [
        "Most", "brands", "lose", "65%", "of", "viewers", "in", "the", "first",
        "three", "seconds.", "Shaky", "pacing,", "generic", "captions,", "and",
        "flat", "color", "turn", "expensive", "production", "into", "wasted",
        "impressions."
      ],
      bodyParagraphs: [
        "In modern algorithms, viewer retention is the single decisive ranking signal. When video pacing drags or sound design lacks punch, viewers swipe away before your value proposition is ever delivered.",
        "Arché approaches video editing as behavioral engineering. We combine sub-frame rhythmic cuts, dynamic typographic emphasis, cinema color grading, and multi-layered spatial audio to engineer videos that demand completion and drive direct action."
      ],
    },
    whatsIncludedCard: {
      title: "What's Included",
      startingAt: "₹799",
      unit: "per video",
      summary: "End-to-end editorial pipeline engineered for conversion and retention.",
      deliverables: [
        { name: "Pacing & Sub-Frame Cuts", detail: "Dead-air removal, dynamic hook structure, and narrative momentum" },
        { name: "Kinetic Styled Captions", detail: "Animated on-brand typography, word-by-word highlights & icon callouts" },
        { name: "Cinematic Color Grade", detail: "LOG/Rec.709 conversion, skin tone balancing & filmic contrast curves" },
        { name: "Multi-Track Sound Design", detail: "Audio leveling, background music ducking, and punchy SFX accents" },
        { name: "Multi-Platform Mastering", detail: "Optimized 9:16 vertical and 16:9 widescreen high-bitrate exports" },
        { name: "Project File Archiving", detail: "Consolidated source files and assets archived for effortless future iterations" },
      ],
    },
    outcomes: [
      {
        n: "01",
        title: "2.4× Higher Viewer Retention",
        desc: "Precision hooks and relentless pacing keep audiences watching past the critical 30-second drop-off curve.",
      },
      {
        n: "02",
        title: "Instantly Recognizable Brand Language",
        desc: "Custom color grades, motion graphics, and typography ensure your videos never look like stock Canva templates.",
      },
      {
        n: "03",
        title: "Predictable Publishing Rhythm",
        desc: "Turnaround within 3–5 working days means your editorial calendar never stalls or loses momentum.",
      },
    ],
    qualifier: {
      headlineLead: "Is this",
      headlineAccent: "right for you?",
      leadIn: "Our video editing suite is specifically designed for businesses and creators who produce:",
      checklist: [
        "High-volume short-form content (Instagram Reels, YouTube Shorts, TikTok) requiring daily or weekly consistency.",
        "Founder-led YouTube shows, podcasts, or keynote lectures that need structure, chaptering, and high production value.",
        "Product launch advertisements or paid video creative where conversion rates and return-on-ad-spend dictate success.",
        "Event highlight films and commercial teasers that demand cinematic storytelling rather than raw footage montages.",
        "Teams with recorded footage in hand who want to outsource the painstaking editing and color-grading pipeline.",
      ],
    },
    tierComparison: {
      sectionHeadline: "Transparent Video Tiers.",
      sectionSubtitle: "Clear INR pricing with zero hidden fees. Pick the scope that fits your publishing goals.",
      tiers: [
        {
          id: "short-basic",
          name: "Short-Form Basic",
          tagline: "Clean cuts & essential flow",
          price: "₹799",
          unit: "per video",
          turnaround: "3 working days",
          revisions: "1 consolidated revision round",
          deliverables: [
            "Final duration up to 30 seconds",
            "Source footage up to 5 minutes",
            "Clean cuts & removal of pauses",
            "Basic transitions & pacing",
            "English captions included",
            "Music placement & audio balancing",
            "Basic colour correction",
            "One vertical 9:16 master export",
          ],
        },
        {
          id: "short-standard",
          name: "Short-Form Standard",
          tagline: "Hook-focused high retention",
          price: "₹1,499",
          unit: "per video",
          popular: true,
          turnaround: "3–4 working days",
          revisions: "2 consolidated revision rounds",
          deliverables: [
            "Final duration up to 60 seconds",
            "Source footage up to 15 minutes",
            "Hook-focused editing & dynamic pacing",
            "Styled English captions & text callouts",
            "B-roll / overlays from supplied assets",
            "Sound effects & stronger audio balance",
            "Colour correction & brand logo/CTA",
            "One vertical 9:16 master export",
          ],
        },
        {
          id: "long-standard",
          name: "Long-Form Standard",
          tagline: "Narrative YouTube / Podcast edit",
          price: "₹4,999",
          unit: "per video",
          turnaround: "5–7 working days",
          revisions: "2 consolidated revision rounds",
          deliverables: [
            "Final duration up to 10 minutes",
            "Source footage up to 60 minutes",
            "Narrative flow & chapter headings",
            "B-roll placement & graphic callouts",
            "Branded intro/outro & visual titles",
            "Dialogue cleanup & full audio balance",
            "Colour grading & skin-tone pass",
            "One 16:9 master export + project archive",
          ],
        },
      ],
      note: "Need monthly retainers? Starter retainer (8 reels/mo) starts at ₹5,999; Growth retainer (12 reels/mo) starts at ₹14,999.",
    },
    faqs: [
      {
        q: "How do we transfer raw video footage to the studio?",
        a: "We provide a secure Google Drive / Dropbox link upon project confirmation. Simply drop your raw camera files, audio tracks, and brand assets directly into your designated studio bucket.",
      },
      {
        q: "What is your turnaround time for short-form vs long-form edits?",
        a: "Short-form reels are delivered within 3–4 working days. Long-form edits (5–10 minutes) require 5–7 working days. If you need priority express delivery (+25% fee), we can deliver within 24–48 hours upon request.",
      },
      {
        q: "How do revision rounds work?",
        a: "Every tier includes 1 or 2 consolidated revision rounds. You review the draft via timestamped Frame.io or Loom notes, and our editors implement all visual, text, and audio adjustments in one clean turn.",
      },
      {
        q: "Can you create custom thumbnails and teaser cuts?",
        a: "Yes. Custom YouTube thumbnails are available for ₹499 per visual, and social teaser cutdowns (under 30s) can be added to any long-form order.",
      },
    ],
    crossLinks: [
      { slug: "pitch-decks", n: "02", title: "Pitch Decks", tagline: "Structured storyline architecture and high-stakes presentation design.", startingAt: "₹3,999" },
      { slug: "web-development", n: "03", title: "Web Development", tagline: "Sub-35ms responsive flagships engineered to convert.", startingAt: "₹5,999" },
      { slug: "ai-automation", n: "04", title: "AI Automation", tagline: "Autonomous multi-app pipelines eliminating repetitive manual ops.", startingAt: "₹7,999" },
    ],
  },

  "web-development": {
    slug: "web-development",
    aliasSlugs: ["web-dev", "websites"],
    n: "03",
    shortName: "Web Development",
    title: "Web Development & Digital Platforms",
    categoryTag: "WEB & PRODUCT",
    eyebrow: "SERVICE 03 · WEB DEVELOPMENT",
    heroHeadline1: "High-performance digital platforms",
    heroHeadline2: "engineered for conversion.",
    valuePromise:
      "We design and develop bespoke, lightning-fast digital experiences that establish unshakeable brand credibility, engage visitors, and convert attention into revenue.",
    stageBadge: "SYNCHRONIZED DUAL-VIEWPORT STAGE · SUB-35MS ENGINE",
    problemStatement: {
      leadIn: "The cost of bloated web architecture:",
      leadWords: [
        "A", "one-second", "delay", "in", "page", "load", "destroys", "7%",
        "of", "conversions.", "Generic", "WordPress", "templates", "and", "heavy",
        "plugins", "leak", "credibility,", "frustrate", "mobile", "visitors,", "and",
        "surrender", "SEO", "rankings."
      ],
      bodyParagraphs: [
        "In 2026, visitors decide whether your business is credible in under 50 milliseconds. When a site stutters, drops frames, shifts layout during scroll, or takes seconds to load on mobile connections, high-value prospects leave and never return.",
        "Arché engineers websites from the ground up using clean React, TypeScript, and modern CSS architectures. We build bespoke digital flagships with zero template bloat, buttery 60fps animations, sub-35ms interactions, and direct conversion paths that turn traffic into qualified pipeline."
      ],
    },
    whatsIncludedCard: {
      title: "What's Included",
      startingAt: "₹5,999",
      unit: "one-time",
      summary: "Modern frontend engineering with bespoke design and zero bloat.",
      deliverables: [
        { name: "Bespoke Visual Architecture", detail: "Tailored UI design reflecting your exact typography, palette & brand voice" },
        { name: "Sub-35ms Performance", detail: "Zero-bloat code, optimized bundle sizes, and instant initial page paint" },
        { name: "Mobile-Native Fluidity", detail: "Perfect 100svh framing, gesture handling, and touch-optimized ergonomics" },
        { name: "Interactive Conversion Funnels", detail: "Enquiry forms, WhatsApp click-to-chat, and custom lead routing" },
        { name: "Technical SEO & Schema", detail: "Structured metadata, OpenGraph cards, semantic tags, and sitemap generation" },
        { name: "Deployment & Production QA", detail: "DNS setup, SSL certificate configuration, and complete deployment handover" },
      ],
    },
    outcomes: [
      {
        n: "01",
        title: "Sub-35ms First Contentful Paint",
        desc: "Pages load instantaneously across desktop and 4G mobile, keeping bounce rates under 20%.",
      },
      {
        n: "02",
        title: "3.2× Lift in Visitor Inquiries",
        desc: "Frictionless forms, sticky CTAs, and persuasive narrative hierarchy guide visitors directly to action.",
      },
      {
        n: "03",
        title: "Zero Ongoing Plugin Headaches",
        desc: "Clean static builds mean zero broken WordPress plugins, security vulnerabilities, or unexpected downtime.",
      },
    ],
    qualifier: {
      headlineLead: "Is this",
      headlineAccent: "right for you?",
      leadIn: "Our web development practice is specifically tailored for founders and brands who:",
      checklist: [
        "Have outgrown standard page builders (Wix, Squarespace, generic WordPress) and need a bespoke, world-class digital presence.",
        "Are launching a new venture, product, or campaign and need a high-converting landing page deployed in days.",
        "Require responsive fluidity with 60fps physics, fluid typography, and custom interactive components.",
        "Want seamless integration with CRM systems, WhatsApp, calendar booking engines, or custom payment gateways.",
        "Care deeply about design engineering, brand authority, and technical speed that outperforms competitors.",
      ],
    },
    tierComparison: {
      sectionHeadline: "Transparent Web Development Tiers.",
      sectionSubtitle: "One-time investment packages with clear scope and guaranteed turnaround times.",
      tiers: [
        {
          id: "web-basic",
          name: "Basic — Launch",
          tagline: "Single-page campaign or portfolio",
          price: "₹5,999",
          unit: "one-time",
          turnaround: "5–7 working days",
          revisions: "1 consolidated revision round",
          deliverables: [
            "One page with up to 5 custom sections",
            "Clean branded layout & modern aesthetics",
            "Mobile-responsive implementation",
            "Interactive contact / enquiry form",
            "WhatsApp click-to-chat integration",
            "Social links & supplied brand assets",
            "Basic page title & SEO meta tags",
            "Deployment to client-provided hosting",
          ],
        },
        {
          id: "web-standard",
          name: "Standard — Business",
          tagline: "Multi-page digital presence",
          price: "₹12,999",
          unit: "one-time",
          popular: true,
          turnaround: "10–15 working days",
          revisions: "2 consolidated revision rounds",
          deliverables: [
            "Up to 5 custom responsive pages",
            "Customised visual direction aligned with brand",
            "Home, About, Services, Contact architecture",
            "Enquiry form, WhatsApp link & map embed",
            "Basic on-page SEO setup & meta",
            "Analytics setup using client account",
            "Full deployment & pre-launch QA checks",
            "30-day post-launch bug warranty",
          ],
        },
        {
          id: "web-premium",
          name: "Premium — Growth",
          tagline: "Full platform with CMS & integrations",
          price: "₹24,999",
          unit: "one-time",
          turnaround: "15–25 working days",
          revisions: "2 consolidated revision rounds",
          deliverables: [
            "Up to 8 responsive custom pages",
            "Tailored page layouts & interactive components",
            "CMS / blog setup for easy client updates",
            "Lead capture & 1 standard CRM integration",
            "Technical SEO & image performance optimization",
            "Analytics, launch checks & complete handover",
            "Interactive micro-animations & Lenis scroll",
            "60-day post-launch support warranty",
          ],
        },
      ],
      note: "Need ongoing maintenance? Essential Care starts at ₹999/mo; Managed Care with active security and content updates is ₹2,499/mo.",
    },
    faqs: [
      {
        q: "What tech stack does Arché use for web development?",
        a: "We engineer primarily in React, TypeScript, Tailwind CSS, and Vite/Next.js, coupled with GSAP for buttery motion. For clients requiring CMS editing, we integrate headless solutions like Sanity, Strapi, or modern WordPress APIs.",
      },
      {
        q: "Do I need to buy domain and hosting before starting?",
        a: "We can guide you through purchasing a domain from Cloudflare/Namecheap and recommend lightning-fast hosting providers (Vercel, Netlify, or Hostinger). We handle all technical DNS and SSL configurations during launch.",
      },
      {
        q: "Is the website optimized for mobile phones?",
        a: "Every website we build is mobile-first. We rigorously test across real iOS and Android devices to guarantee fluid gesture handling, zero horizontal overflow, and tactile touch targets.",
      },
      {
        q: "Can you help write the copy and supply imagery?",
        a: "Yes. We offer website copywriting add-ons (from ₹1,000 per page) and can source and license premium typography, 3D assets, and high-resolution commercial photography.",
      },
    ],
    crossLinks: [
      { slug: "video-editing", n: "01", title: "Video Production", tagline: "Raw footage transformed into high-retention visual stories.", startingAt: "₹799" },
      { slug: "pitch-decks", n: "02", title: "Pitch Decks", tagline: "Structured storyline architecture and high-stakes presentation design.", startingAt: "₹3,999" },
      { slug: "ai-automation", n: "04", title: "AI Automation", tagline: "Autonomous multi-app pipelines eliminating repetitive manual ops.", startingAt: "₹7,999" },
    ],
  },

  "pitch-decks": {
    slug: "pitch-decks",
    aliasSlugs: ["pitch-decks-storytelling", "ai-chatbots", "pitch-deck", "storytelling"],
    n: "02",
    shortName: "Pitch Decks",
    title: "Pitch Decks & Storytelling",
    categoryTag: "STORY & INVESTOR DECKS",
    eyebrow: "SERVICE 02 · PITCH DECKS",
    heroHeadline1: "Investor-ready narratives",
    heroHeadline2: "engineered for conversion.",
    valuePromise:
      "We transform complex business models, deep tech, and ambitious visions into structured investor decks that command conviction and accelerate closing rounds.",
    stageBadge: "NARRATIVE SLIDE ARCHITECT & 16:9 MASTER DECK STAGE",
    problemStatement: {
      leadIn: "The cost of a weak narrative:",
      leadWords: [
        "Investors", "spend", "an", "average", "of", "2", "minutes", "and", "40",
        "seconds", "on", "a", "deck.", "Chaotic", "storylines,", "dense", "text",
        "walls,", "and", "amateur", "graphics", "kill", "high-conviction", "deals",
        "before", "the", "first", "meeting."
      ],
      bodyParagraphs: [
        "Great companies routinely get passed over because their pitch deck reads like a fragmented operational manual instead of a high-conviction investment thesis. When problem framing, market sizing, and unit economics are buried, investor momentum evaporates.",
        "Arché engineers pitch decks from the narrative core out. We restructure your thesis into an undeniable story arc, pair it with custom infographics and financial data visualization, and package it into an investor-grade 16:9 master deck ready for venture partners and boardroom keynotes.",
      ],
    },
    whatsIncludedCard: {
      title: "What's Included",
      startingAt: "₹3,999",
      unit: "per deck",
      summary: "Structured storyline architecture and custom presentation design tailored for your raise.",
      deliverables: [
        { name: "Storyline Flow & Thesis Refinement", detail: "Problem-solution-market narrative arc mapped to investor psychology" },
        { name: "Bespoke Slide Architecture (16:9)", detail: "Custom visual hierarchy, typography tokens & high-contrast layout" },
        { name: "Custom Data Charts & Infographics", detail: "Traction curves, market sizing TAM/SAM/SOM, and revenue velocity graphics" },
        { name: "Editable Master Files (PPTX + PDF)", detail: "Full source presentation in PowerPoint / Google Slides + pitch-ready PDF" },
        { name: "Executive 1-Pager Pitch Sheet", detail: "Concise investor summary sheet for fast email follow-ups" },
        { name: "Structured Revision Rounds", detail: "Iterative feedback integration on narrative pacing and slide polish" },
      ],
    },
    outcomes: [
      {
        n: "01",
        title: "Instant Narrative Clarity",
        desc: "Investors grasp your unfair advantage and market economics in under 90 seconds.",
      },
      {
        n: "02",
        title: "Institutional Visual Polish",
        desc: "Bespoke typography, 16:9 layout framing, and custom charts elevate your valuation credibility.",
      },
      {
        n: "03",
        title: "Accelerated Fundraising Velocity",
        desc: "Clear storylines remove partner friction, shortening close times from months to weeks.",
      },
    ],
    qualifier: {
      headlineLead: "Is this",
      headlineAccent: "right for you?",
      leadIn: "Our Pitch Deck & Storytelling sprint is designed for founders and operators preparing to:",
      checklist: [
        "Raise Pre-Seed, Seed, or Series-A capital from institutional VCs and angel syndicates.",
        "Pitch enterprise partners or commercial clients on 7-figure contract pilots.",
        "Redesign cluttered draft slides into a clean, compelling 16:9 master presentation.",
        "Clarify complex technical or AI products into intuitive visual metaphors.",
        "Deliver high-stakes conference keynotes, demo day pitches, or board updates.",
      ],
    },
    tierComparison: {
      sectionHeadline: "Transparent Pitch Deck Tiers.",
      sectionSubtitle: "Clear scope, fixed turnaround, and fully editable deliverables. Grounded in our real published rates.",
      tiers: [
        {
          id: "deck-basic",
          name: "Basic — Clear Deck",
          tagline: "Essential pitch deck redesign",
          price: "₹3,999",
          unit: "per deck",
          turnaround: "4–5 working days",
          revisions: "1 consolidated revision round",
          deliverables: [
            "Up to 8 structured slides",
            "Slide visual redesign from your draft/notes",
            "Standard charts & diagram styling",
            "Typography & color hierarchy",
            "Presentation-ready PDF",
            "Editable PowerPoint (PPTX) source",
            "1 consolidated revision round",
          ],
        },
        {
          id: "deck-standard",
          name: "Standard — Story Deck",
          tagline: "Complete narrative arc & custom graphics",
          price: "₹7,999",
          unit: "per deck",
          popular: true,
          turnaround: "6–8 working days",
          revisions: "2 consolidated revision rounds",
          deliverables: [
            "Up to 12 structured slides",
            "Storyline flow & content refinement",
            "Problem-solution framing & narrative arc",
            "Bespoke data charts, diagrams & visual metaphors",
            "Visual redesign of existing slides or draft notes",
            "Editable PPTX + pitch-ready PDF",
            "Two structured revision rounds",
          ],
        },
        {
          id: "deck-premium",
          name: "Premium — Signature Deck",
          tagline: "Comprehensive institutional pitch package",
          price: "₹14,999",
          unit: "per deck",
          turnaround: "8–12 working days",
          revisions: "2 consolidated revision rounds",
          deliverables: [
            "Up to 18 slides with narrative architecture",
            "Deep storyline structuring & thesis refinement",
            "Custom visual diagrams, financial layout & traction slides",
            "Problem-solution framing & TAM/SAM/SOM market sizing graphics",
            "Includes 1-page executive pitch summary (PDF)",
            "Two structured revision rounds",
            "Fully editable PPTX master + pitch PDF",
          ],
        },
      ],
      note: "Additional slides can be added to any package (₹600–₹1,000 per slide). Rush delivery available on request.",
    },
    faqs: [
      {
        q: "What do I need to provide before kickoff?",
        a: "You can share an existing slide deck, a Notion doc, raw bullet points, or just your website. We distill whatever material you have into a cohesive story arc.",
      },
      {
        q: "Will I be able to edit the slides after delivery?",
        a: "Yes. You receive 100% editable source files in Microsoft PowerPoint (.pptx) or Google Slides, using standard system fonts and master layout templates so you can tweak numbers anytime.",
      },
      {
        q: "Do you write the copy or just design the visuals?",
        a: "Both. We refine your narrative structure, sharpen headlines, and edit content for clarity and brevity while engineering the visual design and data infographics.",
      },
      {
        q: "What is your turnaround time?",
        a: "Clear Decks take 4–5 working days, Story Decks take 6–8 working days, and Signature Decks take 8–12 working days. Express turnaround is available when deadlines cannot slide.",
      },
    ],
    crossLinks: [
      { slug: "video-editing", n: "01", title: "Video Production", tagline: "Raw footage transformed into high-retention visual stories.", startingAt: "₹799" },
      { slug: "web-development", n: "03", title: "Web Development", tagline: "Sub-35ms responsive flagships engineered to convert.", startingAt: "₹5,999" },
      { slug: "ai-automation", n: "04", title: "AI Automation", tagline: "Autonomous multi-app pipelines eliminating repetitive manual ops.", startingAt: "₹7,999" },
    ],
  },

  "ai-automation": {
    slug: "ai-automation",
    aliasSlugs: ["ai-solutions-automation"],
    n: "04",
    shortName: "AI Automation",
    title: "AI Automation & Operational Pipelines",
    categoryTag: "OPERATIONS & AUTOMATION",
    eyebrow: "SERVICE 04 · AI AUTOMATION",
    heroHeadline1: "Make your business smarter.",
    heroHeadline2: "Automate what slows you down.",
    valuePromise:
      "We design and build autonomous multi-app pipelines that eliminate repetitive copy-pasting, synchronize CRMs, extract data from documents, and scale your operational velocity.",
    stageBadge: "MANUAL VS AUTOMATED WORKFLOW HUB VISUALIZER",
    problemStatement: {
      leadIn: "The cost of manual repetitive operations:",
      leadWords: [
        "Knowledge", "workers", "waste", "up", "to", "40%", "of", "their", "time",
        "on", "manual", "data", "entry,", "switching", "between", "apps,", "and",
        "chasing", "status", "updates.", "Human", "fatigue", "causes", "errors,",
        "delays,", "and", "burnout."
      ],
      bodyParagraphs: [
        "Every time a team member copies contact information from an email into a spreadsheet, manually messages a prospect on WhatsApp, or pastes invoice data into an accounting system, your business loses time, money, and momentum.",
        "Arché designs robust, autonomous automation pipelines connecting your existing software stack (Gmail, WhatsApp, HubSpot, Notion, Slack, Google Sheets). We turn disjointed manual chores into background systems that execute instantly with 100% precision."
      ],
    },
    whatsIncludedCard: {
      title: "What's Included",
      startingAt: "₹7,999",
      unit: "one-time",
      summary: "End-to-end workflow architecture eliminating operational bottlenecks.",
      deliverables: [
        { name: "Workflow Architecture Audit", detail: "Mapping current manual friction points and blueprinting the automated pipeline" },
        { name: "Multi-Tool API Connections", detail: "Reliable webhook integrations across CRM, Slack, Sheets, WhatsApp & Email" },
        { name: "Data Transformation & Normalization", detail: "Automated cleanup, deduplication, and schema validation" },
        { name: "Human-in-the-Loop Approval Steps", detail: "Slack/email approval buttons for high-stakes actions before execution" },
        { name: "Fail-Safe Alerting & Error Logging", detail: "Instant notifications if a third-party API disconnects or changes" },
        { name: "Operational SOPs & Video Guide", detail: "Step-by-step Loom walkthrough and documentation for your operations team" },
      ],
    },
    outcomes: [
      {
        n: "01",
        title: "20+ Hours Reclaimed Per Week",
        desc: "Automate tedious data handoffs so your team can focus entirely on high-leverage client work.",
      },
      {
        n: "02",
        title: "Zero Manual Copy-Paste Errors",
        desc: "Automated schema validation guarantees that customer details and numbers never get corrupted.",
      },
      {
        n: "03",
        title: "Sub-Second Inbound Lead Routing",
        desc: "New leads are instantly qualified, enriched, logged in your CRM, and assigned to the right owner.",
      },
    ],
    qualifier: {
      headlineLead: "Is this",
      headlineAccent: "right for you?",
      leadIn: "Our automation engineering delivers the highest return for companies that:",
      checklist: [
        "Manage high inbound volume and lose track of leads between email, WhatsApp, and spreadsheets.",
        "Manually create invoices, send follow-up reminders, or re-enter data across multiple internal software tools.",
        "Want to connect WhatsApp business messaging to their CRM or project management system.",
        "Spend hours every week parsing PDF documents, purchase orders, or reports into tabular formats.",
        "Need reliable operational backbones that run 24/7 without requiring new full-time administrative hires.",
      ],
    },
    tierComparison: {
      sectionHeadline: "Transparent Automation Tiers.",
      sectionSubtitle: "One-time build fees with clean ownership. You own your accounts, workflows, and data.",
      tiers: [
        {
          id: "auto-basic",
          name: "Basic — Single Flow",
          tagline: "One foundational workflow automation",
          price: "₹7,999",
          unit: "one-time",
          turnaround: "5–8 working days",
          revisions: "1 consolidated revision round",
          deliverables: [
            "One automated business workflow",
            "One trigger & one destination channel",
            "E.g., Inbound Email → Google Sheet / CRM record",
            "Basic data validation & formatting",
            "Error alert notification to your email",
            "Testing with sample historical data",
            "Live handover walkthrough & documentation",
          ],
        },
        {
          id: "auto-standard",
          name: "Standard — Connected Ops",
          tagline: "Multi-app pipeline with validation",
          price: "₹19,999",
          unit: "one-time",
          popular: true,
          turnaround: "10–15 working days",
          revisions: "2 consolidated revision rounds",
          deliverables: [
            "Up to 2 connected multi-app workflows",
            "Lead capture, qualification & CRM pipeline stage update",
            "Up to 2 standard integrations (CRM, Slack, WhatsApp, Sheets)",
            "Automated deduplication & lead enrichment",
            "Human approval step before sending sensitive communications",
            "Error notification & execution logging channel",
            "Comprehensive team SOP walkthrough & video guide",
          ],
        },
        {
          id: "auto-premium",
          name: "Premium — Workflow Suite",
          tagline: "Complete automated operational backbone",
          price: "₹39,999",
          unit: "starting from",
          turnaround: "3–5 weeks",
          revisions: "2 consolidated revision rounds",
          deliverables: [
            "Up to 3 complex multi-step automated operational pipelines",
            "AI-powered document extraction / parsing (PDF/invoices)",
            "Multi-tool API integrations with custom webhooks",
            "Human-in-the-loop review queues and staging flows",
            "Automated WhatsApp / Email reminder sequences",
            "Comprehensive error handling & telemetry channel",
            "Complete technical documentation & staff handover",
          ],
        },
      ],
      note: "Client uses their own Make.com / n8n / Zapier accounts (free or entry tiers are typically sufficient).",
    },
    faqs: [
      {
        q: "What tools do you use to build automations?",
        a: "We specialize in Make.com, n8n (self-hosted or cloud), Zapier, and custom Node.js / Python serverless micro-services when proprietary API logic or heavy document parsing is required.",
      },
      {
        q: "Do I have to pay ongoing fees to Arché for the automations?",
        a: "No. All setup is built inside your own automation account. You own the workflows 100%. If you ever need adjustments or new flows, you can hire us on a per-project basis or opt for our Managed Care retainer.",
      },
      {
        q: "What happens if a third-party tool changes its API or goes down?",
        a: "We build all automations with error interceptors and fallback branches. If an external service is temporarily unreachable, the automation queues the payload and alerts your team via Slack or email rather than silently failing.",
      },
      {
        q: "Can you automate WhatsApp messages directly?",
        a: "Yes. We work with official WhatsApp Cloud API and providers like Wati or Interakt to trigger verified transactional notifications, reminders, and two-way qualification chats.",
      },
    ],
    crossLinks: [
      { slug: "video-editing", n: "01", title: "Video Production", tagline: "Raw footage transformed into high-retention visual stories.", startingAt: "₹799" },
      { slug: "pitch-decks", n: "02", title: "Pitch Decks", tagline: "Structured storyline architecture and high-stakes presentation design.", startingAt: "₹3,999" },
      { slug: "web-development", n: "03", title: "Web Development", tagline: "Sub-35ms responsive flagships engineered to convert.", startingAt: "₹5,999" },
    ],
  },
};

export function getServiceDetail(slug: string): ServiceDetail | undefined {
  if (slug === "ai-chatbots" || slug === "pitch-decks-storytelling" || slug === "pitch-deck" || slug === "storytelling") {
    return SERVICE_DETAILS["pitch-decks"];
  }
  if (SERVICE_DETAILS[slug]) return SERVICE_DETAILS[slug];
  for (const key of Object.keys(SERVICE_DETAILS)) {
    const item = SERVICE_DETAILS[key];
    if (item.aliasSlugs && item.aliasSlugs.includes(slug)) {
      return item;
    }
  }
  return undefined;
}
