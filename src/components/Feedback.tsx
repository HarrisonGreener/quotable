import { useEffect, useState } from "react";
import { MessageSquareHeart, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { COMPANY } from "@/config/company";
import { EARLY_ACCESS } from "@/config/offer";

// Feedback: an email link pre-filled with a subject and a few prompts, a small
// dismissable card on the dashboard during early access, and a sidebar link.

export const feedbackHref = () => {
  const subject = "Quotable feedback";
  const body = [
    "What I do (trade):",
    "",
    "What worked well:",
    "",
    "What was confusing or didn't work:",
    "",
    "One thing I'd add or change:",
    "",
  ].join("\n");
  return `mailto:${COMPANY.supportEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
};

const KEY = "quotable_feedback_card_dismissed";

export const FeedbackCard = () => {
  const [show, setShow] = useState(false);
  useEffect(() => {
    let dismissed = false;
    try { dismissed = localStorage.getItem(KEY) === "1"; } catch { /* storage blocked */ }
    setShow(EARLY_ACCESS && !dismissed);
  }, []);
  if (!show) return null;
  const close = () => {
    setShow(false);
    try { localStorage.setItem(KEY, "1"); } catch { /* ignore */ }
  };
  return (
    <div className="relative rounded-md border border-accent/30 bg-accent/5 p-4 pr-10">
      <button onClick={close} aria-label="Close" className="absolute right-1 top-1 grid h-9 w-9 place-items-center rounded-md text-muted-foreground hover:text-foreground">
        <X className="h-4 w-4" />
      </button>
      <div className="flex gap-3">
        <MessageSquareHeart className="mt-0.5 h-5 w-5 shrink-0 text-accent" aria-hidden />
        <div>
          <p className="font-semibold text-primary">You're one of our first users</p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Quotable is in early access, and your feedback shapes it before full launch. If a quote's off, something's
            confusing, or there's a feature you'd use every day, tell us. We read every message.
          </p>
          <Button asChild size="sm" variant="outline" className="mt-3">
            <a href={feedbackHref()}>Send feedback</a>
          </Button>
        </div>
      </div>
    </div>
  );
};
