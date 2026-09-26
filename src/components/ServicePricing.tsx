import { pricingData, type ServicePricingData } from "../data/pricing";
import { serviceToBuildOption } from "./ServicePricingHelper";
import { navigate, Link } from "../lib/router";

export { serviceToBuildOption };

/**
 * PROMPT 27 — Honest Studio Pricing Component.
 *
 * Reused across each dedicated service page and summarized on /pricing.
 * Clear starting-price framing, scope drivers, honest caveat, and direct contact prefill.
 */
export function ServicePricing({
  slug,
  title = "Pricing & Investment",
  kicker = "Investment",
  compact = false,
}: {
  slug: string;
  title?: string;
  kicker?: string;
  compact?: boolean;
}) {
  const p = pricingData[slug];
  if (!p) return null;

  const handleStartProject = (scopeName?: string) => {
    try {
      const buildOption = serviceToBuildOption[slug] || "Other";
      sessionStorage.setItem(
        "arche:prefill",
        JSON.stringify({
          service: slug,
          build: buildOption,
          pkg: scopeName || p.serviceTitle,
        })
      );
    } catch {
      /* ignore */
    }
    navigate("/contact");
  };

  return (
    <section
      className={`w-full ${compact ? "py-[36px]" : "py-[clamp(60px,8vw,120px)]"} border-t`}
      style={{ borderColor: "var(--line)", background: "var(--bg-2)" }}
    >
      <div className="wrap">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-[20px] mb-[clamp(28px,4vw,52px)]">
          <div className="max-w-[680px]">
            <p className="mono mono-a mb-[10px]">{kicker}</p>
            <h2 className="d2 max-w-[18ch]" data-r="mask">
              {title}
            </h2>
          </div>

          <div className="flex items-center gap-[10px]">
            <span className="mono text-[11px] text-[var(--accent-deep)] font-medium">
              ● SCOPE-BASED PRICING
            </span>
          </div>
        </div>

        {/* ------------------------------------------------------------ */}
        {/* 1. THREE MANDATORY FRAMING STATEMENTS (PROMPT 27)             */}
        {/* ------------------------------------------------------------ */}
        <div
          className="rounded-[8px] border p-[clamp(20px,2.6vw,36px)] mb-[clamp(28px,3.5vw,44px)] shadow-sm"
          style={{ borderColor: "var(--accent-deep)", background: "var(--bg)" }}
          data-r="meta"
        >
          <div className="grid gap-[24px] md:grid-cols-12 items-baseline">
            {/* 1. Starting Price Framing */}
            <div className="md:col-span-5">
              <span className="mono text-[10px] uppercase tracking-wider block mb-[6px]" style={{ color: "var(--accent-deep)" }}>
                Starting Scope Framing
              </span>
              <p className="d3 font-medium text-[clamp(20px,2.2vw,30px)] text-[var(--fg)]">
                {p.startingFraming}
              </p>
            </div>

            {/* 2. What moves the number */}
            <div className="md:col-span-4 md:border-l md:pl-[24px]" style={{ borderColor: "var(--line)" }}>
              <span className="mono text-[10px] uppercase tracking-wider block mb-[6px] text-[var(--muted)]">
                What Moves The Number
              </span>
              <p className="body-s text-[var(--fg)] leading-relaxed">
                Final scope depends on {p.scopeDrivers}
              </p>
            </div>

            {/* 3. Honest Caveat */}
            <div className="md:col-span-3 md:border-l md:pl-[24px]" style={{ borderColor: "var(--line)" }}>
              <span className="mono text-[10px] uppercase tracking-wider block mb-[6px] text-[var(--muted)]">
                Our Guarantee
              </span>
              <p className="mono text-[11.5px] text-[var(--muted)] leading-normal">
                {p.caveat}
              </p>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------ */}
        {/* 2. STARTING SCOPES CARDS & PARAMETERS                        */}
        {/* ------------------------------------------------------------ */}
        <div className="grid gap-[20px] md:grid-cols-12 items-stretch">
          {/* Starting Scopes */}
          {p.startingScopes.map((scope, idx) => (
            <div
              key={scope.name}
              className="md:col-span-4 flex flex-col justify-between border p-[clamp(20px,2.2vw,30px)] rounded-[8px] transition-all duration-300 hover:border-[var(--accent-deep)]"
              style={{
                borderColor: "var(--line)",
                background: "var(--card)",
                boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
              }}
              data-r="meta"
              data-r-delay={idx * 80}
            >
              <div>
                <div className="flex items-baseline justify-between mb-[12px]">
                  <h3 className="d4 font-medium">{scope.name}</h3>
                  <span className="mono text-[10px] uppercase tracking-wider text-[var(--accent-deep)]">
                    {idx === 0 ? "Typical Entry" : "Comprehensive"}
                  </span>
                </div>

                <div className="flex items-baseline gap-[8px] mb-[16px] pb-[14px] border-b" style={{ borderColor: "var(--line)" }}>
                  <span className="d3 font-medium">{scope.price}</span>
                  <span className="mono text-[11px] text-[var(--muted)]">{scope.unit}</span>
                </div>

                <p className="body-s text-[var(--muted)] mb-[16px] leading-snug">
                  {scope.summary}
                </p>

                <p className="mono text-[10.5px] font-semibold text-[var(--fg)] mb-[10px] uppercase tracking-wider">
                  Deliverables:
                </p>

                <ul className="m-0 flex list-none flex-col gap-[9px] p-0 mb-[24px]">
                  {scope.includes.map((inc) => (
                    <li key={inc} className="mono text-[11px] flex items-start gap-[9px] text-[var(--fg)]">
                      <span className="mono text-[var(--accent-deep)] font-bold">✓</span>
                      <span>{inc}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <button
                  type="button"
                  className="btn btn-primary w-full justify-center text-[12px] py-[10px]"
                  data-cursor="START"
                  onClick={() => handleStartProject(scope.name)}
                >
                  Request this scope <span className="arw">→</span>
                </button>
              </div>
            </div>
          ))}

          {/* Custom Project Box / Parameters */}
          <div
            className="md:col-span-4 flex flex-col justify-between border border-dashed p-[clamp(20px,2.2vw,30px)] rounded-[8px] transition-all duration-300 hover:border-[var(--accent-deep)]"
            style={{
              borderColor: "var(--line)",
              background: "var(--bg)",
            }}
            data-r="meta"
            data-r-delay={200}
          >
            <div>
              <div className="flex items-baseline justify-between mb-[12px]">
                <h3 className="d4 font-medium">Bespoke Scope</h3>
                <span className="mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
                  Tailored
                </span>
              </div>

              <div className="flex items-baseline gap-[8px] mb-[16px] pb-[14px] border-b" style={{ borderColor: "var(--line)" }}>
                <span className="d3 font-medium">Custom quote</span>
                <span className="mono text-[11px] text-[var(--muted)]">phased</span>
              </div>

              <p className="body-s text-[var(--muted)] mb-[16px] leading-snug">
                For complex integrations, hybrid pipelines, or cross-service system builds.
              </p>

              {/* Engagement Parameters */}
              <div className="flex flex-col gap-[10px] mb-[20px] pt-[8px] border-t" style={{ borderColor: "var(--line)" }}>
                <div className="flex items-baseline justify-between text-[11px] font-mono">
                  <span className="text-[var(--muted)]">Turnaround:</span>
                  <span className="text-[var(--fg)] text-right font-medium">{p.parameters.turnaround}</span>
                </div>
                <div className="flex items-baseline justify-between text-[11px] font-mono">
                  <span className="text-[var(--muted)]">Deposit:</span>
                  <span className="text-[var(--fg)] text-right font-medium">{p.parameters.deposit}</span>
                </div>
                <div className="flex items-baseline justify-between text-[11px] font-mono">
                  <span className="text-[var(--muted)]">Revisions:</span>
                  <span className="text-[var(--fg)] text-right font-medium">{p.parameters.revisions}</span>
                </div>
                <div className="flex items-baseline justify-between text-[11px] font-mono">
                  <span className="text-[var(--muted)]">Handoff:</span>
                  <span className="text-[var(--fg)] text-right font-medium">{p.parameters.handoff}</span>
                </div>
              </div>
            </div>

            <div>
              <button
                type="button"
                className="btn btn-ghost w-full justify-center text-[12px] py-[10px]"
                data-cursor="START"
                onClick={() => handleStartProject("Custom Scope")}
              >
                Request custom quote <span className="arw">→</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
