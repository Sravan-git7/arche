export function GlobalStudioBackground() {
  return (
    <div
      data-global-studio-backdrop="true"
      className="fixed inset-0 z-0 pointer-events-none overflow-hidden select-none"
      style={{
        background:
          "linear-gradient(145deg, #EAF4D3 0%, #F2F7E4 48%, #E5F2C8 100%)",
      }}
      aria-hidden="true"
    >
      {/* Layer 1: Edge-to-Edge Radial Light Orbs for Balanced Botanical Luminous Depth */}
      {/* Orb 1: Top-Left (rgba(190, 236, 98, 0.28)) */}
      <div
        className="absolute -top-[12%] -left-[10%] w-[1000px] h-[800px] rounded-full blur-[130px] pointer-events-none will-change-transform"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(190, 236, 98, 0.28) 0%, rgba(190, 236, 98, 0.12) 50%, transparent 75%)",
          animation: "driftLimeMist 22s ease-in-out infinite alternate",
        }}
      />

      {/* Orb 2: Top-Right (rgba(210, 242, 140, 0.24)) */}
      <div
        className="absolute -top-[10%] -right-[8%] w-[960px] h-[780px] rounded-full blur-[130px] pointer-events-none will-change-transform"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(210, 242, 140, 0.24) 0%, rgba(210, 242, 140, 0.10) 50%, transparent 75%)",
          animation: "driftLimeMistReverse 26s ease-in-out infinite alternate",
        }}
      />

      {/* Orb 3: Bottom-Right (rgba(182, 232, 88, 0.26)) */}
      <div
        className="absolute -bottom-[12%] right-[4%] w-[920px] h-[740px] rounded-full blur-[120px] pointer-events-none will-change-transform"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(182, 232, 88, 0.26) 0%, rgba(182, 232, 88, 0.10) 50%, transparent 75%)",
          animation: "driftLimeMist 24s ease-in-out infinite alternate",
        }}
      />

      {/* Layer 2: Softened Architectural Fluted Glass Ribs Across Full Viewport */}
      <div
        data-fluted-glass="global"
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, rgba(255,255,255,0.16) 0px, rgba(255,255,255,0.03) 9px, rgba(20,20,19,0.014) 16px, rgba(255,255,255,0.16) 22px)",
          filter: "blur(0.6px)",
          opacity: 1,
        }}
      />

      {/* Subtle 2% Paper Micro-Grain */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage:
            "radial-gradient(rgba(20,20,19,0.9) 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }}
      />
    </div>
  );
}
