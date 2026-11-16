// Promo codes you can share as links: quotable.uk/?code=EARLY (any page).
// The code is remembered for this visit and applied at checkout.

const KEY = "quotable_promo";
const VALID = /^[A-Za-z0-9_-]{3,40}$/;

/** Call once on load: picks up ?code= (or ?promo=) from the address. */
export const capturePromoFromUrl = () => {
  if (typeof window === "undefined") return;
  try {
    const params = new URLSearchParams(window.location.search);
    const code = (params.get("code") || params.get("promo") || "").trim();
    if (code && VALID.test(code)) sessionStorage.setItem(KEY, code.toUpperCase());
  } catch { /* storage blocked: the code just won't carry over */ }
};

export const getPromo = (): string | null => {
  try {
    const c = sessionStorage.getItem(KEY);
    return c && VALID.test(c) ? c : null;
  } catch {
    return null;
  }
};

export const clearPromo = () => {
  try { sessionStorage.removeItem(KEY); } catch { /* ignore */ }
};
