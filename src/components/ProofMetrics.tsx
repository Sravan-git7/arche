interface MetricItem {
  n: string;
  value: string;
  label: string;
  sub: string;
  status: string;
}

const METRICS: MetricItem[] = [
  {
    n: "01",
    value: "4 Disciplines",
    label: "Single Operating Model",
    sub: "Cinema, Code, Neural & Flow engineered under one roof.",
    status: "SYNCED",
  },
  {
    n: "02",
    value: "< 14 Days",
    label: "First Release",
    sub: "Rapid staging links with zero radio silence from kickoff.",
    status: "LOCKED",
  },
  {
    n: "03",
    value: "24/7",
    label: "AI Coverage",
    sub: "Autonomous intake, qualification, and routing around the clock.",
    status: "ACTIVE",
  },
  {
    n: "04",
    value: "100%",
    label: "Custom Built",
    sub: "Yours to own with zero locked vendor templates or recurring fee traps.",
    status: "VERIFIED",
  },
];

/**
 * Architectural Proof Metrics Section.
 * Warm Studio Ivory Canvas (#FBFBF6):
 * - Centered headline in #141413 with muted grey subtitle
 * - Giant subtle outlined watermark (ARCHÉ) positioned directly BEHIND the centered headline in rgba(20,20,19,0.045) stroke
 * - ONE unified 4-column frosted-ivory bar split by 1px solid rgba(20,20,19,0.08) hairlines
 * - Each column lights up with #9EE41A / #72B314 cursor-tracking glass spotlight on hover
 */
export function ProofMetrics() {
  return (
    <section className="relative w-full py-[clamp(80px,10vw,140px)] bg-[#FBFBF6] text-[#141413] border-t border-[#141413]/[0.08] overflow-hidden select-none">
      {/* Top-Center Studio Ambient Glow */}
      <div
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[90%] max-w-[1200px] h-[400px] rounded-full blur-[110px] opacity-35"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.9) 0%, rgba(148,212,46,0.12) 35%, transparent 70%)",
        }}
        aria-hidden="true"
      />

      <div className="wrap relative z-10">
        {/* Centered Headline Container with ARCHÉ Watermark directly BEHIND it */}
        <div className="relative mb-[clamp(44px,6vw,72px)] text-center max-w-[840px] mx-auto">
          {/* Giant subtle outlined watermark (ARCHÉ) positioned directly BEHIND the headline */}
          <div
            className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 select-none whitespace-nowrap font-display text-[clamp(64px,14vw,190px)] font-black tracking-tighter z-0"
            style={{
              color: "transparent",
              WebkitTextStroke: "1.5px rgba(20, 20, 19, 0.045)",
            }}
            aria-hidden="true"
          >
            ARCHÉ
          </div>

          <div className="relative z-10">
            {/* Naked Eyebrow */}
            <div className="inline-flex items-center gap-2 mb-4">
              <span className="h-1.5 w-1.5 rounded-full bg-[#72B314]" />
              <span className="font-mono text-[11px] font-semibold tracking-widest uppercase text-[#595C56]">
                ARCHITECTURAL BENCHMARKS
              </span>
            </div>

            <h2 className="text-[clamp(34px,4.5vw,56px)] font-semibold tracking-[-0.035em] leading-[1.04]">
              <span className="text-[#141413]">Built to </span>
              <span className="text-[#8A8D86]">move faster and convert better.</span>
            </h2>

            <p className="mt-4 max-w-[50ch] mx-auto text-[#595C56] text-sm sm:text-base leading-relaxed">
              Every layer of the Arché stack is benchmarked against real-world performance, speed, and continuous zero-drift delivery.
            </p>
          </div>
        </div>

        {/* ONE Unified 4-Column Frosted-Ivory Bar */}
        <div className="frosted-ivory-card arche-glow-card shiny-border grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 rounded-3xl overflow-hidden">
          {METRICS.map((m, idx) => (
            <div
              key={idx}
              className={`group p-7 sm:p-8 flex flex-col justify-between min-h-[230px] cursor-pointer transition-all ${
                idx < 3 ? "lg:border-r border-[#141413]/[0.08]" : ""
              } ${idx % 2 === 0 ? "sm:border-r lg:border-r-0 border-[#141413]/[0.08]" : ""} ${
                idx < 2 ? "border-b sm:border-b-0 lg:border-b-0 border-[#141413]/[0.08]" : ""
              }`}
              data-cursor="hover"
            >
              <div>
                <div className="flex items-center justify-between font-mono text-[11px] tracking-widest uppercase pb-3 border-b border-[#141413]/[0.08] text-[#595C56]">
                  <span>{m.n} · SPEC</span>
                  <span className="text-[10px] tracking-wider text-[#868A82]">BENCHMARK</span>
                </div>

                <div className="mt-6">
                  <span className="block font-display text-[clamp(32px,3.8vw,48px)] font-semibold tracking-[-0.035em] text-[#141413] leading-none group-hover:text-[#141413] transition-colors">
                    {m.value}
                  </span>
                  <span className="block mt-2.5 font-mono text-xs font-semibold uppercase tracking-wider text-[#595C56]">
                    {m.label}
                  </span>
                </div>
              </div>

              <p className="mt-5 text-xs text-[#595C56] leading-relaxed">
                {m.sub}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
