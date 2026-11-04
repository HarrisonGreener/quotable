import { ShieldCheck, ShieldAlert } from "lucide-react";
import { quoteConfidence, type PricedLine } from "@/lib/quoteConfidence";

const STYLES = {
  high: "bg-green-100 text-green-800 border-green-200 dark:bg-green-950 dark:text-green-200 dark:border-green-900",
  medium: "bg-amber-100 text-amber-900 border-amber-200 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-900",
  low: "bg-orange-100 text-orange-900 border-orange-200 dark:bg-orange-950 dark:text-orange-200 dark:border-orange-900",
};

const fmt = (n: number) => `£${n.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** "86% of materials priced from real products · 2 lines to check (£43.10)" */
export const QuoteConfidenceBadge = ({ materials, compact = false }: { materials: PricedLine[]; compact?: boolean }) => {
  const c = quoteConfidence(materials);
  if (!materials?.length) return null;
  const Icon = c.level === "high" ? ShieldCheck : ShieldAlert;

  return (
    <div
      className={`inline-flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border px-3 py-1.5 text-sm ${STYLES[c.level]}`}
      role="status"
    >
      <Icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
      <span className="font-semibold">{c.score}% price-checked</span>
      {!compact && (
        <span>
          {c.estimatedCount === 0
            ? "every material matched to a real product or your own price"
            : `${c.estimatedCount} estimated line${c.estimatedCount === 1 ? "" : "s"} to check (${fmt(c.estimatedValue)})`}
        </span>
      )}
    </div>
  );
};
