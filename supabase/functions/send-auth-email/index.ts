import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const hookSecret = Deno.env.get("SEND_EMAIL_HOOK_SECRET") as string;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const generatePasswordResetHTML = (resetLink: string, userEmail: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Ubuntu, sans-serif; background-color: #f6f9fc; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px; border-radius: 8px;">
    <h1 style="color: #333; font-size: 28px; font-weight: bold; margin: 0 0 30px 0;">
      Reset Your Password
    </h1>
    
    <p style="color: #333; font-size: 16px; line-height: 26px; margin: 0 0 20px 0;">
      Hi there,
    </p>
    
    <p style="color: #333; font-size: 16px; line-height: 26px; margin: 0 0 30px 0;">
      We received a request to reset your password for <strong>${userEmail}</strong>.
    </p>
    
    <div style="text-align: center; margin: 0 0 30px 0;">
      <a href="${resetLink}" style="display: inline-block; background-color: #ff6b35; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 16px; font-weight: 600;">
        Reset Password
      </a>
    </div>
    
    <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 16px; margin: 0 0 30px 0;">
      <p style="color: #856404; font-size: 15px; line-height: 22px; margin: 0;">
        ⚠️ <strong>This link expires in 10 minutes.</strong>
      </p>
    </div>
    
    <p style="color: #666; font-size: 14px; line-height: 22px; margin: 0 0 30px 0;">
      If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.
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
    const payload = await req.text();
    const headers = Object.fromEntries(req.headers);
    
    // Verify webhook signature
    const wh = new Webhook(hookSecret);
    let verifiedPayload;
    
    try {
      verifiedPayload = wh.verify(payload, headers);
    } catch (error) {
      console.error("Webhook verification failed:", error);
      return new Response(
        JSON.stringify({ error: "Webhook verification failed" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const {
      user,
      email_data: { token, token_hash, redirect_to, email_action_type },
    } = verifiedPayload as {
      user: {
        email: string;
      };
      email_data: {
        token: string;
        token_hash: string;
        redirect_to: string;
        email_action_type: string;
      };
    };

    console.log(`Processing ${email_action_type} email for: ${user.email}`);

    // Handle password reset emails
    if (email_action_type === "recovery") {
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const resetLink = `${supabaseUrl}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`;
      
      const html = generatePasswordResetHTML(resetLink, user.email);

      const { error } = await resend.emails.send({
        from: "Quotable <hello@mail.quotable-it.co.uk>",
        to: [user.email],
        subject: "Reset Your Quotable Password",
        html,
      });

      if (error) {
        console.error("Error sending password reset email:", error);
        throw error;
      }

      console.log("Password reset email sent successfully to:", user.email);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-auth-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
