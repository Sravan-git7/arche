/**
 * ============================================================================
 * ARCHE CREATIVE STUDIOS — CENTRAL SERVICE & PRICING CONFIGURATION
 * ============================================================================
 *
 * HOW TO UPDATE PRICING, PACKAGES OR SERVICES:
 * - Change prices, inclusions or turnarounds in the `servicesData` array below.
 * - All components (landing cards, service detail pages, pricing tables, modals,
 *   and inquiry prefill selectors) derive their content directly from this single file.
 * - Downloadable PDF links refer to files stored in `/downloads/` under `public/downloads/`.
 * ============================================================================
 */

export interface PackageItem {
  id: string;
  name: string;
  tagline?: string;
  price: string;
  unit: "per video" | "per month" | "per deck" | "one-time" | "starting from";
  popular?: boolean;
  summary: string;
  turnaround?: string;
  revisions?: string;
  features: string[];
}

export interface PackageGroup {
  groupTitle: string;
  groupSubtitle?: string;
  packages: PackageItem[];
}

export interface SpecialistServiceItem {
  name: string;
  price: string;
  description?: string;
}

export interface AddOnItem {
  name: string;
  price: string;
}

export interface CarePlanItem {
  name: string;
  price: string;
  unit: string;
  summary: string;
  features: string[];
}

export interface SpecialistDeepDive {
  title: string;
  purpose: string;
  elements: string[];
}

export interface ServiceData {
  slug: string;
  legacySlugs?: string[];
  n: string;
  title: string;
  short: string;
  headline: string;
  tagline: string;
  description: string;
  startingPrice: string;
  startingPriceLabel: string;
  pdfFilename: string;
  pdfLabel: string;
  deliveryExamples: string[];
  servicesOffered: string[];
  packageGroups: PackageGroup[];
  specialistServices?: SpecialistServiceItem[];
  specialistDeepDives?: SpecialistDeepDive[];
  addOns?: AddOnItem[];
  carePlans?: CarePlanItem[];
  disclaimer: string;
  seo: {
    title: string;
    desc: string;
  };
}

export const STUDIO_INFO = {
  name: "ARCHE CREATIVE STUDIOS",
  tagline: "TECHNOLOGY MEETS CREATIVITY",
  websiteUrl: "www.archecreativestudios.in",
  websiteHref: "https://www.archecreativestudios.in",
  email: "archecreativestudios@gmail.com",
  phone: "+91 7995937536",
  phoneHref: "tel:+917995937536",
  whatsappHref: "https://wa.me/917995937536",
  completeCataloguePdf: "ARCHE_Creative_Studios_Complete_Service_Catalogue.pdf",
  generalDisclaimer:
    "All prices are proposed ARCHE launch rates in INR. Final project pricing depends on the confirmed scope, deliverables, required integrations and project complexity. Any additional requirements will be discussed and quoted before work begins.",
};

