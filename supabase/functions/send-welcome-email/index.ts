// Welcome email, sent once when someone first signs in. Only ever goes to the
// signed-in user's own address, and the name is escaped.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { brandedEmail, emailConfigured, escapeHtml, sendEmail } from "../_shared/email.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const token = (req.headers.get("Authorization") || "").replace("Bearer ", "");
    if (!token) return json({ error: "Missing authorization header" }, 401);

    const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "");
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user?.email) return json({ error: "Unauthorized" }, 401);

    if (!emailConfigured()) return json({ skipped: "email not set up" });

    const body: { userName?: string } = await req.json().catch(() => ({}));
    const first = String(user.user_metadata?.full_name || body.userName || "").trim().split(/\s+/)[0].slice(0, 40);
    const hi = first ? `Hi ${escapeHtml(first)},` : "Hi,";

    const html = brandedEmail({
      heading: "Welcome to Quotable",
      body: `<p style="margin:0 0 14px;">${hi}</p>
<p style="margin:0 0 14px;">Thanks for signing up. Here's how to get your first quote out quickly:</p>
<ol style="margin:0 0 14px;padding-left:20px;">
<li style="margin-bottom:8px;"><strong>Set your rates.</strong> Add your hourly and day rate in Account so labour is priced your way.</li>
<li style="margin-bottom:8px;"><strong>Describe a job.</strong> Go to Quotes, then Create Quote, and type or say the job with sizes, e.g. "Re-skim a 3m by 3m bedroom, walls sound".</li>
<li style="margin-bottom:8px;"><strong>Check and send.</strong> Materials come priced from UK merchants. Check the lines, then send it by WhatsApp or email. Your customer can accept with one tap.</li>
</ol>
<p style="margin:0 0 14px;"><strong>You're one of our first users.</strong> Quotable is in early access, so your feedback really shapes it. Just reply to this email with anything that's off, confusing or missing. We read every message.</p>
<p style="margin:0;">Tip: put Quotable on your phone's home screen so it opens like an app. Steps at <a href="https://quotable.uk/app" style="color:#0b2741;">quotable.uk/app</a>.</p>`,
      button: { label: "Make your first quote", url: "https://quotable.uk/quotes" },
    });
    const text = `${first ? `Hi ${first},` : "Hi,"}

Thanks for signing up to Quotable. To get your first quote out:
1. Set your hourly and day rate in Account.
2. Go to Quotes > Create Quote and describe the job with sizes.
3. Check the priced lines, then send it by WhatsApp or email.

Make your first quote: https://quotable.uk/quotes
Put it on your home screen: https://quotable.uk/app

You're one of our first users. Quotable is in early access, so just reply to this email with anything that's off, confusing or missing. We read every message.

Questions? Reply to this email or contact support@quotable.uk.`;

    await sendEmail(user.email, "Welcome to Quotable", html, text);
    return json({ success: true });
  } catch (error) {
    console.error("Welcome email failed:", error);
    return json({ error: "Couldn't send the welcome email" }, 500);
  }
});
