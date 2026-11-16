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
    const allowed = (Deno.env.get("STRIPE_PRICE_IDS") || "price_1SfRczEbsySHJL70bX2oXV2R,price_1SfRdPEbsySHJL708DMVKQW6")
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

    let discountId: string | undefined;
    if (typeof promoCode === "string" && /^[A-Za-z0-9_-]{3,40}$/.test(promoCode)) {
      const found = await stripe.promotionCodes.list({ code: promoCode, active: true, limit: 1 });
      discountId = found.data[0]?.id;
      logStep("Promo code", { promoCode, applied: !!discountId });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      ...(hadSubscription ? {} : { subscription_data: { trial_period_days: 30 } }),
      payment_method_collection: "always",
      // A shared promo link pre-applies its code; otherwise people can type one at checkout
      ...(discountId ? { discounts: [{ promotion_code: discountId }] } : { allow_promotion_codes: true }),
      success_url: `${origin}/subscription-success`,
      cancel_url: `${origin}/?checkout=cancelled`,
    });

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
