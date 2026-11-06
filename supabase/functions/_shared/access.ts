// Server-side checks before spending AI quota: is this account paying (or in its free
// month), and has it stayed within a fair daily limit? The paywall in the browser is
// only a screen; these are the checks that actually hold.

import Stripe from "https://esm.sh/stripe@18.5.0";
import { serviceClient, isAdmin } from "./guard.ts";

type Who = { id: string; email?: string | null };

const cache = new Map<string, { ok: boolean; at: number }>();
const TEN_MIN = 10 * 60 * 1000;

/** Active or trialing Stripe subscription, or an admin. Allowed when Stripe isn't set up (development). */
export const hasPaidAccess = async (user: Who): Promise<boolean> => {
  const hit = cache.get(user.id);
  if (hit && Date.now() - hit.at < TEN_MIN) return hit.ok;

  let ok = false;
  if (await isAdmin(user.id)) ok = true;
  else {
    const key = Deno.env.get("STRIPE_SECRET_KEY");
    if (!key) ok = true;
    else if (user.email) {
      try {
        const stripe = new Stripe(key, { apiVersion: "2025-08-27.basil" });
        const customers = await stripe.customers.list({ email: user.email, limit: 3 });
        for (const c of customers.data) {
          const subs = await stripe.subscriptions.list({ customer: c.id, status: "all", limit: 10 });
          if (subs.data.some((s) => s.status === "active" || s.status === "trialing")) { ok = true; break; }
        }
      } catch (e) {
        // Don't lock paying customers out because Stripe had a blip
        console.error("Subscription check failed, allowing:", e);
        ok = true;
      }
    }
  }
  cache.set(user.id, { ok, at: Date.now() });
  return ok;
};

/** Counts one use of `kind` today and says whether it's within the daily limit. */
export const withinDailyLimit = async (userId: string, kind: "quote" | "summary", limit: number): Promise<boolean> => {
  const { data, error } = await serviceClient().rpc("bump_ai_usage", { _user_id: userId, _kind: kind, _limit: limit });
  if (error) { console.error("Usage counter failed, allowing:", error.message); return true; }
  return data === true;
};

const reply = (status: number, error: string, cors: Record<string, string>) =>
  new Response(JSON.stringify({ error }), { status, headers: { ...cors, "Content-Type": "application/json" } });

/** Both checks; returns a Response to send back if the call shouldn't go ahead. */
export const checkAiAccess = async (user: Who, kind: "quote" | "summary", cors: Record<string, string>) => {
  if (!(await hasPaidAccess(user))) return reply(402, "Your subscription isn't active. Start or renew it to create quotes.", cors);
  const limit = Number(Deno.env.get(kind === "quote" ? "QUOTES_PER_DAY" : "SUMMARIES_PER_DAY") || (kind === "quote" ? 60 : 120));
  if (!(await withinDailyLimit(user.id, kind, limit))) {
    return reply(429, `You've reached today's limit of ${limit}. It resets at midnight; contact us if you need more.`, cors);
  }
  return null;
};
