/**
 * Supabase Edge Function: transactional + admin marketing Web Push.
 *
 * Secrets (Dashboard → Edge Functions → Secrets, or `supabase secrets set`):
 *   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (optional, default mailto:admin@localhost)
 * Auto-provided: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * Deploy: supabase functions deploy send-app-push
 */
import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import webpush from "npm:web-push@3.6.7";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ServiceRequestRow = {
  id: string;
  worker_id: string | null;
  customer_id: string | null;
  trade: string;
  status: string;
  created_at: string;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, serviceKey);

    const jwt = authHeader.replace("Bearer ", "");
    const { data: authData } = await supabaseAdmin.auth.getUser(jwt);
    const authedUser = authData?.user ?? null;

    const body = (await req.json()) as Record<string, unknown>;
    const kind = body.kind as string;

    const vapidPublic = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivate = Deno.env.get("VAPID_PRIVATE_KEY");
    const subject = Deno.env.get("VAPID_SUBJECT") || "mailto:admin@localhost";

    if (!vapidPublic || !vapidPrivate) {
      return new Response(JSON.stringify({ error: "VAPID keys not configured (set Edge secrets)" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    webpush.setVapidDetails(subject, vapidPublic, vapidPrivate);

    async function sendToUserIds(userIds: string[], payload: Record<string, string>): Promise<number> {
      const uniq = [...new Set(userIds.filter(Boolean))];
      let sent = 0;
      const str = JSON.stringify(payload);
      for (const uid of uniq) {
        const { data: subs } = await supabaseAdmin
          .from("push_subscriptions")
          .select("endpoint, p256dh, auth")
          .eq("user_id", uid);
        for (const s of subs || []) {
          try {
            await webpush.sendNotification(
              { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
              str,
              { TTL: 86400 },
            );
            sent++;
          } catch (e: unknown) {
            const code = (e as { statusCode?: number })?.statusCode;
            if (code === 404 || code === 410) {
              await supabaseAdmin.from("push_subscriptions").delete().eq("endpoint", s.endpoint);
            }
          }
        }
      }
      return sent;
    }

    if (kind === "worker_new_job") {
      const serviceRequestId = body.serviceRequestId as string;
      if (!serviceRequestId) {
        return new Response(JSON.stringify({ error: "serviceRequestId required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: sr, error: srErr } = await supabaseAdmin
        .from("service_requests")
        .select("id, worker_id, customer_id, trade, status, created_at")
        .eq("id", serviceRequestId)
        .single();

      if (srErr || !sr?.worker_id) {
        return new Response(JSON.stringify({ error: "Request not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const row = sr as ServiceRequestRow;
      if (row.status !== "pending") {
        return new Response(JSON.stringify({ error: "Invalid state" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const allowed = await verifyCanNotifyNewRequest(supabaseAdmin, authedUser, row);
      if (!allowed) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const sent = await sendToUserIds([row.worker_id], {
        title: "New job on Ejuma",
        body: `New ${row.trade} booking — open your dashboard to respond.`,
        url: "/worker/dashboard",
      });

      return new Response(JSON.stringify({ ok: true, sent }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (kind === "customer_job_update") {
      const serviceRequestId = body.serviceRequestId as string;
      const status = body.status as string;
      if (!serviceRequestId || !status) {
        return new Response(JSON.stringify({ error: "serviceRequestId and status required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: sr, error: srErr } = await supabaseAdmin
        .from("service_requests")
        .select("id, worker_id, customer_id, trade, status")
        .eq("id", serviceRequestId)
        .single();

      if (srErr || !sr) {
        return new Response(JSON.stringify({ error: "Not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const row = sr as ServiceRequestRow;
      if (!row.customer_id) {
        return new Response(JSON.stringify({ ok: true, sent: 0, note: "No logged-in customer on this job" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const okWorker = await verifyWorkerOwnsRequest(supabaseAdmin, authedUser, row.worker_id);
      if (!okWorker) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      let workerName = "Your worker";
      if (row.worker_id) {
        const { data: wu } = await supabaseAdmin.from("users").select("full_name").eq("id", row.worker_id).maybeSingle();
        if (wu?.full_name) workerName = wu.full_name;
      }

      const messages: Record<string, { title: string; body: string }> = {
        accepted: { title: "Booking accepted", body: `${workerName} accepted your ${row.trade} job.` },
        en_route: { title: "On the way", body: `${workerName} is en route.` },
        arrived: { title: "Worker arrived", body: `${workerName} has arrived.` },
        in_progress: { title: "Work started", body: `${workerName} started the job.` },
        completed: { title: "Job completed", body: `Your ${row.trade} job is marked complete.` },
        cancelled: { title: "Booking cancelled", body: `Your ${row.trade} booking was cancelled.` },
        disputed: { title: "Booking update", body: `There is an update on your ${row.trade} job.` },
      };
      const msg = messages[status] ?? {
        title: "Job update",
        body: `Your ${row.trade} booking status: ${status}.`,
      };

      const sent = await sendToUserIds([row.customer_id], {
        title: msg.title,
        body: msg.body,
        url: `/tracking?requestId=${serviceRequestId}`,
      });

      return new Response(JSON.stringify({ ok: true, sent }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (kind === "marketing") {
      if (!authedUser) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: adminRow } = await supabaseAdmin.from("users").select("role").eq("auth_id", authedUser.id).maybeSingle();
      if (adminRow?.role !== "admin") {
        return new Response(JSON.stringify({ error: "Admin only" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const title = String(body.title ?? "3juma");
      const msgBody = String(body.body ?? "");
      const url = String(body.url ?? "/");
      const userIds = body.userIds as string[] | undefined | null;

      let targetIds: string[] = [];
      if (userIds && userIds.length > 0) {
        targetIds = userIds;
      } else {
        const { data: rows } = await supabaseAdmin.from("push_subscriptions").select("user_id");
        targetIds = [...new Set((rows ?? []).map((r: { user_id: string }) => r.user_id))];
      }

      const sent = await sendToUserIds(targetIds, { title, body: msgBody, url });

      return new Response(JSON.stringify({ ok: true, sent, recipients: targetIds.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown kind" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function verifyCanNotifyNewRequest(
  supabaseAdmin: SupabaseClient,
  authedUser: { id: string } | null,
  sr: ServiceRequestRow,
): Promise<boolean> {
  if (sr.customer_id) {
    if (!authedUser) return false;
    const { data: urow } = await supabaseAdmin.from("users").select("id").eq("auth_id", authedUser.id).maybeSingle();
    return urow?.id === sr.customer_id;
  }
  const created = new Date(sr.created_at).getTime();
  return Date.now() - created <= 15 * 60 * 1000;
}

async function verifyWorkerOwnsRequest(
  supabaseAdmin: SupabaseClient,
  authedUser: { id: string } | null,
  workerId: string | null,
): Promise<boolean> {
  if (!authedUser || !workerId) return false;
  const { data: wrow } = await supabaseAdmin.from("users").select("id").eq("auth_id", authedUser.id).maybeSingle();
  return wrow?.id === workerId;
}
