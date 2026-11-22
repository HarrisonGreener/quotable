// Early access. While this is on, the site shows an "Early access" badge and the
// launch offer; checkout applies the EARLY code (first 3 months free, limited places,
// capped in Stripe). When places run out, new customers get the normal free month.
// To end early access: set EARLY_ACCESS to false (and switch the EARLY code off in Stripe).
export const EARLY_ACCESS = true;

export const OFFER = EARLY_ACCESS
  ? {
      badge: "Early access",
      cta: "Start free",
      button: "Get 3 months free",
      short: "first 3 months free",
      line: "Early access: your first 3 months free (limited places), then £14.99 a month. Cancel any time.",
      fallback: "If early access places have gone, you still get your first month free.",
    }
  : {
      badge: "",
      cta: "Start free month",
      button: "Start your free month",
      short: "first month free",
      line: "Your first month is free, then £14.99 a month. Cancel any time.",
      fallback: "",
    };
