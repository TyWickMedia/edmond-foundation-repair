import { NextResponse } from "next/server";
import { admin } from "@/lib/server";

/** Called by the browser on page load (not on GET) so link previews don't count as "viewed". */
export async function POST(req: Request) {
  const { token } = (await req.json().catch(() => ({}))) as { token?: string };
  if (!token) return NextResponse.json({ ok: false }, { status: 400 });
  await admin()
    .from("estimates")
    .update({ status: "viewed", viewed_at: new Date().toISOString() })
    .eq("public_token", token)
    .eq("status", "sent");
  return NextResponse.json({ ok: true });
}
