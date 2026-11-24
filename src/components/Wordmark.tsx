import { AcMonogram } from "./AcMonogram";

/**
 * Arche wordmark. The symbol is the interwoven AC monogram, set against the grotesk logotype.
 * Supports badge={true} for the obsidian rounded badge.
 */
export function Wordmark({
  size = 28,
  monogramScale = 1.25,
  accent = true,
  onDark = false,
  badge = true,
}: {
  size?: number;
  monogramScale?: number;
  accent?: boolean;
  onDark?: boolean;
  badge?: boolean;
}) {
  const monogramH = Math.round(size * monogramScale);
  const dotSize = Math.max(5, Math.round(size * 0.22));

  return (
    <span
      className="inline-flex items-center gap-[10px] select-none"
      style={{ lineHeight: 1 }}
      aria-label="Arche"
    >
      <AcMonogram size={monogramH} onDark={onDark} badge={badge} style={{ alignSelf: "center" }} />
      <span
        style={{
          fontFamily: "var(--font-display)",
          fontSize: size,
          fontWeight: 700,
          letterSpacing: "-0.04em",
          color: onDark ? "#F4F4EE" : "#141413",
          transition: "color .4s ease",
        }}
      >
        Arche
      </span>
      {accent && (
        <span
          style={{
            width: dotSize,
            height: dotSize,
            background: "#9EE41A",
            borderRadius: "9999px",
            boxShadow: "0 0 6px rgba(158,228,26,0.6)",
            alignSelf: "flex-start",
            marginTop: Math.max(2, Math.round(size * 0.08)),
          }}
        />
      )}
    </span>
  );
}
