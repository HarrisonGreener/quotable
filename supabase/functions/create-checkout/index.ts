import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    logStep("Function started");

    const { priceId, promoCode } = await req.json();
    if (!priceId) throw new Error("Price ID is required");
    // Only Quotable's own plans can be bought here (set STRIPE_PRICE_IDS to override, comma-separated)
    const allowed = (Deno.env.get("STRIPE_PRICE_IDS") || "price_1UcZxJIlyZyID4OeJdFgtWyc,price_1UcZxKIlyZyID4OeQHFbHXLw")
      .split(",").map((s) => s.trim()).filter(Boolean);
    if (!allowed.includes(priceId)) throw new Error("Unknown plan");
    logStep("Price ID received", { priceId });

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { 
      apiVersion: "2025-08-27.basil" 
    });

    // Check if customer already exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing customer", { customerId });
    }

    const origin = req.headers.get("origin") || "https://quotable.uk";

    // The free month is for new customers only: not again after cancelling and coming back
    let hadSubscription = false;
    if (customerId) {
      const previous = await stripe.subscriptions.list({ customer: customerId, status: "all", limit: 1 });
      hadSubscription = previous.data.length > 0;
    }

    // Early access: new customers get the EARLY deal automatically while it lasts
    // (capped in Stripe). A code they bring with them takes priority.
    const EARLY_ACCESS_CODE = Deno.env.get("EARLY_ACCESS_CODE") ?? "EARLY";
    const code = typeof promoCode === "string" && promoCode ? promoCode : (!hadSubscription && EARLY_ACCESS_CODE) || "";

    let discountId: string | undefined;
    let freeForever = false;
    if (/^[A-Za-z0-9_-]{3,40}$/.test(code)) {
      const found = await stripe.promotionCodes.list({ code, active: true, limit: 1 });
      const promo = found.data[0] as unknown as Record<string, any> | undefined;
      discountId = promo?.id;
      // Tester codes (100% off for ever) don't ask for a card
      let coupon = promo?.coupon ?? promo?.promotion?.coupon;
      if (typeof coupon === "string") coupon = await stripe.coupons.retrieve(coupon);
      freeForever = coupon?.percent_off === 100 && coupon?.duration === "forever";
      logStep("Promo code", { code, applied: !!discountId, freeForever });
    }

    const makeSession = (withDiscount: boolean) => stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      // A code replaces the free month (e.g. EARLY = first 3 months free); otherwise new customers get 30 days free
      ...(hadSubscription || (withDiscount && discountId) ? {} : { subscription_data: { trial_period_days: 30 } }),
      payment_method_collection: withDiscount && freeForever ? "if_required" : "always",
      ...(withDiscount && discountId ? { discounts: [{ promotion_code: discountId }] } : { allow_promotion_codes: true }),
      success_url: `${origin}/subscription-success`,
      cancel_url: `${origin}/?checkout=cancelled`,
    });

    let session;
    try {
      session = await makeSession(true);
    } catch (e) {
      // e.g. the code is used up or this customer isn't eligible: carry on without it
      if (!discountId) throw e;
      logStep("Code not accepted, continuing without it", { message: e instanceof Error ? e.message : String(e) });
      session = await makeSession(false);
    }

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
