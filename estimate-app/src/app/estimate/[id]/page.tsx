"use client";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/components/useAuth";
import { supabase } from "@/lib/supabase";
import { lineTotal, toE164, usd } from "@/lib/money";
import type { Estimate, Profile } from "@/lib/types";

const when = (s: string | null) => (s ? new Date(s).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) : null);

/** Message + deep links that open the owner's own text / email app, pre-filled. */
function links(est: Estimate, profile: Profile | null) {
  const url = `${location.origin}/e/${est.public_token}`;
  const biz = profile?.business_name ?? "your contractor";
  const first = est.customer_name.split(" ")[0];
  const text = `Hi ${first}, here's your estimate from ${biz} for ${usd(Number(est.total))}: ${url}`;
  const phone = toE164(est.customer_phone) ?? est.customer_phone;
  return {
    url,
    sms: est.customer_phone ? `sms:${phone}?&body=${encodeURIComponent(text)}` : null,
    mail: est.customer_email
      ? `mailto:${est.customer_email}?subject=${encodeURIComponent(`Estimate from ${biz}`)}&body=${encodeURIComponent(text)}`
      : null,
  };
}

export default function Detail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const sp = useSearchParams();
  const { profile, ready } = useAuth();
  const [est, setEst] = useState<Estimate | null>(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!ready) return;
    const load = () => supabase().from("estimates").select("*").eq("id", id).single().then(({ data }) => setEst(data as Estimate));
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, [ready, id]);

  // "Sent" means you opened your text/email app with it, not just that it was saved.
  async function markSent() {
    await supabase().from("estimates").update({ status: "sent", sent_at: new Date().toISOString() }).eq("id", id).eq("status", "draft");
    setEst((e) => (e && e.status === "draft" ? { ...e, status: "sent", sent_at: new Date().toISOString() } : e));
  }

  // Straight after "Send it" with only one way to send: open that app once.
  const go = sp.get("go");
  useEffect(() => {
    if (!est || !go) return;
    const key = `opened-${id}`;
    try { if (sessionStorage.getItem(key)) return; sessionStorage.setItem(key, "1"); } catch {}
    const l = links(est, profile);
    const href = go === "sms" ? l.sms : go === "mail" ? l.mail : null;
    if (href) { markSent(); window.location.href = href; }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [est?.id, go]);

  if (!ready || !est) return <main className="wrap muted">Loading…</main>;

  const l = links(est, profile);
  const first = est.customer_name.split(" ")[0];
  const open = est.status !== "accepted" && est.status !== "declined";
  const both = !!(l.sms && l.mail);

  async function copy() {
    try { await navigator.clipboard.writeText(l.url); setMsg("Link copied."); } catch { setMsg(l.url); }
  }

  return (
    <main className="wrap">
      <div className="top"><Link href="/">← Estimates</Link></div>
      <h1>{est.customer_name}</h1>
      {est.customer_address && <p className="muted" style={{ marginTop: -8 }}>{est.customer_address}</p>}
      <p><span className={`badge ${est.status}`}>{est.status === "draft" ? "not sent yet" : est.status}</span> <b>{usd(Number(est.total))}</b></p>

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

      {open && (
        <div className="card">
          {est.status === "draft" && <p><b>{both ? "How do you want to send it?" : "Send it"}</b></p>}
          {l.sms && <p><a className="btn primary" href={l.sms} onClick={markSent}>Text it to {first}</a></p>}
          {l.mail && <p><a className="btn primary" href={l.mail} onClick={markSent}>Email it to {first}</a></p>}
          <button className="ghost" onClick={copy}>Copy link</button>
        </div>
      )}

      {sp.get("sent") === "1" && profile && !profile.logo_url && (
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
        Customer link: <a href={l.url}>{l.url}</a>
      </p>
    </main>
  );
}
