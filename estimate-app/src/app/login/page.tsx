"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Login() {
  const router = useRouter();
  const [contact, setContact] = useState("");
  const [biz, setBiz] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const isEmail = contact.includes("@");
  const phone = () => {
    const d = contact.replace(/\D/g, "");
    return d.length === 10 ? `+1${d}` : d.length === 11 ? `+${d}` : contact.trim();
  };

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr("");
    const data = { business_name: biz.trim() };
    const { error } = isEmail
      ? await supabase().auth.signInWithOtp({ email: contact.trim(), options: { data } })
      : await supabase().auth.signInWithOtp({ phone: phone(), options: { data } });
    setBusy(false);
    if (error) setErr(error.message); else setSent(true);
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr("");
    const token = code.trim();
    const { error } = isEmail
      ? await supabase().auth.verifyOtp({ email: contact.trim(), token, type: "email" })
      : await supabase().auth.verifyOtp({ phone: phone(), token, type: "sms" });
    if (error) { setBusy(false); setErr("That code didn't work. Check it and try again."); return; }
    router.replace("/new"); // straight to the first estimate
  }

  return (
    <main className="wrap">
      <h1>Send an estimate in 60 seconds.</h1>
      {!sent ? (
        <form onSubmit={sendCode}>
          <label htmlFor="biz">Business name</label>
          <input id="biz" required value={biz} onChange={(e) => setBiz(e.target.value)} placeholder="Smith Plumbing" autoComplete="organization" />
          <label htmlFor="contact">Your email or cell number</label>
          <input id="contact" required value={contact} onChange={(e) => setContact(e.target.value)} placeholder="you@email.com or 405-555-0123" autoComplete="email" inputMode="email" />
          {err && <div className="err">{err}</div>}
          <p><button className="primary" disabled={busy}>{busy ? "Sending…" : "Get my code"}</button></p>
          <p className="muted small">We text or email you a code. No password, no setup.</p>
        </form>
      ) : (
        <form onSubmit={verify}>
          <p>Code sent to <b>{contact}</b>.</p>
          <label htmlFor="code">Enter the code</label>
          <input id="code" required value={code} onChange={(e) => setCode(e.target.value)} inputMode="numeric" autoComplete="one-time-code" autoFocus />
          {err && <div className="err">{err}</div>}
          <p><button className="primary" disabled={busy}>{busy ? "Checking…" : "Start estimating"}</button></p>
          <p><button type="button" className="ghost" onClick={() => { setSent(false); setCode(""); }}>Wrong number/email? Go back</button></p>
        </form>
      )}
    </main>
  );
}
