"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Login() {
  const router = useRouter();
  const [contact, setContact] = useState("");
  const [biz, setBiz] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  // Returning user on a new phone: email link (only shown if they ask)
  const [back, setBack] = useState(false);
  const [mailed, setMailed] = useState(false);

  async function start(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr("");
    // No code, no password: the device is the account. Contact is where we tell them
    // "Mike accepted your estimate". Saving the account to an email is optional, later.
    const { error } = await supabase().auth.signInAnonymously({
      options: { data: { business_name: biz.trim(), contact: contact.trim() } },
    });
    if (error) { setBusy(false); return setErr(error.message); }
    router.replace("/new"); // straight to the first estimate
  }

  async function emailLink(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr("");
    const { error } = await supabase().auth.signInWithOtp({
      email: contact.trim(),
      options: { shouldCreateUser: false, emailRedirectTo: `${location.origin}/` },
    });
    setBusy(false);
    if (error) setErr(error.message); else setMailed(true);
  }

  return (
    <main className="wrap">
      <h1>Send an estimate in 60 seconds.</h1>
      {!back ? (
        <form onSubmit={start}>
          <label htmlFor="biz">Business name</label>
          <input id="biz" required value={biz} onChange={(e) => setBiz(e.target.value)} placeholder="Smith Plumbing" autoComplete="organization" />
          <label htmlFor="contact">Your cell or email</label>
          <input id="contact" required value={contact} onChange={(e) => setContact(e.target.value)} placeholder="405-555-0123 or you@email.com" autoComplete="email" inputMode="email" />
          {err && <div className="err">{err}</div>}
          <p><button className="primary" disabled={busy}>{busy ? "One sec…" : "Start estimating"}</button></p>
          <p className="muted small">That&apos;s it. No code, no password. We&apos;ll use this to tell you when a customer says yes.</p>
          <p><button type="button" className="ghost" onClick={() => setBack(true)}>I already have an account</button></p>
        </form>
      ) : mailed ? (
        <p>Check <b>{contact}</b> for a sign-in link. Open it on this phone.</p>
      ) : (
        <form onSubmit={emailLink}>
          <label htmlFor="e2">Email you saved your account with</label>
          <input id="e2" type="email" required value={contact} onChange={(e) => setContact(e.target.value)} autoComplete="email" />
          {err && <div className="err">{err}</div>}
          <p><button className="primary" disabled={busy}>{busy ? "Sending…" : "Email me a sign-in link"}</button></p>
          <p><button type="button" className="ghost" onClick={() => setBack(false)}>Back</button></p>
        </form>
      )}
    </main>
  );
}
