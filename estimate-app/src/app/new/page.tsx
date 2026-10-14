"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/useAuth";
import { authHeader, supabase } from "@/lib/supabase";
import { cleanItems, lineTotal, sumItems, usd } from "@/lib/money";
import { useDictation } from "@/lib/voice";
import type { Item } from "@/lib/types";

const blank = (): Item => ({ description: "", qty: 1, price: 0 });

export default function NewEstimate() {
  const router = useRouter();
  const { session, profile, ready } = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [items, setItems] = useState<Item[]>([blank()]);
  const [notes, setNotes] = useState("");
  const [say, setSay] = useState("");
  const [thinking, setThinking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => { if (profile?.default_terms) setNotes((n) => n || profile.default_terms!); }, [profile]);

  async function build(text: string) {
    if (!text.trim()) return;
    setThinking(true); setErr("");
    try {
      const res = await fetch("/api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await authHeader()) },
        body: JSON.stringify({ text }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Couldn't read that.");
      const parsed = cleanItems(j.items ?? []);
      setItems((cur) => {
        const kept = cur.filter((i) => i.description.trim()); // keep what they already typed
        const all = [...kept, ...parsed];
        return all.length ? all : [blank()];
      });
      if (j.customer_name && !name) setName(j.customer_name);
      if (j.customer_phone && !phone) setPhone(j.customer_phone);
      if (j.customer_email && !email) setEmail(j.customer_email);
      if (j.customer_address && !address) setAddress(j.customer_address);
      if (j.notes) setNotes((n) => (n ? `${n}\n${j.notes}` : j.notes));
      setSay("");
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setThinking(false);
    }
  }

  const voice = useDictation((t) => { setSay(t); build(t); });

  const set = (i: number, patch: Partial<Item>) =>
    setItems((cur) => cur.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  const total = sumItems(items);

  async function send() {
    setErr("");
    const clean = cleanItems(items);
    if (!name.trim()) return setErr("Who's it for? Add the customer's name.");
    if (!phone.trim() && !email.trim()) return setErr("Add a cell number or an email to send it to.");
    if (!clean.length) return setErr("Add at least one line with a description.");
    setBusy(true);
    const { data, error } = await supabase()
      .from("estimates")
      .insert({
        user_id: session!.user.id,
        customer_name: name.trim(),
        customer_phone: phone.trim() || null,
        customer_email: email.trim() || null,
        customer_address: address.trim() || null,
        items: clean,
        notes: notes.trim() || null,
        total: sumItems(clean),
      })
      .select("id")
      .single();
    if (error || !data) { setBusy(false); return setErr(error?.message ?? "Couldn't save."); }
    // One way to send -> open that app right away. Both -> the next screen asks which.
    const go = phone.trim() && !email.trim() ? "&go=sms" : email.trim() && !phone.trim() ? "&go=mail" : "";
    router.replace(`/estimate/${data.id}?sent=1${go}`);
  }

  if (!ready) return <main className="wrap muted">Loading…</main>;

  return (
    <main className="wrap">
      <div className="top">
        <Link href="/">← Estimates</Link>
        <span className="biz">{profile?.business_name}</span>
      </div>
      <h1>New estimate</h1>

      <div className="card">
        {voice.supported && (
          <button className={`primary mic ${voice.listening ? "live" : ""}`} disabled={thinking}
            onClick={() => (voice.listening ? voice.stop() : voice.start())}>
            {voice.listening ? "■ Tap when done" : thinking ? "Reading…" : "🎤 Tap and talk"}
          </button>
        )}
        <div className="howto">
          <b>Say it in this order:</b>
          <ol>
            <li>Customer&apos;s name</li>
            <li>Cell number (and email, if they have one)</li>
            <li>Job address</li>
            <li>The work and the prices</li>
          </ol>
          <span className="muted small">&ldquo;Mike Johnson, 405-555-0123, 123 Main Street Edmond. Replace 40 feet of sewer line, $3,200. Permit, $150.&rdquo;</span>
        </div>
        {voice.listening && <p className="muted">{voice.live || "Listening…"}</p>}
        {!voice.listening && (
          <>
            <textarea value={say} onChange={(e) => setSay(e.target.value)}
              placeholder={voice.supported ? "…or type it the same way" : "Type it: name, cell, address, then the work and prices"} />
            {say.trim() && <button className="ghost" disabled={thinking} onClick={() => build(say)}>{thinking ? "Reading…" : "Make line items"}</button>}
          </>
        )}
      </div>

      <label htmlFor="cname">Customer</label>
      <input id="cname" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" autoComplete="off" />
      <label htmlFor="cphone">Cell (to text it)</label>
      <input id="cphone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="405-555-0123" inputMode="tel" autoComplete="off" />
      <label htmlFor="cemail">Email (optional)</label>
      <input id="cemail" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@email.com" inputMode="email" autoComplete="off" />
      <label htmlFor="caddr">Job address (optional, but you'll want it for liens)</label>
      <input id="caddr" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Main St, Edmond, OK 73034" autoComplete="street-address" />

      <h2>What's the work</h2>
      {items.map((it, i) => (
        <div className="item" key={i}>
          <textarea value={it.description} onChange={(e) => set(i, { description: e.target.value })} placeholder="Description" />
          <input aria-label="Quantity" inputMode="decimal" value={it.qty || ""} onChange={(e) => set(i, { qty: parseFloat(e.target.value) || 0 })} placeholder="Qty" />
          <input aria-label="Price each" inputMode="decimal" value={it.price || ""} onChange={(e) => set(i, { price: parseFloat(e.target.value) || 0 })} placeholder="$ each" />
          <button className="x" aria-label="Remove line" onClick={() => setItems((c) => (c.length > 1 ? c.filter((_, k) => k !== i) : [blank()]))}>✕</button>
          {it.qty !== 1 && lineTotal(it) > 0 && <div className="sub muted">{usd(lineTotal(it))}</div>}
        </div>
      ))}
      <button className="ghost" onClick={() => setItems((c) => [...c, blank()])}>+ Add line</button>

      <label htmlFor="notes">Notes / terms (optional)</label>
      <textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Good for 30 days. 50% down to start." />

      {err && <div className="err">{err}</div>}

      <div className="bar">
        <div>
          <span className="tot">{usd(total)}</span>
          <button className="primary" disabled={busy || thinking} onClick={send}>{busy ? "Saving…" : "Send it →"}</button>
        </div>
      </div>
    </main>
  );
}
