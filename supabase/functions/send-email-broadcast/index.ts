/**
 * Supabase Edge Function: admin email broadcast via Resend.
 *
 * Secrets:
 *   RESEND_API_KEY
 *   RESEND_FROM       e.g. "3juma <hello@3juma.app>" (verified in Resend)
 * Auto-provided:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * Deploy:
 *   npx supabase functions deploy send-email-broadcast --no-verify-jwt
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { Resend } from "npm:resend@4.0.0";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Audience = "all" | "customers" | "workers" | "incomplete_workers";
type UserRow = {
  id: string;
  auth_id: string | null;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: string;
};
type WorkerProfileRow = {
  id: string;
  user_id: string;
  trade: string | null;
  area: string | null;
  verification_status: string | null;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Missing authorization" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const resendKey = Deno.env.get("RESEND_API_KEY");
    const from = Deno.env.get("RESEND_FROM") || Deno.env.get("REMINDER_FROM") || "3juma <onboarding@resend.dev>";
    const appUrl = Deno.env.get("SITE_URL") || Deno.env.get("VITE_SITE_URL") || "https://www.3juma.app";

    if (!supabaseUrl || !serviceKey || !resendKey) {
      return json({ error: "Missing SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or RESEND_API_KEY" }, 500);
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceKey);
    const jwt = authHeader.replace("Bearer ", "");
    const { data: authData } = await supabaseAdmin.auth.getUser(jwt);
    const authedUser = authData?.user ?? null;
    if (!authedUser) return json({ error: "Unauthorized" }, 401);

    const { data: adminRow } = await supabaseAdmin
      .from("users")
      .select("role")
      .eq("auth_id", authedUser.id)
      .maybeSingle();
    if (adminRow?.role !== "admin") return json({ error: "Admin only" }, 403);

    const body = (await req.json()) as Record<string, unknown>;
    const audience = String(body.audience ?? "all") as Audience;
    const subject = String(body.subject ?? "").trim();
    const message = String(body.message ?? "").trim();
    const ctaLabel = String(body.ctaLabel ?? "Open 3juma").trim();
    const ctaUrlRaw = String(body.ctaUrl ?? appUrl).trim();
    const ctaUrl = resolveUrl(ctaUrlRaw, appUrl);

    if (!["all", "customers", "workers", "incomplete_workers"].includes(audience)) {
      return json({ error: "Invalid audience" }, 400);
    }
    if (!subject || !message) return json({ error: "Subject and message are required" }, 400);
    if (subject.length > 120) return json({ error: "Subject is too long" }, 400);
    if (message.length > 3000) return json({ error: "Message is too long" }, 400);

    const recipients = await getRecipients(supabaseAdmin, audience);
    if (recipients.length === 0) return json({ ok: true, sent: 0, recipients: 0 });

    const resend = new Resend(resendKey);
    let sent = 0;
    const errors: string[] = [];

    for (const recipient of recipients.slice(0, 1000)) {
      try {
        const { error } = await resend.emails.send({
          from,
          to: [recipient.email],
          subject,
          html: renderEmail({
            name: recipient.full_name || "there",
            subject,
            message,
            ctaLabel,
            ctaUrl,
          }),
        });
        if (error) throw new Error(error.message);
        sent += 1;
      } catch (err) {
        errors.push(`${recipient.email}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    return json({
      ok: true,
      sent,
      recipients: recipients.length,
      failed: errors.length,
      errors: errors.slice(0, 5),
    });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : String(err) }, 500);
  }
});

async function getRecipients(supabaseAdmin: ReturnType<typeof createClient>, audience: Audience): Promise<UserRow[]> {
  let query = supabaseAdmin
    .from("users")
    .select("id, auth_id, email, full_name, phone, role")
    .not("email", "is", null);

  if (audience === "customers") query = query.eq("role", "customer");
  if (audience === "workers" || audience === "incomplete_workers") query = query.eq("role", "worker");

  const { data, error } = await query;
  if (error) throw error;

  const users = ((data || []) as UserRow[]).filter((u) => !!u.email);
  if (audience !== "incomplete_workers") return uniqueByEmail(users);

  const workerIds = users.map((u) => u.id);
  if (workerIds.length === 0) return [];

  const { data: profiles, error: profileErr } = await supabaseAdmin
    .from("worker_profiles")
    .select("id, user_id, trade, area, verification_status")
    .in("user_id", workerIds);
  if (profileErr) throw profileErr;

  const profileByUser = new Map((profiles || []).map((p: WorkerProfileRow) => [p.user_id, p]));
  const profileIds = (profiles || []).map((p: WorkerProfileRow) => p.id);
  const { data: docs, error: docsErr } = profileIds.length
    ? await supabaseAdmin
        .from("verification_documents")
        .select("worker_id, document_type")
        .in("worker_id", profileIds)
    : { data: [], error: null };
  if (docsErr) throw docsErr;

  const docsByProfile = new Map<string, string[]>();
  for (const d of docs || []) {
    const current = docsByProfile.get(d.worker_id) || [];
    current.push(d.document_type);
    docsByProfile.set(d.worker_id, current);
  }

  return uniqueByEmail(
    users.filter((u) => {
      const profile = profileByUser.get(u.id);
      const docTypes = profile ? docsByProfile.get(profile.id) || [] : [];
      return isIncompleteWorker(u, profile, docTypes);
    }),
  );
}

function isIncompleteWorker(user: UserRow, profile: WorkerProfileRow | undefined, docTypes: string[]) {
  const hasPhone = !!user.phone;
  const hasTrade = !!profile?.trade && profile.trade !== "none";
  const hasArea = !!profile?.area && profile.area !== "none";
  const hasFront = docTypes.includes("ghana_card_front");
  const hasBack = docTypes.includes("ghana_card_back");
  const submitted = profile?.verification_status === "pending" || profile?.verification_status === "approved";
  return !(hasPhone && hasTrade && hasArea && hasFront && hasBack && submitted);
}

function uniqueByEmail(users: UserRow[]) {
  const seen = new Set<string>();
  return users.filter((u) => {
    const email = u.email.toLowerCase();
    if (seen.has(email)) return false;
    seen.add(email);
    return true;
  });
}

function renderEmail(input: { name: string; subject: string; message: string; ctaLabel: string; ctaUrl: string }) {
  const paragraphs = escapeHtml(input.message)
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 14px;color:#4b5563;line-height:1.65;font-size:15px">${p.replace(/\n/g, "<br />")}</p>`)
    .join("");

  return `
  <div style="background:#f8fafc;padding:28px 12px;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
    <div style="max-width:580px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:28px;overflow:hidden">
      <div style="padding:28px 28px 18px;background:#111827;color:#ffffff">
        <div style="font-size:12px;font-weight:900;letter-spacing:.18em;text-transform:uppercase;color:#34d399">3juma</div>
        <h1 style="margin:12px 0 0;font-size:25px;line-height:1.15;font-weight:900;letter-spacing:-.04em">${escapeHtml(input.subject)}</h1>
      </div>
      <div style="padding:28px">
        <p style="margin:0 0 14px;color:#111827;font-weight:800;font-size:16px">Hi ${escapeHtml(input.name)},</p>
        ${paragraphs}
        <a href="${escapeAttribute(input.ctaUrl)}" style="display:inline-block;margin-top:10px;background:#111827;color:#ffffff;text-decoration:none;padding:14px 20px;border-radius:14px;font-weight:900;font-size:14px">
          ${escapeHtml(input.ctaLabel || "Open 3juma")}
        </a>
        <p style="margin:24px 0 0;color:#9ca3af;font-size:12px;line-height:1.5">You are receiving this because you joined 3juma.</p>
      </div>
    </div>
  </div>`;
}

function resolveUrl(raw: string, appUrl: string) {
  if (!raw) return appUrl;
  if (raw.startsWith("/")) return `${appUrl.replace(/\/$/, "")}${raw}`;
  try {
    return new URL(raw).toString();
  } catch {
    return appUrl;
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttribute(value: string) {
  return escapeHtml(value).replace(/`/g, "&#096;");
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

