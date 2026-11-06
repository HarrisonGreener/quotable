// Who may call a function.
//
// verify_jwt only checks that *a* valid key was sent, and the public anon key counts,
// so anything that crawls merchants, writes shared data or costs money must check
// properly here.

import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const URL = Deno.env.get("SUPABASE_URL") ?? "";

export const serviceClient = (): SupabaseClient =>
  createClient(URL, SERVICE_KEY, { auth: { persistSession: false } });

const bearer = (req: Request) => (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "").trim();

/** The scheduler and other server functions call with the service-role key. */
export const isServiceCall = (req: Request) => {
  const t = bearer(req);
  return !!t && !!SERVICE_KEY && t === SERVICE_KEY;
};

/** The signed-in user, or null for anon/invalid tokens. */
export const getCaller = async (req: Request) => {
  const t = bearer(req);
  if (!t || t === SERVICE_KEY) return null;
  const { data, error } = await serviceClient().auth.getUser(t);
  return error ? null : data.user;
};

export const isAdmin = async (userId: string) => {
  const { data } = await serviceClient().from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  return !!data;
};

const deny = (status: number, error: string, cors: Record<string, string>) =>
  new Response(JSON.stringify({ error }), { status, headers: { ...cors, "Content-Type": "application/json" } });

/**
 * Allow only the scheduler / other functions (service key) or a signed-in admin.
 * Returns a Response to send back when the caller isn't allowed, otherwise null.
 */
export const requireAdminOrService = async (req: Request, cors: Record<string, string> = {}): Promise<Response | null> => {
  if (isServiceCall(req)) return null;
  const user = await getCaller(req);
  if (!user) return deny(401, "Sign in required", cors);
  if (!(await isAdmin(user.id))) return deny(403, "Admins only", cors);
  return null;
};
