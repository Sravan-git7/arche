/**
 * Arche content model. Everything the UI renders is data-driven so
 * services, projects and copy can evolve without rebuilding components.
 * Current commercial offering is deliberately limited to four services;
 * Other capabilities may expand later — never presented as current offerings.
 */

export type ServicePackage = {
  name: string;
  price: string;
  unit: string;
  includes: string[];
  deposit?: string;
};

export type Service = {
  slug: string;
  n: string;
  title: string;
  short: string;
  tagline: string;
  arc: [string, string, string]; // the transformation arc
  desc: string;
  problems: string[];
  offerings: { k: string; v: string }[];
  process: { k: string; v: string }[];
  deliverables: string[];
  turnaround: string;
  packages: ServicePackage[];
  seo: { title: string; desc: string };
};

export const services: Service[] = [
  {
    slug: "video-editing",
    n: "01",
    title: "Video Editing",
    short: "Video",
    tagline: "Every frame has a story. Let's make it worth watching.",
    arc: ["RAW", "DECISIONS", "CONTENT"],
    desc: "We transform raw footage and creative ideas into engaging visual experiences. From short-form social content to long-form storytelling, promotional videos and motion graphics, ARCHE helps brands and creators communicate their stories with clarity, creativity and impact.",
    problems: [
      "Hours of footage, no publishing rhythm",
      "Content that loses viewers in the first seconds",
      "Inconsistent pacing, grading and sound across posts",
      "Long-form assets never repurposed into short-form",
    ],
    offerings: [
      { k: "Short-form", v: "Reels, Shorts and TikTok edits cut for high retention." },
      { k: "Long-form", v: "YouTube videos, podcasts and talks with narrative structure." },
      { k: "Brand films", v: "Promotional and ad edits built for impact and conversion." },
      { k: "Motion graphics", v: "Titles, kinetic captions, grading and sound design." },
    ],
    process: [
      { k: "Ingest", v: "We review every frame of the raw material." },
      { k: "Select", v: "Usable footage is kept. The rest is deliberately rejected." },
      { k: "Assemble", v: "The sequence is built and tightened on the timeline." },
      { k: "Finish", v: "Grade, captions, sound design and multi-ratio delivery." },
    ],
    deliverables: [
      "High-retention 9:16 and 16:9 master video exports",
      "Styled kinetic captions, sound design and color grading",
      "Organized project files and source archive",
      "Dedicated revision rounds and transparent turnaround",
    ],
    turnaround: "Short-form: 3–5 working days. Long-form: 5–8 working days.",
    packages: [
      {
        name: "Short-Form Basic",
        price: "₹799",
        unit: "per video",
        includes: ["Up to 30s cut", "Clean cuts & pauses removed", "English captions", "Basic color & sound balancing"],
      },
      {
        name: "Short-Form Standard",
        price: "₹1,499",
        unit: "per video",
        includes: ["Up to 60s cut", "Hook-focused pacing", "Styled captions & B-roll overlays", "Sound design & 2 revisions"],
      },
    ],
    seo: {
      title: "Video Editing — ARCHE CREATIVE STUDIOS",
      desc: "Editorial video editing and production for creators and brands: short-form reels, long-form YouTube, podcasts and promotional films.",
    },
  },
  {
    slug: "web-development",
    n: "02",
    title: "Web Development",
    short: "Web Dev",
    tagline: "Digital interfaces engineered for impact and performance.",
    arc: ["CONCEPT", "CODE", "EXPERIENCE"],
    desc: "We build websites that look exceptional, load fast and work seamlessly. From landing pages to complete business websites and creative portfolios, ARCHE designs and develops digital experiences that turn visitors into believers and customers.",
    problems: [
      "A website that looks fine but produces zero leads",
      "Cluttered page builder bloat slowing load times",
      "Broken mobile experiences losing phone traffic",
      "Templates that make high-value brands look generic",
    ],
    offerings: [
      { k: "Landing pages", v: "Single-purpose conversion pages engineered for campaigns." },
      { k: "Business websites", v: "Multi-page brand flagships built on modern tech stacks." },
      { k: "Portfolio sites", v: "Interactive showcases for creators, studios and executives." },
      { k: "Web applications", v: "Custom portals, dashboards and database-driven tools." },
    ],
    process: [
      { k: "Structure", v: "Information architecture before any visual design." },
      { k: "Design", v: "Responsive layouts, micro-interactions and design tokens." },
      { k: "Build", v: "Clean modern code with zero bloated frameworks." },
      { k: "Deploy", v: "Performance audit, analytics, launch and handover." },
    ],
    deliverables: [
      "Fully responsive production build with custom animations",
      "Lead generation forms, WhatsApp and email integrations",
      "SEO-ready meta structure and lightning fast load times",
      "Post-launch support window and clean code handover",
    ],
    turnaround: "Landing page: 4–6 days. Starter site: 7–10 days. Business site: 2–3 weeks.",
    packages: [
      {
        name: "Landing Page",
        price: "₹4,999",
        unit: "one page",
        includes: ["Single-page high conversion layout", "Mobile responsive & fast loading", "Lead form + WhatsApp CTA", "Basic SEO setup"],
      },
      {
        name: "Starter Business Site",
        price: "₹9,999",
        unit: "up to 4 pages",
        includes: ["Home, About, Services, Contact", "Branded visual design & animations", "Contact form & social integration", "2 revision rounds"],
      },
    ],
    seo: {
      title: "Web Development — ARCHE CREATIVE STUDIOS",
      desc: "Fast, responsive and conversion-focused websites: landing pages, business websites, portfolio sites and custom web applications.",
    },
  },
  {
    slug: "ai-chatbots",
    n: "03",
    title: "AI Chatbots",
    short: "Chatbots",
    tagline: "Intelligent conversational agents that qualify, reason, and act.",
    arc: ["QUESTION", "REASONING", "ACTION"],
    desc: "We build custom AI chatbots and conversational assistants grounded in your business knowledge. From qualifying inbound leads to answering complex domain questions and booking appointments directly into your calendar.",
    problems: [
      "Visitors bounce without booking or asking questions",
      "Support teams answering the same repetitive questions",
      "Inbound leads arriving after hours and going cold",
      "Generic chatbots that hallucinate and provide bad answers",
    ],
    offerings: [
      { k: "Website Assistants", v: "Grounded 24/7 lead qualification and support agents." },
      { k: "WhatsApp Bots", v: "Interactive customer support and automated appointment booking." },
      { k: "Knowledge Assistants", v: "Internal search over team SOPs, documents, and product specs." },
      { k: "CRM Hand-offs", v: "Qualified conversation transcripts routed straight to your CRM." },
    ],
    process: [
      { k: "Ground", v: "Ingest and index verified company documents and FAQs." },
      { k: "Train", v: "Define boundaries, tone of voice, and escalation protocols." },
      { k: "Integrate", v: "Connect calendar, CRM, and notification webhooks." },
      { k: "Deploy", v: "Embed widget, monitor conversations, and continuously tune." },
    ],
    deliverables: [
      "Custom-trained chatbot widget ready for website embed",
      "Grounded knowledge base with strict anti-hallucination boundaries",
      "Direct integration with calendar booking and CRM pipeline",
      "Handover guide and performance analytics dashboard",
    ],
    turnaround: "Basic assistant: 3–5 days. Custom integrated agent: 5–8 days.",
    packages: [
      {
        name: "Website Assistant",
        price: "₹5,999",
        unit: "one assistant",
        includes: ["FAQ assistant grounded on business data", "Website embed widget", "Lead capture with email alerts", "Platform setup & handover"],
      },
      {
        name: "Integrated Agent",
        price: "₹12,999",
        unit: "custom agent",
        includes: ["CRM & Calendar booking integration", "WhatsApp or Web channel", "Multi-turn reasoning flow", "30 days tuning"],
      },
    ],
    seo: {
      title: "AI Chatbots — ARCHE CREATIVE STUDIOS",
      desc: "Custom AI chat agents that qualify leads, answer FAQs with verified business context, and book appointments 24/7.",
    },
  },
  {
    slug: "ai-automation",
    n: "04",
    title: "AI Automation",
    short: "Automation",
    tagline: "Intelligent workflows that eliminate manual bottlenecks.",
    arc: ["MANUAL", "PIPELINE", "AUTOMATED"],
    desc: "We build practical AI systems and workflow automations that help businesses save time, respond faster and operate efficiently. From lead qualification to multi-app sync and end-to-end process automation, ARCHE connects technology to everyday operations.",
    problems: [
      "Hours lost every day to manual copy-paste between tools",
      "Customer inquiries arriving after hours and going cold",
      "Scattered documents nobody on the team can search",
      "Repetitive workflows bottlenecking business growth",
    ],
    offerings: [
      { k: "Workflow automation", v: "Multi-step operations running without human babysitting." },
      { k: "Lead pipelines", v: "Instant lead capture, enrichment, qualification and notifications." },
      { k: "Document parsing", v: "PDF/invoice OCR, data extraction and automated database entry." },
      { k: "Custom integrations", v: "Connecting inboxes, sheets, CRMs, Slack, and cloud APIs." },
    ],
    process: [
      { k: "Audit", v: "Map manual bottlenecks and identify high-ROI opportunities." },
      { k: "Architect", v: "Design the automated data pipeline with fallbacks." },
      { k: "Implement", v: "Build, configure API keys and test with real company data." },
      { k: "Deploy", v: "Live testing, team walkthrough and continuous monitoring." },
    ],
    deliverables: [
      "Trained and deployed workflow pipeline",
      "Complete platform setup (Make / Zapier / n8n / APIs)",
      "Automated lead capture, email & WhatsApp alerts",
      "Step-by-step documentation and team handover walkthrough",
    ],
    turnaround: "Workflow pipeline: 5–7 days. Advanced multi-system automation: 10–14 days.",
    packages: [
      {
        name: "Workflow Pipeline",
        price: "₹8,999",
        unit: "up to 3 workflows",
        includes: ["Lead capture to Google Sheets / CRM", "Auto confirmation & notifications", "Multi-app integration", "Testing & documentation"],
      },
      {
        name: "Full Operational Automation",
        price: "₹18,999",
        unit: "multi-system",
        includes: ["End-to-end customer journey automation", "AI document extraction & parsing", "Webhook triggers & error handling", "Team training"],
      },
    ],
    seo: {
      title: "AI Automation — ARCHE CREATIVE STUDIOS",
      desc: "Practical workflow automations, lead pipelines and API integrations designed to save hours, eliminate human error, and scale operations.",
    },
  },
];

