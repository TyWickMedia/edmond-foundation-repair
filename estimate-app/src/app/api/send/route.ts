import { NextResponse } from "next/server";
import { admin, appUrl, emailConfigured, sendEmail, sendSms, smsConfigured, userFromRequest } from "@/lib/server";
import { toE164, usd } from "@/lib/money";

/**
 * Marks the estimate "sent" and delivers it by whatever the server can do.
 * Anything it can't deliver (no Twilio/Resend keys) is reported back so the
 * client can open the owner's own text/email app with the message pre-filled.
 */
export async function POST(req: Request) {
  const user = await userFromRequest(req);
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const { id } = (await req.json().catch(() => ({}))) as { id?: string };
  const db = admin();
  const { data: est } = await db.from("estimates").select("*").eq("id", id ?? "").eq("user_id", user.id).single();
  if (!est) return NextResponse.json({ error: "Estimate not found." }, { status: 404 });
  const { data: profile } = await db.from("profiles").select("business_name, phone").eq("id", user.id).single();

  const url = `${appUrl(req)}/e/${est.public_token}`;
  const biz = profile?.business_name ?? "Your contractor";
  const first = String(est.customer_name).split(" ")[0];
  const body = `Hi ${first}, here's your estimate from ${biz} for ${usd(Number(est.total))}: ${url}`;

  const delivered: string[] = [];
  const manual: { sms?: string; email?: string } = {};
  const errors: string[] = [];

  const phone = toE164(est.customer_phone);
  if (phone) {
    if (smsConfigured()) {
      try { await sendSms(phone, body); delivered.push("text"); } catch (e) { console.error(e); errors.push("text"); manual.sms = phone; }
    } else manual.sms = phone;
  }
  if (est.customer_email) {
    if (emailConfigured()) {
      try {
        await sendEmail({
          to: est.customer_email,
          subject: `Estimate from ${biz} — ${usd(Number(est.total))}`,
          text: `${body}\n\nTap the link to review and accept.`,
          replyTo: user.email ?? undefined,
        });
        delivered.push("email");
      } catch (e) { console.error(e); errors.push("email"); manual.email = est.customer_email; }
    } else manual.email = est.customer_email;
  }

  // Mark sent even when the owner finishes sending from their own phone.
  if (est.status === "draft" || est.status === "sent") {
    await db.from("estimates").update({ status: "sent", sent_at: est.sent_at ?? new Date().toISOString() }).eq("id", est.id);
  }

  return NextResponse.json({ url, body, delivered, manual, errors });
}
