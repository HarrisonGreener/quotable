import { useEffect, useState } from "react";
import { Ruler, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface QuoteAssumption {
  job: string;
  label: string;
  value: string;
  question: string;
  important: boolean;
}

/**
 * Shows the measurements the quote was worked out from. Values the job
 * description didn't state are assumptions — the user can correct them and
 * re-quote, which is the single biggest lever on accuracy.
 */
export const QuoteAssumptions = ({
  assumptions,
  questions = [],
  busy,
  onApply,
}: {
  assumptions: QuoteAssumption[];
  questions?: string[];
  busy?: boolean;
  onApply: (details: string) => void;
}) => {
  const [values, setValues] = useState<Record<number, string>>({});
  const [showAll, setShowAll] = useState(false);
  useEffect(() => { setValues({}); setShowAll(false); }, [assumptions]);

  if (!assumptions.length && !questions.length) return null;

  const important = assumptions.filter((a) => a.important);
  const shown = showAll || important.length === 0 ? assumptions : important;
  const changed = Object.entries(values).filter(([i, v]) => v.trim() && v.trim() !== assumptions[Number(i)]?.value);
  const multiJob = new Set(assumptions.map((a) => a.job)).size > 1;

  const apply = () => {
    const details = changed
      .map(([i, v]) => {
        const a = assumptions[Number(i)];
        return `${multiJob ? `${a.job} – ` : ""}${a.label}: ${v.trim()}`;
      })
      .join("; ");
    if (details) onApply(`Details: ${details}.`);
  };

  return (
    <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm space-y-3">
      <div className="flex items-start gap-2">
        <Ruler className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" aria-hidden="true" />
        <div>
          <p className="font-semibold">Worked out from these measurements</p>
          <p className="text-muted-foreground">
            Anything the job description didn't say has been assumed. Correct a value and re-quote for an accurate price.
          </p>
        </div>
      </div>

      {shown.length > 0 && (
        <div className="grid gap-2 sm:grid-cols-2">
          {shown.map((a) => {
            const i = assumptions.indexOf(a);
            return (
              <label key={i} className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">
                  {multiJob ? `${a.job} · ` : ""}{a.label}
                </span>
                <Input
                  value={values[i] ?? a.value}
                  onChange={(e) => setValues((v) => ({ ...v, [i]: e.target.value }))}
                  title={a.question}
                  className="h-8"
                />
              </label>
            );
          })}
        </div>
      )}

      {assumptions.length > shown.length && (
        <button type="button" className="text-xs underline text-muted-foreground" onClick={() => setShowAll(true)}>
          Show {assumptions.length - shown.length} more assumption{assumptions.length - shown.length === 1 ? "" : "s"}
        </button>
      )}

      {questions.length > 0 && (
        <ul className="list-disc pl-5 text-muted-foreground space-y-0.5">
          {questions.map((q, i) => <li key={i}>{q}</li>)}
        </ul>
      )}

      {changed.length > 0 && (
        <Button size="sm" onClick={apply} disabled={busy} className="gap-1.5">
          <RefreshCw className={`h-3.5 w-3.5 ${busy ? "animate-spin" : ""}`} />
          Re-quote with {changed.length} change{changed.length === 1 ? "" : "s"}
        </Button>
      )}
    </div>
  );
};
