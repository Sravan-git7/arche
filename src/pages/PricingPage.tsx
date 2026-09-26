import { pricingData } from "../data/pricing";
import { ServicePricing } from "../components/ServicePricing";
import { FinalCTA } from "../components/Sections";
import { Link, usePage } from "../lib/router";
import { useReveal, useParallax } from "../lib/reveal";

export function PricingPage() {
  usePage("Pricing & Investment — Arche");
  useReveal();
  useParallax();

  const servicesList = Object.values(pricingData);

  return (
    <>
      {/* Hero Header */}
      <section className="w-full pt-[130px] pb-[clamp(40px,5vw,70px)]">
        <div className="wrap">
          <div className="mb-[20px] flex items-center gap-[10px]">
            <Link to="/" className="mono lnk text-[12px]">
              Home
            </Link>
            <span className="mono text-[var(--faint)]">/</span>
            <span className="mono mono-fg text-[12px]">Pricing</span>
          </div>

          <div className="max-w-[780px]">
            <p className="mono mono-a mb-[14px]">Investment Architecture</p>
            <h1 className="d1" data-r="mask">
              Transparent starting scopes. Honest pricing.
            </h1>
            <p className="body mt-[22px] max-w-[54ch] text-[var(--muted)]" data-r="meta">
              Every project is scoped individually with fixed milestones in writing before work begins. No open-ended hourly surprises or bloated agency retainers.
            </p>
          </div>

          {/* Quick jump pills */}
          <div className="mt-[36px] flex flex-wrap items-center gap-[10px]" data-r="meta">
            {servicesList.map((s) => (
              <a
                key={s.slug}
                href={`#${s.slug}`}
                className="chip"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById(s.slug)?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                <span className="mono text-[10px] text-[var(--accent-deep)] mr-1">{s.n}</span>
                {s.serviceTitle} · from {s.startingAt}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Services Pricing Blocks */}
      <div className="flex flex-col">
        {servicesList.map((s) => (
          <div key={s.slug} id={s.slug} className="scroll-mt-[80px]">
            <ServicePricing slug={s.slug} title={`${s.serviceTitle} Pricing`} kicker={`${s.n} · ${s.serviceTitle}`} />
          </div>
        ))}
      </div>

      {/* Pricing Principles & FAQs */}
      <section className="w-full py-[clamp(60px,8vw,120px)] border-t" style={{ borderColor: "var(--line)", background: "var(--bg)" }}>
        <div className="wrap grid gap-[clamp(32px,5vw,64px)] md:grid-cols-12">
          <div className="md:col-span-5">
            <p className="mono mono-a mb-[12px]">Principles</p>
            <h2 className="d2 max-w-[14ch]" data-r="mask">
              How we price and operate.
            </h2>
            <p className="body mt-[16px] max-w-[42ch] text-[var(--muted)]">
              We operate as a systems studio, not an hourly shop. Here is how engagements are structured.
            </p>
          </div>

          <div className="md:col-span-7 flex flex-col gap-[20px]">
            <div className="border p-[20px_24px] rounded-[6px]" style={{ borderColor: "var(--line)", background: "var(--bg-2)" }}>
              <h3 className="d4 font-medium mb-[8px]">Fixed milestones, defined scope</h3>
              <p className="body-s text-[var(--muted)] leading-relaxed">
                Before any build begins, you receive an exact technical blueprint with deliverables, timeline, revision rounds, and total investment in writing.
              </p>
            </div>

            <div className="border p-[20px_24px] rounded-[6px]" style={{ borderColor: "var(--line)", background: "var(--bg-2)" }}>
              <h3 className="d4 font-medium mb-[8px]">Deposit & payment schedule</h3>
              <p className="body-s text-[var(--muted)] leading-relaxed">
                Most engagements require a 50% deposit to lock the production sprint, with the remaining balance due upon staging review and final handover.
              </p>
            </div>

            <div className="border p-[20px_24px] rounded-[6px]" style={{ borderColor: "var(--line)", background: "var(--bg-2)" }}>
              <h3 className="d4 font-medium mb-[8px]">Start single, connect over time</h3>
              <p className="body-s text-[var(--muted)] leading-relaxed">
                You don't need everything at once. Start where the friction is. Every capability is engineered as a modular piece that connects into your wider system later.
              </p>
            </div>
          </div>
        </div>
      </section>

      <FinalCTA />
    </>
  );
}
