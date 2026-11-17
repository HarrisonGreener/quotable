// Cancel or resume the signed-in user's Quotable subscription from inside the app.
// Cancelling takes effect at the end of the period already paid for (or the free
// month), so nobody loses time they've paid for. Resuming undoes a pending cancel.
//
// Body: { action: "cancel" | "resume", reason?: string }

import Stripe from "https://esm.sh/stripe@18.5.0";
import { serviceClient } from "../_shared/guard.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) return json({ error: "Payments aren't set up yet" }, 503);

    const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    const { data: userData, error: userError } = await serviceClient().auth.getUser(token);
    const user = userData?.user;
    if (userError || !user?.email) return json({ error: "Sign in required" }, 401);

    const { action, reason } = await req.json().catch(() => ({}));
    if (action !== "cancel" && action !== "resume") return json({ error: "Unknown action" }, 400);

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 3 });

    // Find this user's live subscription (active or in the free month)
    let sub: Stripe.Subscription | undefined;
    for (const c of customers.data) {
      const subs = await stripe.subscriptions.list({ customer: c.id, status: "all", limit: 10 });
      sub = subs.data.find((s) => s.status === "active" || s.status === "trialing");
      if (sub) break;
    }
    if (!sub) return json({ error: "No active subscription found" }, 404);

    const updated = await stripe.subscriptions.update(sub.id, {
      cancel_at_period_end: action === "cancel",
      ...(action === "cancel" && typeof reason === "string" && reason
        ? { cancellation_details: { comment: reason.slice(0, 500) } }
        : {}),
    });

    const endsAt = updated.cancel_at ?? updated.trial_end ?? (updated.items.data[0] as { current_period_end?: number }).current_period_end;
    console.log(`[CANCEL-SUBSCRIPTION] ${action} ${sub.id} for ${user.id}`);
    return json({
      cancelAtPeriodEnd: updated.cancel_at_period_end,
      accessUntil: endsAt ? new Date(endsAt * 1000).toISOString() : null,
    });
  } catch (e) {
    console.error("[CANCEL-SUBSCRIPTION] failed", e);
    return json({ error: "Couldn't update your subscription. Please try again." }, 500);
  }
});
