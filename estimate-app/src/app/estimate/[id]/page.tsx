"use client";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/components/useAuth";
import { authHeader, supabase } from "@/lib/supabase";
import { lineTotal, toE164, usd } from "@/lib/money";
import type { Estimate } from "@/lib/types";

const when = (s: string | null) => (s ? new Date(s).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) : null);

export default function Detail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const sp = useSearchParams();
  const { profile, ready } = useAuth();
  const [est, setEst] = useState<Estimate | null>(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!ready) return;
    const load = () => supabase().from("estimates").select("*").eq("id", id).single().then(({ data }) => setEst(data as Estimate));
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, [ready, id]);

  if (!ready || !est) return <main className="wrap muted">Loading…</main>;

  const url = `${location.origin}/e/${est.public_token}`;
  const text = `Hi ${est.customer_name.split(" ")[0]}, here's your estimate from ${profile?.business_name} for ${usd(Number(est.total))}: ${url}`;
  const phone = toE164(est.customer_phone);
  const smsHref = `sms:${phone ?? est.customer_phone}?&body=${encodeURIComponent(text)}`;
  const mailHref = est.customer_email
    ? `mailto:${est.customer_email}?subject=${encodeURIComponent(`Estimate from ${profile?.business_name}`)}&body=${encodeURIComponent(text)}`
    : null;

  async function resend() {
    setBusy(true); setMsg("");
    const res = await fetch("/api/send", { method: "POST", headers: { "Content-Type": "application/json", ...(await authHeader()) }, body: JSON.stringify({ id }) });
    const j = await res.json().catch(() => ({}));
    setBusy(false);
    setMsg(res.ok ? (j.delivered?.length ? `Sent by ${j.delivered.join(" + ")}.` : "Use the buttons below to send it from your phone.") : "Couldn't send. Try again.");
  }
  async function copy() {
    try { await navigator.clipboard.writeText(url); setMsg("Link copied."); } catch { setMsg(url); }
  }

  const justSent = sp.get("sent") === "1";
  const needsManual = sp.get("manual") === "1";

  return (
    <main className="wrap">
      <div className="top"><Link href="/">← Estimates</Link></div>
      <h1>{est.customer_name}</h1>
      <p><span className={`badge ${est.status}`}>{est.status}</span> <b>{usd(Number(est.total))}</b></p>

      {justSent && !needsManual && <div className="ok">Sent. We&apos;ll tell you when they open it.</div>}
      {justSent && needsManual && <div className="nudge"><b>Last step:</b> tap below to send it from your own phone.</div>}
      {msg && <div className="ok">{msg}</div>}

      {est.status === "accepted" && (
        <div className="ok">
          Accepted by {est.signer_name} · {when(est.responded_at)}
          {est.signature && <p><img className="sigimg" src={est.signature} alt="Signature" /></p>}
        </div>
      )}
      {est.status === "declined" && (
        <div className="err">Declined · {when(est.responded_at)}{est.decline_reason ? ` — “${est.decline_reason}”` : ""}</div>
      )}

      {est.status !== "accepted" && est.status !== "declined" && (
        <div className="card">
          {est.customer_phone && <p><a className="btn primary" href={smsHref}>Text it to {est.customer_name.split(" ")[0]}</a></p>}
          {mailHref && <p><a className="btn primary" href={mailHref}>Email it</a></p>}
          <p><button onClick={copy}>Copy link</button></p>
          <button className="ghost" disabled={busy} onClick={resend}>{busy ? "Sending…" : "Resend automatically"}</button>
        </div>
      )}

      {justSent && profile && !profile.logo_url && (
        <div className="nudge">Want your logo on these? <Link href="/settings">Add it (10 seconds)</Link></div>
      )}

      <h2>Details</h2>
      <div className="card">
        {est.items.map((it, i) => (
          <div key={i} className="row" style={{ margin: "8px 0" }}>
            <div>{it.description}{it.qty !== 1 && <span className="muted"> × {it.qty}</span>}</div>
            <div className="amt">{usd(lineTotal(it))}</div>
          </div>
        ))}
        {est.notes && <p className="muted pre small">{est.notes}</p>}
      </div>
      <p className="muted small">
        {est.sent_at && <>Sent {when(est.sent_at)}<br /></>}
        {est.viewed_at && <>Viewed {when(est.viewed_at)}<br /></>}
        Customer link: <a href={url}>{url}</a>
      </p>
    </main>
  );
}
