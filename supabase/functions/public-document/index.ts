// ═══════════════════════════════════════════════════════════════════
// CUSTOMER LINKS — the page a customer opens from a shared quote/invoice
//
//   POST { token, type: "quote" | "invoice" }                  → view
//   POST { token, type: "quote", action: "accept", name }      → accept
//
// Only the holder of the unguessable share token can see the document.
// Returns just what a customer needs: the line items, totals, the
// business's contact and payment details, and short-lived photo links.
// ═══════════════════════════════════════════════════════════════════

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const TOKEN_RE = /^[A-Za-z0-9_-]{24,64}$/;

// Strip internal pricing metadata (supplier match scores etc.) from lines.
const cleanLines = (lines: any[] = []) =>
  (Array.isArray(lines) ? lines : []).map((l) => ({
    name: l?.name ?? "",
    quantity: l?.quantity ?? l?.hours ?? null,
    unit: l?.unit ?? (l?.hours != null ? "hours" : null),
    cost: Number(l?.cost) || 0,
  }));

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  try {
    const { token, type, action, name } = await req.json().catch(() => ({}));
    if (!TOKEN_RE.test(String(token || "")) || !["quote", "invoice"].includes(type)) {
      return json({ error: "This link isn't valid." }, 404);
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
      auth: { persistSession: false },
    });
    const table = type === "quote" ? "quotes" : "invoices";

    const { data: doc } = await supabase.from(table).select("*").eq("share_token", token).maybeSingle();
    if (!doc) return json({ error: "This link isn't valid or has been withdrawn." }, 404);

    // ── accept ─────────────────────────────────────────────────────
    if (action === "accept") {
      if (type !== "quote") return json({ error: "Only quotes can be accepted." }, 400);
      if (doc.accepted_at) return json({ ok: true, alreadyAccepted: true, accepted_at: doc.accepted_at });
      if (doc.status === "Rejected") return json({ error: "This quote has been withdrawn." }, 409);
      if (doc.valid_until && new Date(doc.valid_until) < new Date(new Date().toDateString())) {
        return json({ error: "This quote has expired. Ask for an updated one." }, 409);
      }
      const signer = String(name || "").trim().slice(0, 120);
      if (signer.length < 2) return json({ error: "Type your name to accept." }, 400);

      const accepted_at = new Date().toISOString();
      const { error } = await supabase.from("quotes")
        .update({ accepted_at, accepted_name: signer, status: "Accepted" })
        .eq("id", doc.id)
        .is("accepted_at", null);
      if (error) throw error;
      return json({ ok: true, accepted_at });
    }

    // ── view ───────────────────────────────────────────────────────
    if (!doc.customer_viewed_at) {
      await supabase.from(table).update({ customer_viewed_at: new Date().toISOString() }).eq("id", doc.id);
    }

    const { data: brand } = await supabase.from("brand_settings").select("*").eq("user_id", doc.user_id).maybeSingle();
    const { data: settings } = await supabase.from("app_settings").select("include_vat").eq("user_id", doc.user_id).maybeSingle();

    let logoUrl: string | null = null;
    if (brand?.logo_url) {
      if (/^https?:\/\//.test(brand.logo_url) && !brand.logo_url.includes("/storage/v1/object/")) {
        logoUrl = brand.logo_url;
      } else {
        const path = brand.logo_url.replace(/^.*\/logos\//, "");
        const { data } = await supabase.storage.from("logos").createSignedUrl(path, 3600);
        logoUrl = data?.signedUrl ?? null;
      }
    }

    let photoUrls: string[] = [];
    if (type === "quote" && Array.isArray(doc.photos) && doc.photos.length) {
      const paths = doc.photos.map((p: any) => p?.path).filter(Boolean).slice(0, 12);
      const { data } = await supabase.storage.from("quote-photos").createSignedUrls(paths, 3600);
      photoUrls = (data || []).map((d) => d.signedUrl).filter(Boolean) as string[];
    }

    const business = {
      name: brand?.company_name || null,
      email: brand?.email || null,
      phone: brand?.phone || null,
      website: brand?.website || null,
      address: brand?.address || null,
      vatNumber: brand?.vat_number || null,
      logoUrl,
      paymentLink: brand?.payment_link || null,
      bank: brand?.account_number
        ? { accountName: brand.account_name, bankName: brand.bank_name, sortCode: brand.sort_code, accountNumber: brand.account_number }
        : null,
      paymentNotes: brand?.payment_notes || null,
    };

    if (type === "quote") {
      const subtotal = Number(doc.grand_total) || 0;
      const vat = settings?.include_vat ? Math.round(subtotal * 0.2 * 100) / 100 : 0;
      const total = Math.round((subtotal + vat) * 100) / 100;
      const deposit = doc.deposit_percent ? Math.round(total * Number(doc.deposit_percent)) / 100 : null;
      return json({
        type,
        business,
        document: {
          reference: doc.id.slice(0, 8).toUpperCase(),
          title: doc.title,
          client: doc.client,
          location: doc.location,
          summary: doc.summary || doc.job_description,
          created_at: doc.created_at,
          valid_until: doc.valid_until,
          status: doc.status,
          accepted_at: doc.accepted_at,
          accepted_name: doc.accepted_name,
          materials: cleanLines(doc.materials),
          labour: cleanLines(doc.labour).map((l) => ({ name: l.name, quantity: null, unit: null, cost: l.cost })),
          overheads: cleanLines(doc.overheads),
          subtotal,
          vat,
          total,
          deposit_percent: doc.deposit_percent,
          deposit,
          photos: photoUrls,
        },
      });
    }

    return json({
      type,
      business,
      document: {
        reference: doc.invoice_number,
        title: doc.title,
        client: doc.client,
        summary: doc.summary,
        date: doc.date,
        due_date: doc.due_date,
        status: doc.status,
        subtotal: Number(doc.amount) || 0,
        vat: Number(doc.tax) || 0,
        total: Number(doc.total) || 0,
      },
    });
  } catch (err) {
    console.error("public-document error:", err);
    return json({ error: "Something went wrong loading this page." }, 500);
  }
});
