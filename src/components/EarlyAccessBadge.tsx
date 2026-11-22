import { EARLY_ACCESS, OFFER } from "@/config/offer";

/** Small "Early access" pill shown next to the logo while early access is on. */
export const EarlyAccessBadge = ({ inverted = false, className = "" }: { inverted?: boolean; className?: string }) => {
  if (!EARLY_ACCESS) return null;
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full border px-2 py-0.5 text-[0.68rem] font-semibold uppercase tracking-wide ${
        inverted ? "border-white/30 text-white/85" : "border-accent/40 bg-accent/10 text-accent"
      } ${className}`}
      title="Quotable is in early access. Tell us what you think at support@quotable.uk"
    >
      {OFFER.badge}
    </span>
  );
};
