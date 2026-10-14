import { createClient } from "@supabase/supabase-js";

/** Service-role client. Server only. */
export function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

/** Resolve the signed-in user from the Bearer token, or null. */
export async function userFromRequest(req: Request) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const { data, error } = await admin().auth.getUser(token);
  return error ? null : data.user;
}

/** Public base URL: the host the request actually came in on, else the env var. */
export function appUrl(req?: Request) {
  if (req) {
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
    if (host) {
      const proto = req.headers.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
      return `${proto}://${host}`;
    }
  }
  return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
}

// ---- Outbound messaging (plain REST; no SDKs) ----

export const smsConfigured = () =>
  !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM);
export const emailConfigured = () => !!process.env.RESEND_API_KEY;

export async function sendSms(to: string, body: string) {
  const sid = process.env.TWILIO_ACCOUNT_SID!;
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(`${sid}:${process.env.TWILIO_AUTH_TOKEN}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ To: to, From: process.env.TWILIO_FROM!, Body: body }),
  });
  if (!res.ok) throw new Error(`SMS failed: ${res.status} ${await res.text()}`);
}

export async function sendEmail(opts: { to: string; subject: string; text: string; replyTo?: string }) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.RESEND_FROM || "Estimates <onboarding@resend.dev>",
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
      reply_to: opts.replyTo,
    }),
  });
  if (!res.ok) throw new Error(`Email failed: ${res.status} ${await res.text()}`);
}
