/**
 * Arche wordmark. The glyph is a keystone/arch form — the literal root of
 * the name — set against the grotesk logotype. A single accent square marks
 * the "system active" state, echoing the node language used site-wide.
 */
export function Wordmark({ size = 20, accent = true }: { size?: number; accent?: boolean }) {
  return (
    <span
      className="inline-flex items-baseline gap-[9px] select-none"
      style={{ lineHeight: 1 }}
      aria-label="Arche"
    >
      <svg
        width={size * 0.72}
        height={size * 0.72}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden
        style={{ alignSelf: "center" }}
      >
        {/* arch */}
        <path
          d="M3 21V12.5C3 7.25 7.03 3 12 3C16.97 3 21 7.25 21 12.5V21"
          stroke="currentColor"
          strokeWidth="1.6"
        />
        <path d="M9 21v-8.5C9 10.57 10.34 9 12 9s3 1.57 3 3.5V21" stroke="currentColor" strokeWidth="1.6" />
      </svg>
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
