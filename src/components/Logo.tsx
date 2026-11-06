import { useId } from "react";
import { Link } from "react-router-dom";

// Quotable mark: a navy ring whose tail is an orange stroke, like a tape measure
// pulled out of its case. The gap between ring and tail is cut with a mask, so the
// mark sits cleanly on any background (page, card, navy sidebar, photo).

interface MarkProps {
  size?: number | string;
  className?: string;
  /** Ring draws on, then the tail pulls out and springs back like a tape measure */
  animated?: boolean;
  /** Colour of the ring; defaults to the brand navy (or white when inverted) */
  ringColor?: string;
  title?: string;
}

const RING = { cx: 47, cy: 47, r: 33, w: 15 };
const TAIL = { x1: 66, y1: 66, x2: 94, y2: 94 };

export const QuotableMark = ({ size = 32, className = "", animated = false, ringColor, title }: MarkProps) => {
  const id = useId().replace(/:/g, "");
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      overflow="visible"
      className={`${animated ? "q-mark-animated" : ""} ${className}`}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <defs>
        <mask id={`q-cut-${id}`} maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100">
          <rect width="100" height="100" fill="#fff" />
          <line {...TAIL} stroke="#000" strokeWidth={RING.w + 8} strokeLinecap="round" />
        </mask>
      </defs>
      {/* The cut sits on an unrotated group; only the ring inside is turned (so its
          draw-on animation starts at the tail), keeping the gap exactly around the tail. */}
      <g mask={`url(#q-cut-${id})`}>
        <circle
          className="q-ring"
          cx={RING.cx}
          cy={RING.cy}
          r={RING.r}
          fill="none"
          stroke={ringColor ?? "currentColor"}
          strokeWidth={RING.w}
          transform={`rotate(45 ${RING.cx} ${RING.cy})`}
        />
      </g>
      <line className="q-tail" {...TAIL} stroke="hsl(var(--accent))" strokeWidth={RING.w} strokeLinecap="round" />
    </svg>
  );
};

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  /** The mark on its own, e.g. in a collapsed sidebar */
  iconOnly?: boolean;
  /** White ring and lettering for dark backgrounds such as the sidebar */
  inverted?: boolean;
  /** Render without a link (e.g. inside another link or in print) */
  asText?: boolean;
}

const SIZES = { sm: "text-[1.25rem]", md: "text-[1.5rem]", lg: "text-[2.25rem]", xl: "text-[3.5rem]" };

/**
 * Wordmark lockup: the mark IS the Q, set to the cap height of the lettering with
 * its tail dropping below the baseline like a real Q.
 */
export const Wordmark = ({ size = "md", inverted = false, className = "" }: Pick<LogoProps, "size" | "inverted" | "className">) => (
  <span
    className={`q-wordmark ${SIZES[size]} ${inverted ? "text-white" : "text-primary"} ${className}`}
    aria-label="Quotable"
    role="img"
  >
    <QuotableMark size="0.88em" className="q-wordmark-q" />
    <span aria-hidden="true">uotable</span>
  </span>
);

export const Logo = ({ className = "", size = "md", iconOnly = false, inverted = false, asText = false }: LogoProps) => {
  const content = iconOnly ? (
    <QuotableMark size={size === "sm" ? 26 : size === "lg" ? 44 : 32} className={inverted ? "text-white" : "text-primary"} title="Quotable" />
  ) : (
    <Wordmark size={size} inverted={inverted} />
  );
  if (asText) return <span className={className}>{content}</span>;
  return (
    <Link to="/" className={`inline-flex items-center rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${className}`} aria-label="Quotable home">
      {content}
    </Link>
  );
};

/** Full-page / inline loader using the tape-pull animation. */
export const QuotableLoader = ({ size = 56, label = "Loading" }: { size?: number; label?: string }) => (
  <div role="status" aria-live="polite" className="flex flex-col items-center gap-3 text-primary">
    <QuotableMark size={size} animated />
    <span className="sr-only">{label}</span>
  </div>
);
