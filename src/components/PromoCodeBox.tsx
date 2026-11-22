import { useEffect, useState } from "react";
import { Check, Tag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { clearPromo, getPromo, setPromo } from "@/utils/promo";

// "Have a code?" box on the plan page. Checks the code straight away and shows what it
// gives (e.g. "Free for good"); the code is then applied at checkout, taking priority
// over the early access deal.
export const PromoCodeBox = () => {
  const [code, setCode] = useState("");
  const [applied, setApplied] = useState<{ code: string; offer: string } | null>(null);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);
  const [open, setOpen] = useState(false);

  const check = async (value: string, quiet = false) => {
    const c = value.trim().toUpperCase();
    if (!c) return;
    setChecking(true);
    setError("");
    const { data, error: err } = await supabase.functions.invoke("check-promo", { body: { code: c } });
    setChecking(false);
    if (err || !data) {
      if (!quiet) setError("Couldn't check that code. Try again in a moment.");
      return;
    }
    if (data.valid) {
      setPromo(data.code);
      setApplied({ code: data.code, offer: data.offer });
      setCode("");
    } else {
      clearPromo();
      setApplied(null);
      if (!quiet) setError(data.reason === "used up" ? "That code has been fully used." : "That code isn't valid. Check the spelling.");
    }
  };

  // A code from a shared link (quotable.uk/?code=...) shows as applied
  useEffect(() => {
    const existing = getPromo();
    if (existing) check(existing, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (applied) {
    return (
      <div className="mx-auto mt-4 flex max-w-md items-center justify-between gap-3 rounded-md border border-accent/40 bg-accent/10 px-4 py-3 text-left">
        <div className="flex items-center gap-2 text-sm">
          <Check className="h-4 w-4 shrink-0 text-accent" aria-hidden />
          <span>
            Code <strong>{applied.code}</strong> applied: <strong>{applied.offer}</strong>
          </span>
        </div>
        <button
          type="button"
          onClick={() => { clearPromo(); setApplied(null); }}
          className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:text-foreground"
          aria-label="Remove code"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mx-auto mt-4 inline-flex min-h-[2.75rem] items-center gap-2 text-sm font-medium text-primary underline underline-offset-2"
      >
        <Tag className="h-4 w-4" aria-hidden /> Have a code? Enter it here
      </button>
    );
  }

  return (
    <form
      className="mx-auto mt-4 max-w-md text-left"
      onSubmit={(e) => { e.preventDefault(); check(code); }}
    >
      <label htmlFor="promo-code" className="text-sm font-medium">Promo code</label>
      <div className="mt-1.5 flex gap-2">
        <Input
          id="promo-code"
          value={code}
          onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(""); }}
          placeholder="e.g. TESTFREE"
          autoCapitalize="characters"
          autoComplete="off"
          className="h-11 uppercase"
          autoFocus
        />
        <Button type="submit" className="h-11 px-5" disabled={checking || !code.trim()}>
          {checking ? "Checking…" : "Apply"}
        </Button>
      </div>
      {error && <p className="mt-1.5 text-sm text-destructive">{error}</p>}
    </form>
  );
};
