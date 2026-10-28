# Commercial content: owner review required

The repository does not provide independent evidence or approval for the commercial claims below. They have been **preserved**, not validated or silently changed. Please confirm them with the studio owner before relying on or publishing them. Pricing CTAs still pass the chosen service and scope into the guided enquiry.

## Pricing page and shared service pricing (`src/data/pricing.ts`)

- Starting prices: Video Editing **$2,400**, Web Development **$3,500**, AI Chatbots **$2,800**, AI Automation **$1,800**; confirm units, scope and currency.
- Every tier's included deliverables, revision limits, source-file/handoff terms, and 30-day support/tuning/monitoring windows.
- Turnaround claims: video **2–5 working days per batch** and **48h** revision turnaround; web **2–4 / 4–8 weeks**; chatbot **2–3 weeks**; automation **2–4 weeks**.
- **50% deposit** and balance timing in each category, plus the general payment-schedule paragraph in `src/pages/PricingPage.tsx`.
- Performance and availability language, including **sub-second load times**, **95+ Lighthouse**, **24/7**, strict guardrails, and the fixed-quote guarantee. These require explicit substantiation and agreement.

## Cross-page consistency (`src/data/site.ts`)

- Service detail turnaround, package contents, revision/support promises and delivery times should be reconciled with the pricing data. For example, video service copy refers to **2–5 working days per edit**, while pricing says **per batch**; the long-form package mentions **15 minutes** in one place and **20 minutes** in another.
- FAQ timeline/support wording and any response-time promises should be checked against the actual operating process.

## Enquiry delivery

`src/lib/inquiries.ts` submits only when `VITE_WEB3FORMS_ACCESS_KEY` is configured and confirms success only after the provider returns `success: true`. Without configuration, the contact flow explains that delivery is not connected and offers a pre-filled email. Verify the receiving address and provider configuration before launch. No payment or booking gateway is connected.
