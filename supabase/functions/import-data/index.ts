// ═══════════════════════════════════════════════════════════════════
// ONE-OFF DATA IMPORT (moving off Lovable)
//
// Receives rows pushed from the old Lovable database and upserts them into
// this project. It does nothing unless the IMPORT_TOKEN secret is set, and
// every request must carry that token. Delete the secret (and this function)
// once the move is done:
//   supabase secrets unset IMPORT_TOKEN
//   supabase functions delete import-data
// ═══════════════════════════════════════════════════════════════════

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Tables we accept, in a safe order, with their conflict key.
const TABLES: Record<string, string> = {
  price_sources: "id",
  supplier_configs: "id",
  regional_adjustments: "id",
  compliance_rules: "id",
  quote_templates_library: "id",
  market_prices: "id",
  // per-user data (after auth_users)
  user_roles: "id",
  user_terms_acceptance: "id",
  app_settings: "id",
  user_theme_settings: "id",
  brand_settings: "id",
  clients: "id",
  inventory: "id",
  quote_templates: "id",
  pdf_templates: "id",
  invoice_templates: "id",
  quotes: "id",
  invoices: "id",
  recurring_invoices: "id",
  schedules: "id",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  const token = Deno.env.get("IMPORT_TOKEN");
  if (!token) return json({ error: "Import is switched off" }, 404);
  if (req.method !== "POST") return json({ error: "POST only" }, 405);
  if (req.headers.get("x-import-token") !== token) return json({ error: "Bad token" }, 401);

  const { table, rows } = await req.json().catch(() => ({}));
  if (!Array.isArray(rows)) return json({ error: "rows must be an array" }, 400);

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });

  // Users keep their existing passwords: we import the bcrypt hash, not the password.
  if (table === "auth_users") {
    const results = { created: 0, skipped: 0, errors: [] as string[] };
    for (const u of rows) {
      const { error } = await supabase.auth.admin.createUser({
        id: u.id,
        email: u.email,
        password_hash: u.encrypted_password || undefined,
        email_confirm: !!u.email_confirmed_at,
        user_metadata: u.raw_user_meta_data ?? {},
        app_metadata: u.raw_app_meta_data ?? {},
      } as any);
      if (!error) results.created++;
      else if (/already|exists|registered/i.test(error.message)) results.skipped++;
      else results.errors.push(`${u.email}: ${error.message}`);
    }
    console.log(`auth_users:`, results);
    return json(results);
  }

  const conflict = TABLES[table];
  if (!conflict) return json({ error: `Table ${table} is not importable` }, 400);

  const { error, count } = await supabase.from(table).upsert(rows, { onConflict: conflict, count: "exact" });
  if (error) {
    console.error(`${table}:`, error);
    return json({ table, error: error.message }, 500);
  }
  console.log(`${table}: ${count ?? rows.length} rows`);
  return json({ table, rows: count ?? rows.length });
});
