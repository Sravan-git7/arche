import { AcMonogram } from "./AcMonogram";

/**
 * Arche wordmark. The symbol is the interwoven AC monogram, set against the grotesk logotype.
 * A single accent square marks the "system active" state, echoing the node language used site-wide.
 */
export function Wordmark({
  size = 20,
  accent = true,
  onDark = false,
}: {
  size?: number;
  accent?: boolean;
  onDark?: boolean;
}) {
  return (
    <span
      className="inline-flex items-baseline gap-[9px] select-none"
      style={{ lineHeight: 1 }}
      aria-label="Arche"
    >
      <AcMonogram size={Math.round(size * 0.82)} onDark={onDark} style={{ alignSelf: "center" }} />
      <span
        style={{
          fontFamily: "var(--font-display)",
          fontSize: size,
          fontWeight: 600,
          letterSpacing: "-0.05em",
        }}
      >
        Arche
      </span>
      {accent && (
        <span
          style={{
            width: 5,
            height: 5,
            background: "var(--accent)",
            alignSelf: "flex-start",
            marginTop: 2,
          }}
        />
      )}
    </span>
  );
}
