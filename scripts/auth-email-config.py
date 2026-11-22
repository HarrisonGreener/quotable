"""Builds the Supabase Auth email settings (branded templates, and the Google
Workspace mailbox as the sender when SMTP_USER/SMTP_PASSWORD are set).
Used by the deploy workflow; prints JSON for the Management API."""
import json, os, re, pathlib

DIR = pathlib.Path(__file__).resolve().parent.parent / "supabase" / "auth-emails"
SUBJECTS = {
    "confirmation": "Confirm your email for Quotable",
    "recovery": "Reset your Quotable password",
    "email_change": "Confirm your new email for Quotable",
    "magic_link": "Your Quotable sign-in link",
    "invite": "You've been invited to Quotable",
}
cfg = {"hook_send_email_enabled": False}
user, pw = os.environ.get("SMTP_USER", ""), os.environ.get("SMTP_PASSWORD", "")
if user and pw:
    # Supabase only allows custom templates with your own mail server
    for k, subj in SUBJECTS.items():
        cfg[f"mailer_subjects_{k}"] = subj
        cfg[f"mailer_templates_{k}_content"] = (DIR / f"{k}.html").read_text()
    sender = os.environ.get("SMTP_FROM", "") or user
    m = re.match(r"\s*(.*?)\s*<([^>]+)>\s*$", sender)
    name, addr = (m.group(1) or "Quotable", m.group(2)) if m else ("Quotable", sender.strip())
    cfg.update({
        "smtp_host": os.environ.get("SMTP_HOST", "smtp.gmail.com"),
        "smtp_port": "465",
        "smtp_user": user,
        "smtp_pass": pw,
        "smtp_admin_email": addr,
        "smtp_sender_name": name,
        "smtp_max_frequency": 30,
        "rate_limit_email_sent": 60,
    })
print(json.dumps(cfg))
