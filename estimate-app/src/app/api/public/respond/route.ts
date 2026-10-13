import { NextResponse } from "next/server";
import { admin, emailConfigured, sendEmail, sendSms, smsConfigured } from "@/lib/server";
import { usd } from "@/lib/money";

export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as {
    token?: string; action?: "accept" | "decline"; name?: string; signature?: string | null; reason?: string;
  };
  if (!b.token || (b.action !== "accept" && b.action !== "decline"))
    return NextResponse.json({ error: "Bad request." }, { status: 400 });

  const accept = b.action === "accept";
  const name = (b.name ?? "").trim().slice(0, 120);
  if (accept && !name) return NextResponse.json({ error: "Type your name to sign." }, { status: 400 });
  if (b.signature && (!b.signature.startsWith("data:image/png;base64,") || b.signature.length > 400_000))
    return NextResponse.json({ error: "Signature too large." }, { status: 400 });

  const db = admin();
  // Only an open estimate can be answered, and only once.
  const { data: est } = await db
    .from("estimates")
    .update({
      status: accept ? "accepted" : "declined",
      responded_at: new Date().toISOString(),
      signer_name: name || null,
      signature: accept ? b.signature ?? null : null,
      decline_reason: accept ? null : (b.reason ?? "").trim().slice(0, 500) || null,
    })
    .eq("public_token", b.token)
    .in("status", ["sent", "viewed"])
    .select("id, user_id, customer_name, total")
    .single();
  if (!est) return NextResponse.json({ error: "This estimate was already answered." }, { status: 409 });

  // Tell the owner. Best-effort; never fail the customer's tap.
  try {
    const { data } = await db.auth.admin.getUserById(est.user_id);
    const owner = data.user;
    const msg = `${est.customer_name} ${accept ? "ACCEPTED" : "declined"} your estimate (${usd(Number(est.total))}).`;
    if (owner?.email && emailConfigured())
      await sendEmail({ to: owner.email, subject: msg, text: `${msg}\n\nOpen your estimates to see details.` });
    else if (owner?.phone && smsConfigured()) await sendSms(`+${owner.phone.replace(/^\+/, "")}`, msg);
  } catch (e) {
    console.error("owner notify failed", e);
  }
  return NextResponse.json({ ok: true });
}
