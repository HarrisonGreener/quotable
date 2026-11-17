import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { readFunctionError } from "@/utils/functionError";

// Ask Quotable: answers questions about using the app from the help notes.

interface Msg { role: "user" | "assistant"; content: string; sources?: string[] }

const STARTERS = [
  "How do I get more accurate quotes?",
  "How do customers pay a deposit?",
  "Where do the material prices come from?",
  "How do I cancel my subscription?",
];

const TITLES: Record<string, string> = {
  "/help/accurate-quotes": "Accurate quotes", "/help/inventory-pricing": "Inventory & pricing", "/help/tax-pricing": "Tax & pricing",
  "/help/scheduling": "Scheduling", "/help/clients": "Clients", "/help/templates": "Templates", "/help/quote-templates": "Quote templates",
  "/help/common-issues": "Common issues", "/help/troubleshooting": "Troubleshooting", "/help/demo-mode": "Sample account", "/help/contact": "Contact",
};

export const HelpAssistant = () => {
  const { user } = useAuth();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" }); }, [msgs, busy]);

  const ask = async (text: string) => {
    const q = text.trim().slice(0, 600);
    if (!q || busy) return;
    const next = [...msgs, { role: "user" as const, content: q }];
    setMsgs(next);
    setInput("");
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("help-chat", {
      body: { messages: next.map(({ role, content }) => ({ role, content })) },
    });
    let reply: Msg;
    if (error) {
      const { status, message } = await readFunctionError(error);
      reply = {
        role: "assistant",
        content: status === 402 ? "The assistant is part of your Quotable subscription. Start or renew it from Account."
          : message || "The assistant isn't available right now. Email support@quotable-it.co.uk and we'll help.",
      };
    } else {
      reply = { role: "assistant", content: data.reply, sources: data.sources };
    }
    setMsgs([...next, reply]);
    setBusy(false);
  };

  if (!user) {
    return (
      <section className="rounded-md border border-border bg-card p-5">
        <h2 className="font-heading text-lg text-primary">Ask Quotable</h2>
        <p className="mt-1 text-sm text-muted-foreground">Sign in to ask questions about using Quotable. The articles below cover the basics.</p>
      </section>
    );
  }

  return (
    <section aria-labelledby="ask" className="rounded-md border border-border bg-card">
      <div className="border-b border-border px-5 py-4">
        <h2 id="ask" className="font-heading text-lg text-primary">Ask Quotable</h2>
        <p className="text-sm text-muted-foreground">Questions about using Quotable, getting accurate quotes, invoices, scheduling or your account.</p>
      </div>

      <div className="max-h-[26rem] overflow-y-auto px-5 py-4 space-y-4" aria-live="polite">
        {msgs.length === 0 && (
          <div className="flex flex-wrap gap-2">
            {STARTERS.map((s) => (
              <button key={s} onClick={() => ask(s)} className="min-h-[2.5rem] rounded-full border border-border px-3.5 text-sm hover:border-primary hover:text-primary text-left">
                {s}
              </button>
            ))}
          </div>
        )}
        {msgs.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : ""}>
            <div className={m.role === "user"
              ? "max-w-[85%] rounded-lg bg-primary px-3.5 py-2 text-sm text-primary-foreground"
              : "max-w-[95%] text-sm leading-relaxed text-foreground whitespace-pre-line"}>
              {m.content}
              {m.sources && m.sources.length > 0 && (
                <p className="mt-2 text-xs text-muted-foreground">
                  More: {m.sources.map((s, j) => (
                    <span key={s}>{j > 0 && " · "}<Link to={s} className="underline underline-offset-2 hover:text-primary">{TITLES[s] ?? "Help article"}</Link></span>
                  ))}
                </p>
              )}
            </div>
          </div>
        ))}
        {busy && <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Looking that up…</p>}
        <div ref={endRef} />
      </div>

      <form onSubmit={(e) => { e.preventDefault(); ask(input); }} className="flex gap-2 border-t border-border p-3">
        <label htmlFor="help-q" className="sr-only">Your question</label>
        <input
          id="help-q"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={600}
          placeholder="e.g. How do I add my day rate?"
          className="min-w-0 flex-1 rounded-md border border-border bg-background px-3 py-2.5 text-base sm:text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <Button type="submit" disabled={busy || !input.trim()} aria-label="Ask">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </section>
  );
};
