// Sends Quotable's own emails (welcome etc.) from @quotable.uk over SMTP, through
// Resend (smtp.resend.com) or Google Workspace (smtp.gmail.com). Server secrets:
//   SMTP_HOST      e.g. smtp.resend.com (defaults to smtp.gmail.com)
//   SMTP_USER      "resend" for Resend, or the Workspace account
//   SMTP_PASSWORD  the Resend API key, or a Google app password
//   SMTP_FROM      sender, e.g. "Quotable <support@quotable.uk>"
// Port 465 (TLS) is used because Supabase blocks outgoing 25 and 587.
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

export const SUPPORT_EMAIL = "support@quotable.uk";
const NAVY = "#0b2741";
const ORANGE = "#c5571b";

export const emailConfigured = () => !!(Deno.env.get("SMTP_USER") && Deno.env.get("SMTP_PASSWORD"));

export const escapeHtml = (t: string) =>
  t.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

/** Quotable-branded email shell. `body` is trusted HTML built by us. */
export const brandedEmail = (opts: { heading: string; body: string; button?: { label: string; url: string } }) => `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${opts.heading}</title><link href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@112,800&display=swap" rel="stylesheet"></head>
<body style="margin:0;padding:0;background:#f4f2ee;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1f2933;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f2ee;padding:24px 12px;"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:10px;overflow:hidden;">
<tr><td bgcolor="${NAVY}" style="background:${NAVY};background-color:${NAVY};padding:24px 32px 20px;">
<img src="https://quotable.uk/email/logo-navy-bg.png" width="160" height="40" alt="Quotable" style="display:block;border:0;outline:none;width:160px;height:40px;background:#0b2741;color:#ffffff;font-size:22px;font-weight:700;">
</td></tr>
<tr><td style="padding:32px;">
<h1 style="margin:0 0 16px;font-family:Archivo,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-stretch:112%;font-weight:800;letter-spacing:-0.01em;font-size:22px;line-height:1.3;color:${NAVY};">${opts.heading}</h1>
<div style="font-size:16px;line-height:1.6;color:#374151;">${opts.body}</div>
${opts.button ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 8px;"><tr><td style="background:${ORANGE};border-radius:6px;">
<a href="${opts.button.url}" style="display:inline-block;padding:14px 26px;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;">${opts.button.label}</a>
</td></tr></table>` : ""}
</td></tr>
<tr><td style="padding:20px 32px;border-top:1px solid #ece8e1;font-size:13px;line-height:1.5;color:#6b7280;">
Questions? Reply to this email or contact <a href="mailto:${SUPPORT_EMAIL}" style="color:${NAVY};">${SUPPORT_EMAIL}</a>.<br>
Quotable Ltd · quoting software for UK tradespeople · <a href="https://quotable.uk" style="color:${NAVY};">quotable.uk</a>
</td></tr>
</table></td></tr></table></body></html>`;

export const sendEmail = async (to: string, subject: string, html: string, text: string) => {
  const username = Deno.env.get("SMTP_USER")!;
  const client = new SMTPClient({
    connection: {
      hostname: Deno.env.get("SMTP_HOST") || "smtp.gmail.com",
      port: 465,
      tls: true,
      auth: { username, password: Deno.env.get("SMTP_PASSWORD")! },
    },
  });
  try {
    await client.send({
      from: Deno.env.get("SMTP_FROM") || `Quotable <${username}>`,
      replyTo: SUPPORT_EMAIL,
      to,
      subject,
      content: text,
      html,
    });
  } finally {
    await client.close();
  }
};
