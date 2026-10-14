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
  const [contact, setContact] = useState("");
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
      if (!contact && (j.customer_phone || j.customer_email)) setContact(j.customer_phone || j.customer_email);
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
    if (!contact.trim()) return setErr("Add a phone number or email to send it to.");
    if (!clean.length) return setErr("Add at least one line with a description.");
    setBusy(true);
    const isEmail = contact.includes("@");
    const { data, error } = await supabase()
      .from("estimates")
      .insert({
        user_id: session!.user.id,
        customer_name: name.trim(),
        customer_phone: isEmail ? null : contact.trim(),
        customer_email: isEmail ? contact.trim() : null,
        items: clean,
        notes: notes.trim() || null,
        total: sumItems(clean),
      })
      .select("id")
      .single();
    if (error || !data) { setBusy(false); return setErr(error?.message ?? "Couldn't save."); }
    const res = await fetch("/api/send", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await authHeader()) },
      body: JSON.stringify({ id: data.id }),
    });
    if (!res.ok) { setBusy(false); return setErr("Saved, but couldn't send. Open it from your list to retry."); }
    const j = await res.json();
    const manual = j.manual?.sms || j.manual?.email ? "&manual=1" : "";
    router.replace(`/estimate/${data.id}?sent=1${manual}`);
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
            {voice.listening ? "■ Tap when done" : thinking ? "Reading…" : "🎤 Tap and talk: customer + job"}
          </button>
        )}
        {voice.listening && <p className="muted">{voice.live || "Listening…"}</p>}
        {!voice.listening && (
          <>
            <textarea value={say} onChange={(e) => setSay(e.target.value)}
              placeholder={voice.supported ? "…or type it. Say the customer too: For Mike Johnson, 405-555-0123. 200 ft of 4-inch sewer line, tie into existing tank, $3,200, plus permit $150" : "Describe the job. Say the customer too: For Mike Johnson, 405-555-0123. 200 ft of 4-inch sewer line, tie into existing tank, $3,200, plus permit $150"} />
            {say.trim() && <button className="ghost" disabled={thinking} onClick={() => build(say)}>{thinking ? "Reading…" : "Make line items"}</button>}
          </>
        )}
      </div>

      <label htmlFor="cname">Customer</label>
      <input id="cname" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" autoComplete="off" />
      <label htmlFor="ccontact">Cell or email</label>
      <input id="ccontact" value={contact} onChange={(e) => setContact(e.target.value)} placeholder="405-555-0123 or name@email.com" inputMode="email" autoComplete="off" />

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
          <button className="primary" disabled={busy || thinking} onClick={send}>{busy ? "Sending…" : "Send it →"}</button>
        </div>
      </div>
    </main>
  );
}
