// Edge Function: invite-user
// Admin-only. Sends a Supabase invitation email AND records the user's role.
//
// Request body: { email: string, role: "admin" | "researcher", redirectTo: string }
// Auth header: caller's Supabase access token (must be an admin in user_roles).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let payload: { email?: string; role?: string; redirectTo?: string };
  try {
    payload = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const email = payload.email?.trim().toLowerCase();
  const role = payload.role;
  const redirectTo = payload.redirectTo;

  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return json({ error: "Invalid email" }, 400);
  }
  if (role !== "admin" && role !== "researcher") {
    return json({ error: "Invalid role" }, 400);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Missing Authorization header" }, 401);

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
  const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // 1) Verify the caller is an admin (using their JWT).
  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData?.user?.email) {
    return json({ error: "Invalid session" }, 401);
  }

  const callerEmail = userData.user.email.toLowerCase();
  const { data: callerRole } = await userClient
    .from("user_roles")
    .select("role")
    .eq("email", callerEmail)
    .maybeSingle();

  if (callerRole?.role !== "admin") {
    return json({ error: "Admin access required" }, 403);
  }

  // 2) Use service role to invite + write the role row.
  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const { error: inviteErr } = await adminClient.auth.admin.inviteUserByEmail(
    email,
    redirectTo ? { redirectTo } : undefined,
  );
  if (inviteErr && !/already.*registered/i.test(inviteErr.message)) {
    return json({ error: inviteErr.message }, 400);
  }

  const { error: roleErr } = await adminClient
    .from("user_roles")
    .upsert({ email, role });
  if (roleErr) return json({ error: roleErr.message }, 500);

  return json({ ok: true });
});
