export function GlobalStudioBackground() {
  return (
    <div
      data-global-studio-backdrop="true"
      className="fixed inset-0 z-0 pointer-events-none overflow-hidden select-none bg-[#0E150C]"
      aria-hidden="true"
    >
      {/* Layer 1: Directional Studio Lighting (Top-Left Key Light + Balanced Right-Side Fill Light) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 68% 58% at 14% 12%, rgba(168, 224, 72, 0.16) 0%, rgba(130, 175, 88, 0.07) 38%, transparent 72%), radial-gradient(circle at 22% 18%, rgba(255, 255, 255, 0.06) 0%, transparent 52%), radial-gradient(ellipse 58% 60% at 88% 58%, rgba(142, 204, 68, 0.10) 0%, rgba(44, 66, 38, 0.12) 48%, transparent 78%)",
        }}
      />

      {/* Layer 2: Subtle Ambient Drift Blooms behind the silky glass */}
      <div
        className="absolute -top-[12%] -left-[6%] w-[1100px] h-[850px] rounded-full blur-[140px] pointer-events-none will-change-transform"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(168, 224, 72, 0.10) 0%, rgba(130, 175, 88, 0.03) 50%, transparent 75%)",
          animation: "driftLimeMist 28s ease-in-out infinite alternate",
        }}
      />
      <div
        className="absolute top-[35%] -left-[10%] w-[900px] h-[700px] rounded-full blur-[140px] pointer-events-none will-change-transform"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(130, 175, 88, 0.06) 0%, transparent 70%)",
          animation: "driftLimeMistReverse 24s ease-in-out infinite alternate",
        }}
      />
      {/* Right-Side Ambient Cypress Fill Bloom */}
      <div
        className="absolute top-[25%] -right-[12%] w-[850px] h-[750px] rounded-full blur-[150px] pointer-events-none will-change-transform"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(44, 66, 38, 0.15) 0%, rgba(24, 38, 21, 0.06) 55%, transparent 75%)",
          animation: "driftLimeMist 32s ease-in-out infinite alternate-reverse",
        }}
      />

      {/* Layer 3: Near-Invisible Whisper-Smooth Fluted Glass Texture (filter: blur(2.5px), softened gradient) */}
      <div
        data-fluted-glass="global"
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, rgba(255,255,255,0.008) 0px, transparent 14px, rgba(0,0,0,0.03) 26px, rgba(255,255,255,0.008) 36px)",
          filter: "blur(2.5px)",
          opacity: 0.8,
        }}
      />

      {/* Layer 4: Deep Studio Perimeter Lighting Falloff (Deep Cypress #0E150C base) */}
      <div
        data-cinema-vignette="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 88% 78% at 38% 36%, transparent 45%, rgba(14, 21, 12, 0.20) 74%, rgba(14, 21, 12, 0.52) 100%)",
        }}
      />

      {/* Layer 5: Fine 1.5% Micro-Grain */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.015]"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.18) 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }}
      />
    </div>
  );
}
