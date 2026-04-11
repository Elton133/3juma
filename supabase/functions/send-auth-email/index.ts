/**
 * Supabase Auth — Send Email Hook (Resend).
 *
 * Dashboard → Authentication → Hooks → Send email → HTTPS URL = this function.
 * Deploy: npx supabase functions deploy send-auth-email --no-verify-jwt
 *
 * Secrets:
 *   RESEND_API_KEY
 *   RESEND_FROM          e.g. "3juma <noreply@yourdomain.com>" (verified domain in Resend)
 *   SEND_EMAIL_HOOK_SECRET   from hook "Generate secret" (include full value, often starts with v1,whsec_)
 */
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";
import { Resend } from "npm:resend@4.0.0";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, webhook-id, webhook-timestamp, webhook-signature",
};

type EmailPayload = {
  user: { email: string; id?: string };
  email_data: {
    token: string;
    token_hash: string;
    redirect_to: string;
    email_action_type: string;
    site_url?: string;
  };
};

function mapActionToQueryType(action: string): string {
  const m: Record<string, string> = {
    signup: "signup",
    recovery: "recovery",
    invite: "invite",
    magiclink: "magiclink",
    email_change: "email_change",
    email_change_new: "email_change",
    reauthentication: "reauthentication",
  };
  return m[action] || "signup";
}

function buildVerifyUrl(supabaseUrl: string, data: EmailPayload["email_data"]): string {
  const type = mapActionToQueryType(data.email_action_type);
  const token = data.token || data.token_hash;
  const u = new URL(`${supabaseUrl.replace(/\/$/, "")}/auth/v1/verify`);
  u.searchParams.set("token", token);
  u.searchParams.set("type", type);
  if (data.redirect_to) {
    u.searchParams.set("redirect_to", data.redirect_to);
  }
  return u.toString();
}

function emailContent(action: string, confirmUrl: string, appName: string): { subject: string; html: string } {
  const brand = appName;
  if (action === "recovery") {
    return {
      subject: `Reset your ${brand} password`,
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px">
          <h1 style="color:#111;font-weight:800;font-size:22px">Password reset</h1>
          <p style="color:#444;line-height:1.6">Click the button below to choose a new password.</p>
          <a href="${confirmUrl}" style="display:inline-block;background:#111;color:#fff;padding:14px 28px;border-radius:12px;text-decoration:none;font-weight:700;margin:16px 0">Reset password</a>
          <p style="color:#999;font-size:12px">If you didn’t request this, you can ignore this email.</p>
        </div>`,
    };
  }
  if (action === "magiclink") {
    return {
      subject: `Your ${brand} login link`,
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px">
          <h1 style="color:#111;font-weight:800;font-size:22px">Sign in</h1>
          <p style="color:#444;line-height:1.6">Use the link below to sign in.</p>
          <a href="${confirmUrl}" style="display:inline-block;background:#111;color:#fff;padding:14px 28px;border-radius:12px;text-decoration:none;font-weight:700;margin:16px 0">Continue</a>
        </div>`,
    };
  }
  return {
    subject: `Confirm your ${brand} email`,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px">
        <h1 style="color:#111;font-weight:800;font-size:22px">Confirm your email</h1>
        <p style="color:#444;line-height:1.6">Thanks for joining. Confirm your address to get started.</p>
        <a href="${confirmUrl}" style="display:inline-block;background:#111;color:#fff;padding:14px 28px;border-radius:12px;text-decoration:none;font-weight:700;margin:16px 0">Confirm email</a>
        <p style="color:#999;font-size:12px">If you didn’t create an account, ignore this email.</p>
      </div>`,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  const rawSecret = Deno.env.get("SEND_EMAIL_HOOK_SECRET");
  const resendKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("RESEND_FROM") || "3juma <onboarding@resend.dev>";
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;

  if (!rawSecret || !resendKey) {
    return new Response(JSON.stringify({ error: "Missing RESEND_API_KEY or SEND_EMAIL_HOOK_SECRET" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const hookSecret = rawSecret.replace(/^v1,whsec_/, "");
  const wh = new Webhook(hookSecret);

  const payloadText = await req.text();
  const headers = Object.fromEntries(req.headers);

  let parsed: EmailPayload;
  try {
    parsed = wh.verify(payloadText, headers) as EmailPayload;
  } catch (e) {
    console.error("[send-auth-email] webhook verify failed:", e);
    return new Response(JSON.stringify({ error: "Invalid webhook signature" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { user, email_data } = parsed;
  const action = email_data.email_action_type;
  const confirmUrl = buildVerifyUrl(supabaseUrl, email_data);
  const appName = "3juma";
  const { subject, html } = emailContent(action, confirmUrl, appName);

  const resend = new Resend(resendKey);
  const { error } = await resend.emails.send({
    from,
    to: [user.email],
    subject,
    html,
  });

  if (error) {
    console.error("[send-auth-email] Resend error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({}), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
