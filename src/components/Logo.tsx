import { Link } from "react-router-dom";

// Quotable mark: a navy Q whose tail is an orange stroke (logo direction A).
// Colours come from the theme tokens, so it works in light and dark mode.

interface MarkProps {
  size?: number;
  className?: string;
  /** "tape": ring draws on, then the tail pulls out and springs back like a tape measure */
  animated?: boolean;
  title?: string;
}

export const QuotableMark = ({ size = 32, className = "", animated = false, title }: MarkProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    className={`${animated ? "q-mark-animated" : ""} ${className}`}
    role={title ? "img" : undefined}
    aria-label={title}
    aria-hidden={title ? undefined : true}
  >
    <circle
      className="q-ring"
      cx="45"
      cy="45"
      r="30"
      fill="none"
      stroke="hsl(var(--primary))"
      strokeWidth="12"
      transform="rotate(-45 45 45)"
    />
    {/* gap between ring and tail, in the page background colour */}
    <line className="q-gap" x1="60" y1="60" x2="86" y2="86" stroke="hsl(var(--background))" strokeWidth="20" strokeLinecap="round" />
    <line className="q-tail" x1="60" y1="60" x2="86" y2="86" stroke="hsl(var(--accent))" strokeWidth="12" strokeLinecap="round" />
  </svg>
);

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  /** Hide the wordmark (icon only), e.g. in a collapsed sidebar */
  iconOnly?: boolean;
  /** Use on dark backgrounds such as the sidebar */
  inverted?: boolean;
}

const SIZES = {
  sm: { mark: 24, text: "text-xl" },
  md: { mark: 30, text: "text-2xl" },
  lg: { mark: 44, text: "text-4xl" },
};

export const Logo = ({ className = "", size = "md", iconOnly = false, inverted = false }: LogoProps) => {
  const s = SIZES[size];
  return (
    <Link
      to="/"
      className={`font-heading font-bold inline-flex items-center gap-2 ${inverted ? "q-logo-inverted" : ""} ${className}`}
      aria-label="Quotable home"
    >
      <QuotableMark size={s.mark} />
      {!iconOnly && (
        <span className={`${s.text} tracking-tight ${inverted ? "text-white" : "text-primary"}`}>Quotable</span>
      )}
    </Link>
  );
};

/** Full-page / inline loader using the tape-pull animation. */
export const QuotableLoader = ({ size = 56, label = "Loading" }: { size?: number; label?: string }) => (
  <div role="status" aria-live="polite" className="flex flex-col items-center gap-3">
    <QuotableMark size={size} animated />
    <span className="sr-only">{label}</span>
  </div>
);
