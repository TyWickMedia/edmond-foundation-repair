"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/useAuth";
import { supabase } from "@/lib/supabase";

/** Everything here is optional and saved forever. Nothing in the app is gated on it. */
export default function Settings() {
  const router = useRouter();
  const { session, profile, setProfile, ready } = useAuth();
  const [f, setF] = useState({ business_name: "", address: "", license: "", phone: "", default_terms: "" });
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (profile) setF({
      business_name: profile.business_name ?? "", address: profile.address ?? "", license: profile.license ?? "",
      phone: profile.phone ?? "", default_terms: profile.default_terms ?? "",
    });
  }, [profile]);

  if (!ready || !profile) return <main className="wrap muted">Loading…</main>;
  const bind = (k: keyof typeof f) => ({ value: f[k], onChange: (e: React.ChangeEvent<any>) => setF({ ...f, [k]: e.target.value }) });

  async function save() {
    setBusy(true); setMsg("");
    const { data, error } = await supabase().from("profiles").update({
      business_name: f.business_name.trim() || profile!.business_name,
      address: f.address.trim() || null, license: f.license.trim() || null,
      phone: f.phone.trim() || null, default_terms: f.default_terms.trim() || null,
    }).eq("id", session!.user.id).select().single();
    setBusy(false);
    if (error) return setMsg(error.message);
    setProfile(data); setMsg("Saved.");
  }

  async function logo(file: File | undefined) {
    if (!file) return;
    if (file.size > 6_000_000) return setMsg("That photo is too big. Try a smaller one.");
    setBusy(true); setMsg("");
    const path = `${session!.user.id}/logo`;
    const up = await supabase().storage.from("logos").upload(path, file, { upsert: true, contentType: file.type });
    if (up.error) { setBusy(false); return setMsg(up.error.message); }
    const url = `${supabase().storage.from("logos").getPublicUrl(path).data.publicUrl}?v=${Date.now()}`;
    const { data } = await supabase().from("profiles").update({ logo_url: url }).eq("id", session!.user.id).select().single();
    setBusy(false);
    if (data) setProfile(data);
    setMsg("Logo saved.");
  }

  return (
    <main className="wrap">
      <div className="top"><Link href="/">← Estimates</Link></div>
      <h1>Your business</h1>
      <p className="muted small">All optional. Saved once, used on every estimate.</p>

      <label>Logo</label>
      {profile.logo_url && <p><img src={profile.logo_url} alt="Logo" style={{ maxHeight: 80, maxWidth: "100%" }} /></p>}
      <input type="file" accept="image/*" onChange={(e) => logo(e.target.files?.[0])} />

      <label>Business name</label><input {...bind("business_name")} />
      <label>Business phone</label><input {...bind("phone")} inputMode="tel" />
      <label>Address</label><input {...bind("address")} autoComplete="street-address" />
      <label>License #</label><input {...bind("license")} />
      <label>Default terms</label>
      <textarea {...bind("default_terms")} placeholder="Good for 30 days. 50% down to schedule." />

      {msg && <div className="ok">{msg}</div>}
      <p><button className="primary" disabled={busy} onClick={save}>Save</button></p>
      <p><button className="ghost" onClick={async () => { await supabase().auth.signOut(); router.replace("/login"); }}>Sign out</button></p>
    </main>
  );
}
