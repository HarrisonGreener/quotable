import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  userName: string;
  userEmail: string;
}

const generateWelcomeEmailHTML = (userName: string, userEmail: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Ubuntu, sans-serif; background-color: #f6f9fc; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px; border-radius: 8px;">
    <h1 style="color: #333; font-size: 28px; font-weight: bold; margin: 0 0 30px 0;">
      Welcome to Quotable
    </h1>
    
    <p style="color: #333; font-size: 16px; line-height: 26px; margin: 0 0 20px 0;">
      Hi ${userName || 'there'},
    </p>
    
    <p style="color: #333; font-size: 16px; line-height: 26px; margin: 0 0 30px 0;">
      Thank you for joining Quotable! We're excited to help you streamline your quoting, invoicing, and scheduling.
    </p>
    
    <div style="background-color: #f8fafc; padding: 24px; border-radius: 8px; margin: 0 0 30px 0;">
      <p style="color: #333; font-size: 18px; font-weight: 600; margin: 0 0 16px 0;">
        Get started with:
      </p>
      <p style="color: #555; font-size: 15px; line-height: 24px; margin: 8px 0;">
        📝 Create professional quotes in minutes
      </p>
      <p style="color: #555; font-size: 15px; line-height: 24px; margin: 8px 0;">
        💼 Convert quotes to invoices instantly
      </p>
      <p style="color: #555; font-size: 15px; line-height: 24px; margin: 8px 0;">
        📅 Schedule jobs with drag-and-drop calendar
      </p>
      <p style="color: #555; font-size: 15px; line-height: 24px; margin: 8px 0;">
        📊 Track payments and tax automatically
      </p>
    </div>
    
    <p style="color: #333; font-size: 16px; line-height: 26px; margin: 0 0 30px 0;">
      Your account is now active and ready to use at ${userEmail}.
    </p>
    
    <hr style="border: none; border-top: 1px solid #e6ebf1; margin: 30px 0;">
    
    <p style="color: #8898aa; font-size: 12px; line-height: 16px; margin: 0;">
      Need help? Contact us at support@quotable-it.co.uk
    </p>
  </div>
</body>
</html>
`;

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract JWT token from "Bearer <token>"
    const token = authHeader.replace('Bearer ', '');

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Pass token directly to getUser() for edge function authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { userName, userEmail }: WelcomeEmailRequest = await req.json();

    console.log("Sending welcome email to:", userEmail);

    const html = generateWelcomeEmailHTML(userName, userEmail);

    const emailResponse = await resend.emails.send({
      from: "Quotable <hello@mail.quotable-it.co.uk>",
      to: [userEmail],
      subject: "Welcome to Quotable! 🎉",
      html,
    });

    console.log("Welcome email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, messageId: emailResponse.data?.id }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error sending welcome email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
