import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

function loadDotEnvFile() {
  const envPath = path.resolve(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) return;
  const raw = fs.readFileSync(envPath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    if (!key || process.env[key] !== undefined) continue;
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

loadDotEnvFile();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY;
const FROM = process.env.REMINDER_FROM || "3juma <noreply@3juma.app>";
const APP_URL = process.env.VITE_SITE_URL || "https://www.3juma.app";
const DRY_RUN = !process.argv.includes("--send");

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "Missing SUPABASE_URL/VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
  );
  process.exit(1);
}
if (!DRY_RUN && !RESEND_API_KEY) {
  console.error("Missing RESEND_API_KEY for --send mode");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const subject = "Complete your worker profile to start getting jobs";
function html(name = "there") {
  return `
  <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#fff;border:1px solid #eee;border-radius:16px">
    <h2 style="margin:0 0 10px;color:#111827">Hi ${name}, complete your 3juma profile</h2>
    <p style="color:#4b5563;line-height:1.6">You are almost ready to receive jobs. Please finish these steps:</p>
    <ul style="color:#374151;line-height:1.8;padding-left:18px">
      <li>Add your trade and service area</li>
      <li>Add your contact number</li>
      <li>Upload Ghana card front and back</li>
      <li>Submit profile for verification</li>
    </ul>
    <a href="${APP_URL}/worker/dashboard" style="display:inline-block;margin-top:14px;background:#111827;color:#fff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:700">
      Complete my profile
    </a>
  </div>`;
}

function isIncomplete(user, profile, docs) {
  const hasPhone = !!user.phone;
  const hasTrade = !!profile?.trade && profile.trade !== "none";
  const hasArea = !!profile?.area && profile.area !== "none";
  const hasFront = docs.some((d) => d.document_type === "ghana_card_front");
  const hasBack = docs.some((d) => d.document_type === "ghana_card_back");
  const submitted =
    profile?.verification_status === "pending" ||
    profile?.verification_status === "approved";
  return !(hasPhone && hasTrade && hasArea && hasFront && hasBack && submitted);
}

async function sendEmail(to, fullName) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM,
      to: [to],
      subject,
      html: html(fullName),
    }),
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend failed ${response.status}: ${body}`);
  }
}

async function run() {
  const { data: workers, error } = await supabase
    .from("users")
    .select("id,email,full_name,phone,role")
    .eq("role", "worker");
  if (error) throw error;

  if (!workers?.length) {
    console.log("No workers found.");
    return;
  }

  const userIds = workers.map((w) => w.id);
  const { data: profiles, error: pErr } = await supabase
    .from("worker_profiles")
    .select("id,user_id,trade,area,verification_status")
    .in("user_id", userIds);
  if (pErr) throw pErr;

  const profileByUser = new Map((profiles || []).map((p) => [p.user_id, p]));
  const profileIds = (profiles || []).map((p) => p.id);
  const { data: docs, error: dErr } = profileIds.length
    ? await supabase
        .from("verification_documents")
        .select("worker_id,document_type")
        .in("worker_id", profileIds)
    : { data: [], error: null };
  if (dErr) throw dErr;

  const docsByProfile = new Map();
  for (const d of docs || []) {
    const arr = docsByProfile.get(d.worker_id) || [];
    arr.push(d);
    docsByProfile.set(d.worker_id, arr);
  }

  const targets = workers.filter((w) => {
    const p = profileByUser.get(w.id);
    const pd = p ? docsByProfile.get(p.id) || [] : [];
    return isIncomplete(w, p, pd) && !!w.email;
  });

  console.log(
    `Workers: ${workers.length} | Incomplete with email: ${targets.length}`,
  );
  if (DRY_RUN) {
    console.log("Dry run only. Pass --send to deliver emails.");
    for (const t of targets.slice(0, 20)) {
      console.log(`- ${t.email} (${t.full_name || "Worker"})`);
    }
    return;
  }

  let sent = 0;
  for (const t of targets) {
    try {
      await sendEmail(t.email, t.full_name || "there");
      sent += 1;
      console.log(`Sent: ${t.email}`);
    } catch (e) {
      console.error(`Failed: ${t.email}`, e.message);
    }
  }
  console.log(`Done. Sent ${sent}/${targets.length}`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