export const siteContent = {
  brand: {
    name: "ARCHE CREATIVE STUDIOS",
    line: "TECHNOLOGY MEETS CREATIVITY",
    discipline: "Video Production · Pitch Decks · Web Development · AI Solutions",
  },

  nav: {
    links: [
      { label: "Work", to: "/work" },
      { label: "Services", to: "/services" },
      { label: "Pricing", to: "/pricing" },
    ],
    cta: { label: "Start a Project", to: "/contact" },
  },

  hero: {
    kicker: "Creative Technology Studio",
    statement: "Where technology meets creativity to deliver real impact.",
    sub: "ARCHE CREATIVE STUDIOS combines video production, pitch deck storytelling, bespoke web development, and intelligent AI automation to help founders and brands scale.",
    ctaPrimary: { label: "Start a Project", to: "/contact" },
    ctaSecondary: { label: "Explore Services", to: "/services" },
  },

  whatWeDo: {
    label: "The proposition",
    lineA: "Ideas deserve more than execution.",
    lineB: "They deserve impact.",
    body: "From intelligent automation and digital development to visual storytelling and powerful presentations, ARCHE CREATIVE STUDIOS brings technology and creativity together to help businesses transform ideas into meaningful outcomes.",
  },

  servicesIntro: {
    label: "Services",
    statement: "Four dedicated verticals built for results.",
    body: "Video production, pitch deck storytelling, custom web development and practical AI solutions. Each vertical is engineered to the highest standard.",
  },

  process: {
    label: "How we work",
    statement: "From first conversation to a system that keeps improving.",
    steps: [
      { n: "01", k: "Discover", v: "Understand the business and where work is lost." },
      { n: "02", k: "Design", v: "Map the system before anything is built." },
      { n: "03", k: "Build", v: "Production-grade implementation, no shortcuts." },
      { n: "04", k: "Connect", v: "Join the new piece to the tools you already run — so nothing is orphaned." },
      { n: "05", k: "Launch", v: "Ship, measure, verify against real usage." },
      { n: "06", k: "Evolve", v: "Improve continuously as the business changes." },
    ],
  },

  faq: {
    label: "FAQ",
    statement: "Working with ARCHE CREATIVE STUDIOS.",
    items: [
      {
        q: "What does ARCHE CREATIVE STUDIOS do?",
        a: "We are a creative technology studio providing Video Production & Editing, Pitch Decks & Storytelling, Web Development, and AI Solutions & Automation.",
      },
      {
        q: "Which services are currently available?",
        a: "Exactly four: Video Production & Editing, Pitch Decks & Storytelling, Web Development, and AI Solutions & Automation.",
      },
      {
        q: "Can I hire ARCHE for only one service?",
        a: "Yes. Most clients start with a single project — such as a video package, pitch deck, website, or AI assistant — and expand as needed.",
      },
      {
        q: "Who do you work with?",
        a: "Founders, growing startups, creators, professionals, and companies who want high-quality creative and technical execution with transparent turnaround.",
      },
      {
        q: "Can you work with our existing tools?",
        a: "Yes. In web development and AI automation, we integrate with your existing CRMs, forms, spreadsheets, inboxes, and cloud infrastructure.",
      },
      {
        q: "How is pricing determined?",
        a: "We offer transparent fixed package pricing with clearly defined deliverables and limits, alongside custom quotes for specialist and enterprise requirements.",
      },
      {
        q: "How long does a project take?",
        a: "Reels and short edits take 3–5 working days. Pitch decks take 3–7 working days. Websites take 1–3 weeks. AI workflows take 1–2 weeks.",
      },
      {
        q: "What happens after I submit an inquiry?",
        a: "We review your inquiry and respond within one working day via Email or WhatsApp to confirm your scope, timeline, and next steps.",
      },
      {
        q: "Do you provide support after launch?",
        a: "Yes. Every website and AI project includes post-launch support and documentation, with ongoing monthly care plans available.",
      },
    ],
  },

  contact: {
    label: "Start a project",
    closing: "Ideas deserve impact. Let's build yours.",
    desc: "Tell us about your project, timeline and requirements. We'll respond within one working day.",
    email: "archecreativestudios@gmail.com",
    phone: "+91 7995937536",
    budgets: ["< ₹10,000", "₹10,000 – ₹25,000", "₹25,000 – ₹50,000", "₹50,000 +", "Custom quote"],
    timelines: ["Immediate (Priority)", "Within 1–2 weeks", "This month", "Planning phase"],
    channels: ["Email", "WhatsApp", "Phone Call"],
  },

  footer: {
    cols: [
      { t: "Studio", l: [{ label: "Work", to: "/work" }, { label: "Services", to: "/services" }, { label: "Pricing", to: "/pricing" }, { label: "Contact", to: "/contact" }] },
      {
        t: "Services",
        l: [
          { label: "Video Editing", to: "/services/video-editing" },
          { label: "Web Development", to: "/services/web-development" },
          { label: "AI Chatbots", to: "/services/ai-chatbots" },
          { label: "AI Automation", to: "/services/ai-automation" },
        ],
      },
    ],
    social: [],
    legal: "© 2026 ARCHE CREATIVE STUDIOS. All rights reserved.",
    note: "Technology Meets Creativity · Hyderabad, India",
  },
};
