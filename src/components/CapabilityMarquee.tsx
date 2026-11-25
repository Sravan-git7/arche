const ROW_1_ITEMS = [
  "Brand Film",
  "Pitch Decks",
  "Bespoke Websites",
  "Workflow Automation",
  "4K Colour Grading",
];

const ROW_2_ITEMS = [
  "Investor Storytelling",
  "CRM & Calendar Sync",
  "Retention Editing",
  "Interactive Systems",
  "Custom Dashboards",
];

export function CapabilityMarquee() {
  // Duplicating the array twice per sequence chunk ensures seamless looping on ultra-wide screens
  const row1Sequence = [...ROW_1_ITEMS, ...ROW_1_ITEMS];
  const row2Sequence = [...ROW_2_ITEMS, ...ROW_2_ITEMS];

  return (
    <section
      aria-label="Capabilities Overview"
      className="relative w-full py-14 md:py-16 overflow-hidden select-none z-10"
    >
      {/* Centered Minimal Micro-Label */}
      <div className="flex items-center justify-center gap-2.5 mb-6 md:mb-8">
        <span className="h-1.5 w-1.5 rounded-full bg-[#9EE41A] shadow-[0_0_8px_#9EE41A]" />
        <span className="font-mono text-[13px] font-semibold tracking-[0.2em] uppercase text-[#A8AFA2]">
          CAPABILITIES & SYSTEMS
        </span>
      </div>

      {/* Feathered Edge Mask Wrapper */}
      <div
        className="w-full space-y-4 md:space-y-6 overflow-hidden"
        style={{
          maskImage: "linear-gradient(90deg, transparent 0%, black 14%, black 86%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(90deg, transparent 0%, black 14%, black 86%, transparent 100%)",
        }}
      >
        {/* Row 1: Monumental Display Glide Left */}
        <div className="animate-marquee-left flex items-center cursor-default">
          <div className="flex items-center shrink-0">
            {row1Sequence.map((item, idx) => (
              <div key={`r1-seq1-${idx}`} className="flex items-center">
                <span
                  data-cursor="hover"
                  className="monumental-marquee-item font-display text-[clamp(2rem,3.6vw,3.25rem)] font-bold tracking-[-0.03em] leading-none whitespace-nowrap"
                  style={{ fontVariationSettings: "'wght' 700", fontWeight: 700 }}
                >
                  {item}
                </span>
                <span className="inline-block h-2 w-2 md:h-2.5 md:w-2.5 rounded-full bg-[#9EE41A]/40 shadow-[0_0_8px_rgba(158,228,26,0.25)] mx-6 sm:mx-8 md:mx-12 shrink-0 select-none" />
              </div>
            ))}
          </div>

          <div className="flex items-center shrink-0" aria-hidden="true">
            {row1Sequence.map((item, idx) => (
              <div key={`r1-seq2-${idx}`} className="flex items-center">
                <span
                  data-cursor="hover"
                  className="monumental-marquee-item font-display text-[clamp(2rem,3.6vw,3.25rem)] font-bold tracking-[-0.03em] leading-none whitespace-nowrap"
                  style={{ fontVariationSettings: "'wght' 700", fontWeight: 700 }}
                >
                  {item}
                </span>
                <span className="inline-block h-2 w-2 md:h-2.5 md:w-2.5 rounded-full bg-[#9EE41A]/40 shadow-[0_0_8px_rgba(158,228,26,0.25)] mx-6 sm:mx-8 md:mx-12 shrink-0 select-none" />
              </div>
            ))}
          </div>
        </div>

        {/* Row 2: Monumental Display Glide Right */}
        <div className="animate-marquee-right flex items-center cursor-default">
          <div className="flex items-center shrink-0">
            {row2Sequence.map((item, idx) => (
              <div key={`r2-seq1-${idx}`} className="flex items-center">
                <span
                  data-cursor="hover"
                  className="monumental-marquee-item font-display text-[clamp(2rem,3.6vw,3.25rem)] font-bold tracking-[-0.03em] leading-none whitespace-nowrap"
                  style={{ fontVariationSettings: "'wght' 700", fontWeight: 700 }}
                >
                  {item}
                </span>
                <span className="inline-block h-2 w-2 md:h-2.5 md:w-2.5 rounded-full bg-[#9EE41A]/40 shadow-[0_0_8px_rgba(158,228,26,0.25)] mx-6 sm:mx-8 md:mx-12 shrink-0 select-none" />
              </div>
            ))}
          </div>

          <div className="flex items-center shrink-0" aria-hidden="true">
            {row2Sequence.map((item, idx) => (
              <div key={`r2-seq2-${idx}`} className="flex items-center">
                <span
                  data-cursor="hover"
                  className="monumental-marquee-item font-display text-[clamp(2rem,3.6vw,3.25rem)] font-bold tracking-[-0.03em] leading-none whitespace-nowrap"
                  style={{ fontVariationSettings: "'wght' 700", fontWeight: 700 }}
                >
                  {item}
                </span>
                <span className="inline-block h-2 w-2 md:h-2.5 md:w-2.5 rounded-full bg-[#9EE41A]/40 shadow-[0_0_8px_rgba(158,228,26,0.25)] mx-6 sm:mx-8 md:mx-12 shrink-0 select-none" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
