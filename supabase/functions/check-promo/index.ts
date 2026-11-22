// Checks a promo code before checkout and says what it gives, e.g. "First 3 months free".
// Signed-in users only; reveals nothing beyond whether the code works and its offer.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const describe = (c: Record<string, any>) => {
  if (c.percent_off === 100 && c.duration === "forever") return "Free for good";
  if (c.percent_off === 100 && c.duration === "repeating") {
    const m = c.duration_in_months;
    return m === 1 ? "First month free" : `First ${m} months free`;
  }
  if (c.percent_off) {
    const when = c.duration === "forever" ? "" : c.duration === "once" ? " off your first payment" :
      ` off for ${c.duration_in_months} months`;
    return `${c.percent_off}%${when || " off"}`;
  }
  if (c.amount_off) return `£${(c.amount_off / 100).toFixed(2)} off`;
  return "Discount applied";
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const token = (req.headers.get("Authorization") || "").replace("Bearer ", "");
    const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "");
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) return json({ error: "Please sign in" }, 401);

    const { code } = await req.json().catch(() => ({}));
    const clean = String(code || "").trim().toUpperCase();
    if (!/^[A-Z0-9_-]{3,40}$/.test(clean)) return json({ valid: false });

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2025-08-27.basil" });
    const found = await stripe.promotionCodes.list({ code: clean, active: true, limit: 1 });
    const promo = found.data[0] as unknown as Record<string, any> | undefined;
    if (!promo) return json({ valid: false });
    if (promo.max_redemptions && promo.times_redeemed >= promo.max_redemptions) return json({ valid: false, reason: "used up" });

    let coupon = promo.coupon ?? promo.promotion?.coupon;
    if (typeof coupon === "string") coupon = await stripe.coupons.retrieve(coupon);
    if (!coupon?.valid) return json({ valid: false });
    return json({ valid: true, code: clean, offer: describe(coupon) });
  } catch (e) {
    console.error("check-promo", e);
    return json({ error: "Couldn't check that code right now" }, 500);
  }
});