export const servicesData: ServiceData[] = [
  // --------------------------------------------------------------------------
  // 01. VIDEO PRODUCTION & EDITING
  // --------------------------------------------------------------------------
  {
    slug: "video-production",
    legacySlugs: ["video-editing"],
    n: "01",
    title: "Video Production & Editing",
    short: "Video",
    headline: "Every Frame Has a Story. Let's Make It Worth Watching.",
    tagline: "Raw footage transformed into high-retention visual stories.",
    description:
      "We transform raw footage and creative ideas into engaging visual experiences. From short-form social content to long-form storytelling, promotional videos and motion graphics, ARCHE helps brands and creators communicate their stories with clarity, creativity and impact.",
    startingPrice: "₹799",
    startingPriceLabel: "Starting from ₹799 per video",
    pdfFilename: "ARCHE_Creative_Studios_Video_Editing_Service_Guide.pdf",
    pdfLabel: "Download Video Editing & Production Guide",
    deliveryExamples: [
      "High-retention Instagram Reels & YouTube Shorts",
      "Narrative long-form YouTube video & podcast editing",
      "Branded motion graphics, kinetic captions & color grading",
      "Event highlight reels and promotional advertisements",
    ],
    servicesOffered: [
      "Instagram Reels and YouTube Shorts",
      "Short-form video editing",
      "Long-form YouTube video editing",
      "Podcast and interview editing",
      "Event highlight films",
      "Promotional and advertisement videos",
      "Motion-graphics explainers",
      "On-location video production as a separately scoped service",
    ],
    packageGroups: [
      {
        groupTitle: "Short-Form Video Packages",
        groupSubtitle: "Engineered for maximum viewer retention, algorithmic reach and platform pacing.",
        packages: [
          {
            id: "short-basic",
            name: "Basic",
            price: "₹799",
            unit: "per video",
            summary: "Clean cuts and essential flow for punchy social posts.",
            turnaround: "3 working days",
            revisions: "1 consolidated revision round",
            features: [
              "Final duration up to 30 seconds",
              "Source footage up to 5 minutes",
              "Clean cuts and removal of pauses",
              "Basic transitions and pacing",
              "English captions included",
              "Music placement and basic audio balancing",
              "Basic colour correction",
              "One vertical 9:16 export",
            ],
          },
          {
            id: "short-standard",
            name: "Standard",
            popular: true,
            price: "₹1,499",
            unit: "per video",
            summary: "Hook-focused editing with styled overlays and sound design.",
            turnaround: "3–4 working days",
            revisions: "2 consolidated revision rounds",
            features: [
              "Final duration up to 60 seconds",
              "Source footage up to 15 minutes",
              "Hook-focused editing and tighter pacing",
              "Styled English captions and text callouts",
              "B-roll or overlays from supplied assets",
              "Sound effects and stronger audio balance",
              "Colour correction and brand logo/CTA",
              "One vertical 9:16 export",
            ],
          },
          {
            id: "short-premium",
            name: "Premium",
            price: "₹2,499",
            unit: "per video",
            summary: "Kinetic typography, custom flow and master cinematic polish.",
            turnaround: "4–5 working days",
            revisions: "2 consolidated revision rounds",
            features: [
              "Final duration up to 90 seconds",
              "Source footage up to 30 minutes",
              "Story-led editing with custom hook and flow",
              "Kinetic captions and custom motion titles",
              "Advanced transitions and visual emphasis",
              "Detailed sound design and colour grading",
              "Branded end card / CTA",
              "Two aspect-ratio exports (e.g. 9:16 & 1:1 or 16:9)",
            ],
          },
        ],
      },
      {
        groupTitle: "Long-Form Video Packages",
        groupSubtitle: "Paced for YouTube, podcasts, talks and detailed narrative storytelling.",
        packages: [
          {
            id: "long-basic",
            name: "Basic",
            price: "₹2,499",
            unit: "per video",
            summary: "Clean assembly and voice clean-up for talks and presentations.",
            turnaround: "4–5 working days",
            revisions: "1 consolidated revision round",
            features: [
              "Final duration up to 5 minutes",
              "Source footage up to 30 minutes",
              "Clean assembly and removal of pauses",
              "Basic titles and lower thirds",
              "Music placement and dialogue clean-up",
              "Basic colour correction",
              "One 16:9 export",
            ],
          },
          {
            id: "long-standard",
            name: "Standard",
            popular: true,
            price: "₹4,999",
            unit: "per video",
            summary: "Structured chaptering, B-roll integration and branded packaging.",
            turnaround: "5–7 working days",
            revisions: "2 consolidated revision rounds",
            features: [
              "Final duration up to 10 minutes",
              "Source footage up to 60 minutes",
              "Improved narrative flow and pacing",
              "B-roll placement and chapter headings",
              "Branded intro/outro and titles",
              "Audio balancing and colour correction",
              "One 16:9 export",
            ],
          },
          {
            id: "long-premium",
            name: "Premium",
            price: "₹8,999",
            unit: "per video",
            summary: "Broadcast-grade storytelling with motion graphics, thumbnail and teaser clips.",
            turnaround: "7–10 working days",
            revisions: "2 consolidated revision rounds",
            features: [
              "Final duration up to 15 minutes",
              "Source footage up to 90 minutes",
              "Story-first editing and detailed pacing",
              "Custom motion graphics and visual callouts",
              "Sound design and detailed colour grading",
              "Branded end screen + 1 custom thumbnail",
              "Two short teaser clips (up to 30s each)",
            ],
          },
        ],
      },
      {
        groupTitle: "Monthly Content Retainers",
        groupSubtitle: "Predictable monthly publishing pipeline with priority turnaround and brand alignment.",
        packages: [
          {
            id: "month-starter",
            name: "Starter Retainer",
            price: "₹5,999",
            unit: "per month",
            summary: "8 consistent short-form videos per month.",
            features: [
              "8 Basic reels per month",
              "Up to 45 seconds each",
              "Clean edits and English captions",
              "Music and basic colour correction",
              "One 9:16 export per reel",
              "Scheduled batch delivery",
            ],
          },
          {
            id: "month-growth",
            name: "Growth Retainer",
            popular: true,
            price: "₹14,999",
            unit: "per month",
            summary: "12 hook-led videos tailored for growing brand visibility.",
            features: [
              "12 Standard reels per month",
              "Up to 60 seconds each",
              "Hook-led edits and styled captions",
              "B-roll/overlays from supplied assets",
              "Sound design and brand CTA",
              "Scheduled 3-per-week delivery",
            ],
          },
          {
            id: "month-partner",
            name: "Studio Partner Retainer",
            price: "₹25,999",
            unit: "per month",
            summary: "Full creative partnership with 16 high-impact videos and creative direction.",
            features: [
              "16 reels: 12 Standard + 4 Premium",
              "Reusable branded visual style",
              "One monthly creative-planning call",
              "Priority batch scheduling",
              "Source archive backup",
            ],
          },
        ],
      },
    ],
    specialistServices: [
      { name: "Single-camera podcast / interview", price: "From ₹2,999", description: "Audio leveling, camera cutaways, intro/outro." },
      { name: "Multi-camera podcast / interview", price: "From ₹5,999", description: "Multi-angle sync, active speaker switching, full sound design." },
      { name: "Event highlight film", price: "From ₹3,999", description: "Cinematic montage, beat-matched music, title overlays." },
      { name: "Promotional / advertisement video", price: "From ₹4,999", description: "Sales-driven narrative, dynamic captions, conversion CTA." },
      { name: "Motion-graphics explainer", price: "From ₹6,999", description: "2D animated explainer, icon animations, typographic flow." },
      { name: "On-location production", price: "Custom Quote", description: "Directorial and camera crew scoping on request." },
    ],
    addOns: [
      { name: "Hook / script direction", price: "From ₹1,499 per video" },
      { name: "Custom thumbnail", price: "₹499 per thumbnail" },
      { name: "Logo / title animation", price: "From ₹999" },
      { name: "Alternate aspect-ratio export", price: "₹299 per version" },
      { name: "Additional revision round", price: "From ₹500 (reels) / ₹1,000 (long-form)" },
      { name: "Priority turnaround (express)", price: "+25% on project fee" },
    ],
    disclaimer:
      "Filming, social media management, publishing, paid advertising, extensive scriptwriting and licensed stock assets are separate unless included in the agreed scope.",
    seo: {
      title: "Video Production & Editing | ARCHE Creative Studios",
      desc: "Editorial video production and editing for social reels, YouTube, podcasts, explainers and commercial ads. Precise pacing, motion graphics and sound polish.",
    },
  },

  // --------------------------------------------------------------------------
  // 02. PITCH DECKS & STORYTELLING
  // --------------------------------------------------------------------------
  {
    slug: "pitch-decks-storytelling",
    legacySlugs: ["pitch-decks", "storytelling"],
    n: "02",
    title: "Pitch Decks & Storytelling",
    short: "Pitch Decks",
    headline: "Don't Just Present an Idea. Make People Believe in It.",
    tagline: "Structured storytelling and high-stakes presentation design.",
    description:
      "We help founders, businesses, professionals and creators transform complex information into compelling presentations. Through structured storytelling, research, visual communication and purposeful slide design, we help every idea communicate its value with clarity and confidence.",
    startingPrice: "₹3,999",
    startingPriceLabel: "Starting from ₹3,999 per deck",
    pdfFilename: "ARCHE_Creative_Studios_Pitch_Deck_Storytelling_Service_Guide.pdf",
    pdfLabel: "Download Pitch Deck & Storytelling Guide",
    deliveryExamples: [
      "Investor pitch decks structured for seed and series funding",
      "Competition & hackathon slide decks that command attention",
      "Sales presentations and corporate business proposals",
      "Keynote, research and executive summary visual decks",
    ],
    servicesOffered: [
      "Startup and investor pitch decks",
      "Hackathon and startup competition presentations",
      "Business proposals and company profiles",
      "Sales and partnership presentations",
      "Research and project presentations",
      "Keynote and educational presentations",
      "Existing presentation redesign",
      "Strategic storytelling and pitch preparation",
    ],
    packageGroups: [
      {
        groupTitle: "Presentation Packages",
        groupSubtitle: "Comprehensive deck architecture, typography, visual hierarchy and narrative pacing.",
        packages: [
          {
            id: "deck-basic",
            name: "Basic — Clear Deck",
            price: "₹3,999",
            unit: "per deck",
            summary: "Clean visual facelift for approved content and structured outlines.",
            turnaround: "4–5 working days",
            revisions: "1 consolidated revision round",
            features: [
              "Up to 8 designed slides",
              "Design based on supplied, approved content",
              "Clean layouts, typography and visual hierarchy",
              "Brand colours, logo and consistent styling",
              "Simple icons, image placement and basic charts",
              "Editable PPTX and presentation-ready PDF",
            ],
          },
          {
            id: "deck-standard",
            name: "Standard — Story Deck",
            popular: true,
            price: "₹7,999",
            unit: "per deck",
            summary: "Storyline alignment, custom diagrams and copy editing for impact.",
            turnaround: "6–8 working days",
            revisions: "2 consolidated revision rounds",
            features: [
              "Up to 12 designed slides",
              "Kick-off brief and audience alignment",
              "Narrative flow and slide-order refinement",
              "Light copy editing for clarity and impact",
              "Custom layouts, diagrams and data visuals from supplied data",
              "Editable PPTX and presentation-ready PDF",
            ],
          },
          {
            id: "deck-premium",
            name: "Premium — Signature Deck",
            price: "₹14,999",
            unit: "per deck",
            summary: "Discovery session, research synthesis, custom infographics and speaker notes.",
            turnaround: "8–12 working days",
            revisions: "2 consolidated revision rounds",
            features: [
              "Up to 18 designed slides",
              "Discovery session and story architecture",
              "Content synthesis from supplied materials",
              "Desk research using up to five public sources",
              "Stronger opening, transitions and audience messaging",
              "Custom diagrams, charts and visual storytelling",
              "Speaker-note outline for key slides",
              "Editable PPTX and presentation-ready PDF",
            ],
          },
        ],
      },
    ],
    specialistDeepDives: [
      {
        title: "Startup & Investor Deck",
        purpose: "Win over angel investors, venture capitalists and accelerators.",
        elements: [
          "Problem statement & validation",
          "Proposed solution & product value",
          "Market size (TAM, SAM, SOM)",
          "Business model & monetization",
          "Traction, metrics & milestones",
          "Go-to-market strategy",
          "Founding team & advisors",
          "Roadmap and the investment ask",
        ],
      },
      {
        title: "Competition & Hackathon Deck",
        purpose: "Deliver maximum punch within tight 3-to-5 minute judging constraints.",
        elements: [
          "Core challenge & user insight",
          "Live demo / prototype flow",
          "Technical feasibility & architecture",
          "Competitive differentiation",
          "Measurable societal/economic impact",
          "Next implementation steps",
        ],
      },
      {
        title: "Business & Sales Deck",
        purpose: "Turn high-value prospects into closed contracts and signed partnerships.",
        elements: [
          "Client pain point & operational cost",
          "Targeted service offer & methodology",
          "Unique value proposition & ROI",
          "Proof points & relevant case evidence",
          "Clear commercial next steps & onboarding",
        ],
      },
      {
        title: "Research & Project Deck",
        purpose: "Communicate dense academic, engineering or corporate discoveries with clarity.",
        elements: [
          "Contextual background",
          "Research question & hypothesis",
          "Methodology & data collection",
          "Key findings & data visualization",
          "Strategic implications & conclusion",
        ],
      },
      {
        title: "Keynote & Educational Deck",
        purpose: "Inspire audiences and transfer knowledge at summits, conferences and workshops.",
        elements: [
          "Opening hook & relatable narrative",
          "Central transformative idea",
          "Illustrated examples & case studies",
          "Memorable audience takeaways",
          "Impactful closing call to action",
        ],
      },
    ],
    addOns: [
      { name: "Existing deck review & critique", price: "₹1,499 per deck" },
      { name: "Additional designed slide", price: "From ₹400 per slide" },
      { name: "Custom infographic / diagram visual", price: "From ₹800 per visual" },
      { name: "Executive summary / one-pager", price: "From ₹1,999" },
      { name: "Speaker notes / talk track", price: "From ₹1,500 per deck" },
      { name: "Pitch practice session (45 mins)", price: "From ₹1,999 per session" },
      { name: "Research expansion (extra public sources)", price: "From ₹2,500" },
      { name: "Priority turnaround", price: "+25% on project fee" },
    ],
    disclaimer:
      "Financial modelling, valuation, formal due diligence, paid research databases and investor introductions are not included.",
    seo: {
      title: "Pitch Decks & Storytelling | ARCHE Creative Studios",
      desc: "Transform ideas into investor-ready presentations and executive slide decks. Custom diagrams, narrative structure, and compelling visual storytelling.",
    },
  },

  // --------------------------------------------------------------------------
  // 03. WEB DEVELOPMENT
  // --------------------------------------------------------------------------
  {
    slug: "web-development",
    legacySlugs: ["web-dev", "websites"],
    n: "03",
    title: "Web Development",
    short: "Web",
    headline: "We Don't Just Build Websites. We Build Digital Experiences.",
    tagline: "High-performance digital platforms engineered for conversion.",
    description:
      "We design and develop responsive, modern and performance-conscious digital experiences that help businesses establish their online presence, communicate their value and connect with customers.",
    startingPrice: "₹5,999",
    startingPriceLabel: "Starting from ₹5,999 one-time",
    pdfFilename: "ARCHE_Creative_Studios_Web_Development_Service_Guide.pdf",
    pdfLabel: "Download Web Development Guide",
    deliveryExamples: [
      "Conversion-focused marketing sites and single-purpose landing pages",
      "Modern e-commerce storefronts on Shopify and WooCommerce",
      "Interactive product platforms, portfolios and custom web applications",
      "Performance-tuned, accessible, SEO-optimized frontend codebases",
    ],
    servicesOffered: [
      "Landing pages and campaign websites",
      "Business and brand websites",
      "Portfolio and personal websites",
      "E-commerce storefronts",
      "Booking and lead-generation websites",
      "Custom web applications and dashboards",
    ],
    packageGroups: [
      {
        groupTitle: "Website Packages",
        groupSubtitle: "Hand-crafted frontend engineering with zero page-builder bloat and instant load times.",
        packages: [
          {
            id: "web-basic",
            name: "Basic — Launch",
            price: "₹5,999",
            unit: "one-time",
            summary: "Single-page campaign or portfolio website deployed rapidly.",
            turnaround: "5–7 working days",
            revisions: "1 consolidated revision round",
            features: [
              "One page with up to five sections",
              "Clean branded layout and modern aesthetics",
              "Mobile-responsive implementation",
              "Interactive contact / enquiry form",
              "WhatsApp click-to-chat integration",
              "Social links and supplied brand assets",
              "Basic page title and meta description",
              "Deployment to client-provided domain/hosting",
            ],
          },
          {
            id: "web-standard",
            name: "Standard — Business",
            popular: true,
            price: "₹12,999",
            unit: "one-time",
            summary: "Multi-page digital presence with custom styling and analytics.",
            turnaround: "10–15 working days",
            revisions: "2 consolidated revision rounds",
            features: [
              "Up to five responsive pages",
              "Customised visual direction aligned with brand",
              "Home, About, Services, Contact architecture",
              "Enquiry form, WhatsApp link and map embed",
              "Basic on-page SEO setup",
              "Analytics setup using client account",
              "Full deployment and pre-launch QA checks",
            ],
          },
          {
            id: "web-premium",
            name: "Premium — Growth",
            price: "₹24,999",
            unit: "one-time",
            summary: "Tailored multi-page platform with CMS, integrations and performance optimization.",
            turnaround: "15–25 working days",
            revisions: "2 consolidated revision rounds",
            features: [
              "Up to eight responsive pages",
              "Tailored page layouts and custom interactive sections",
              "CMS / blog setup for easy client updates",
              "Lead capture and one standard third-party integration",
              "Technical SEO and image/performance optimization",
              "Analytics, launch checks and complete handover",
            ],
          },
        ],
      },
    ],
    specialistServices: [
      {
        name: "E-commerce Starter",
        price: "From ₹34,999",
        description: "Shopify or WooCommerce, catalog structure, up to 25 products, cart & checkout, payment gateway.",
      },
      {
        name: "Booking / Appointment Website",
        price: "From ₹29,999",
        description: "Service pages, enquiry/booking scheduler, calendar sync, confirmation flow.",
      },
      {
        name: "Custom Web App / MVP",
        price: "From ₹49,999",
        description: "Custom user flow, authentication, core dashboard, database storage, cloud deployment.",
      },
    ],
    addOns: [
      { name: "Additional website page", price: "From ₹1,500 per page" },
      { name: "Website copywriting", price: "From ₹1,000 per page" },
      { name: "SEO starter setup", price: "From ₹2,999" },
      { name: "WhatsApp / CRM connection", price: "From ₹3,500" },
      { name: "Payment gateway setup", price: "From ₹4,999" },
      { name: "Extra product upload", price: "From ₹50 per product" },
      { name: "Multilingual setup", price: "From ₹4,999" },
      { name: "Priority turnaround", price: "+25% on project fee" },
    ],
    carePlans: [
      {
        name: "Essential Care",
        price: "₹999",
        unit: "per month",
        summary: "Monthly health checks and routine site maintenance.",
        features: [
          "Monthly update check",
          "Monthly backup where supported",
          "Basic uptime check",
          "Up to 30 minutes of minor text/image changes",
        ],
      },
      {
        name: "Managed Care",
        price: "₹2,499",
        unit: "per month",
        summary: "Active security hygiene, backup monitoring and ongoing content support.",
        features: [
          "Frequent update and backup checks",
          "Basic security hygiene review",
          "Continuous uptime monitoring",
          "Up to two hours of minor content changes monthly",
        ],
      },
    ],
    disclaimer:
      "Domain, hosting, platform subscriptions, paid plugins, themes, payment gateway charges and third-party subscriptions are separate.",
    seo: {
      title: "Web Development Services | ARCHE Creative Studios",
      desc: "Fast, modern, responsive websites and web applications built for conversion. Clean architecture, bespoke UI, and zero page-builder bloat.",
    },
  },

  // --------------------------------------------------------------------------
  // 04. AI SOLUTIONS & AUTOMATION
  // --------------------------------------------------------------------------
  {
    slug: "ai-solutions-automation",
    legacySlugs: ["ai-automation", "ai-chatbots", "ai-solutions"],
    n: "04",
    title: "AI Solutions & Automation",
    short: "AI & Automation",
    headline: "Make Your Business Smarter. Automate What Slows You Down.",
    tagline: "Autonomous workflows and intelligent assistants that solve genuine friction.",
    description:
      "We create practical AI-powered assistants and intelligent automation systems that help businesses improve customer interactions, simplify operations, connect applications and reduce repetitive work.",
    startingPrice: "₹7,999",
    startingPriceLabel: "Starting from ₹7,999 one-time",
    pdfFilename: "ARCHE_Creative_Studios_AI_Solutions_Automation_Service_Guide.pdf",
    pdfLabel: "Download AI Solutions & Automation Guide",
    deliveryExamples: [
      "Custom conversational agents grounded in your documents & website",
      "WhatsApp & omnichannel lead qualification and customer support flows",
      "End-to-end CRM, spreadsheet and multi-app business automations",
      "Intelligent document data extraction and operational triage systems",
    ],
    servicesOffered: [
      "Omnichannel intake flows and website assistants",
      "WhatsApp automation and conversational flows",
      "Workflow and business process automation",
      "Lead management and CRM automation",
      "Booking and reminder automation",
      "AI knowledge assistants",
      "Document extraction and information processing",
      "Custom AI assistants and agents",
      "API and third-party tool integrations",
    ],
    packageGroups: [
      {
        groupTitle: "Core AI & Automation Packages",
        groupSubtitle: "Engineered to eliminate repetitive operational bottlenecks and capture leads around the clock.",
        packages: [
          {
            id: "ai-basic",
            name: "Basic — Starter Assist",
            price: "₹7,999",
            unit: "one-time",
            summary: "Single-channel assistant or foundational workflow automation.",
            turnaround: "5–8 working days",
            revisions: "1 consolidated revision round",
            features: [
              "One website FAQ/lead bot OR one simple workflow",
              "One defined use case and one channel or trigger",
              "Up to 25 approved FAQs or one simple automation flow",
              "One standard destination such as email or Google Sheets",
              "Basic fallback message and lead capture",
              "Functional testing and handover walkthrough",
            ],
          },
          {
            id: "ai-standard",
            name: "Standard — Connected Growth",
            popular: true,
            price: "₹19,999",
            unit: "one-time",
            summary: "Document-grounded assistant with multi-app workflow integrations.",
            turnaround: "10–15 working days",
            revisions: "2 consolidated revision rounds",
            features: [
              "One AI assistant plus up to two workflows/integrations",
              "Website assistant based on up to 15 supplied pages or docs",
              "Lead capture, qualification or follow-up workflow",
              "Up to two standard integrations (e.g. CRM, Slack, Sheets)",
              "Human hand-off path for unresolved or sensitive queries",
              "Testing, basic execution logs and walkthrough",
            ],
          },
          {
            id: "ai-premium",
            name: "Premium — AI Workflow Suite",
            price: "₹39,999",
            unit: "starting from",
            summary: "Comprehensive multi-step automated operational pipeline with approval stages.",
            turnaround: "3–5 weeks",
            revisions: "2 consolidated revision rounds",
            features: [
              "Custom task-focused AI assistant",
              "Up to three standard workflows and three integrations",
              "Agreed knowledge source and fine-tuned guardrails",
              "Approval and human-review steps",
              "Error notifications and alerting",
              "Usage/execution summary where supported",
              "Complete documentation and operator handover",
            ],
          },
        ],
      },
    ],
    specialistServices: [
      { name: "Website FAQ / Lead Chatbot", price: "From ₹7,999", description: "24/7 lead qualification, grounded FAQ answers, instant lead alert." },
      { name: "WhatsApp Automation", price: "From ₹12,999", description: "Interactive menus, conversational flows, catalog lookups." },
      { name: "Lead-to-CRM Workflow", price: "From ₹9,999", description: "Automated enrichment, deduplication, pipeline stage assignment." },
      { name: "Booking & Reminder Flow", price: "From ₹14,999", description: "Calendar syncing, automated WhatsApp/email confirmations and reminders." },
      { name: "AI Knowledge Assistant", price: "From ₹24,999", description: "Internal document search and question answering over SOPs and manuals." },
      { name: "Document Extraction Workflow", price: "From ₹19,999", description: "PDF/invoice parsing, OCR, automated structured database entry." },
      { name: "Custom AI Agent / Tool Workflow", price: "From ₹39,999", description: "Autonomous multi-step actions across internal databases and external APIs." },
    ],
    addOns: [
      { name: "Additional automated workflow", price: "From ₹3,500" },
      { name: "Additional app / tool integration", price: "From ₹2,500" },
      { name: "Knowledge-base preparation & structuring", price: "From ₹4,999" },
      { name: "Extra channel setup (e.g. Telegram / Discord)", price: "From ₹3,500" },
      { name: "Execution telemetry dashboard", price: "From ₹4,999" },
      { name: "Priority scheduling", price: "+25% on project fee" },
    ],
    carePlans: [
      {
        name: "Essential Care",
        price: "₹1,499",
        unit: "per month",
        summary: "Monthly health check and basic error monitoring for one live assistant/flow.",
        features: [
          "Monthly review of one live workflow or assistant",
          "Basic error log check",
          "Up to 30 minutes of minor configuration changes",
        ],
      },
      {
        name: "Managed Care",
        price: "₹3,999",
        unit: "per month",
        summary: "Active monitoring, troubleshooting and adjustments for up to three workflows.",
        features: [
          "Review of up to three workflows",
          "Basic issue troubleshooting",
          "Usage review and optimization",
          "Up to two hours of minor adjustments monthly",
        ],
      },
      {
        name: "Operations Plus",
        price: "₹7,999",
        unit: "per month",
        summary: "Enterprise-grade weekly health checks and ongoing performance tuning for up to five flows.",
        features: [
          "Weekly health checks for up to five workflows",
          "Monthly optimisation review",
          "Up to four hours of minor improvements monthly",
          "Priority support response",
        ],
      },
    ],
    disclaimer:
      "Model/API usage, hosting, WhatsApp charges, external platform subscriptions and third-party services are separate from the development fee.",
    seo: {
      title: "AI Solutions & Automation | ARCHE Creative Studios",
      desc: "Practical AI assistants, WhatsApp automation, and custom business workflow pipelines. Connect your tools, reduce repetitive tasks, and scale operations.",
    },
  },
];

/** Helper to get service by slug or legacy alias */
export function getServiceBySlug(slug: string): ServiceData | undefined {
  return servicesData.find(
    (s) => s.slug === slug || (s.legacySlugs && s.legacySlugs.includes(slug))
  );
}

