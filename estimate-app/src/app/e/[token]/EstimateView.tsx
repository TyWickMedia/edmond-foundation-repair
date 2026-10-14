"use client";
import { useEffect, useRef, useState } from "react";
import { lineTotal, usd } from "@/lib/money";
import type { Item, Status } from "@/lib/types";

type Props = {
  token: string;
  biz: { name: string; logo: string | null; address: string | null; license: string | null; phone: string | null };
  est: { customer: string; address: string | null; items: Item[]; notes: string | null; total: number; status: Status; date: string; signer: string | null; respondedAt: string | null };
};

export function EstimateView({ token, biz, est }: Props) {
  const [status, setStatus] = useState<Status>(est.status);
  const [mode, setMode] = useState<"idle" | "sign" | "decline">("idle");
  const [name, setName] = useState("");
  const [how, setHow] = useState<"type" | "draw">("type");
  const [reason, setReason] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const pad = useRef<HTMLCanvasElement>(null);
  const inked = useRef(false);

  // Count as "viewed" only when a real browser opens it (not a link-preview bot).
  useEffect(() => {
    if (est.status === "sent") fetch("/api/public/view", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) });
  }, [est.status, token]);

  // Drawing pad
  useEffect(() => {
    const c = pad.current;
    if (how !== "draw" || !c) return;
    const dpr = window.devicePixelRatio || 1;
    c.width = c.clientWidth * dpr; c.height = c.clientHeight * dpr;
    const g = c.getContext("2d")!;
    g.scale(dpr, dpr); g.lineWidth = 2.5; g.lineCap = "round"; g.strokeStyle = "#111827";
    inked.current = false;
    let down = false;
    const pos = (e: PointerEvent) => { const r = c.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top] as const; };
    const onDown = (e: PointerEvent) => { down = true; c.setPointerCapture(e.pointerId); const [x, y] = pos(e); g.beginPath(); g.moveTo(x, y); };
    const onMove = (e: PointerEvent) => { if (!down) return; const [x, y] = pos(e); g.lineTo(x, y); g.stroke(); inked.current = true; };
    const onUp = () => { down = false; };
    c.addEventListener("pointerdown", onDown); c.addEventListener("pointermove", onMove);
    c.addEventListener("pointerup", onUp); c.addEventListener("pointercancel", onUp);
    return () => {
      c.removeEventListener("pointerdown", onDown); c.removeEventListener("pointermove", onMove);
      c.removeEventListener("pointerup", onUp); c.removeEventListener("pointercancel", onUp);
    };
  }, [how, mode]);

  async function submit(action: "accept" | "decline") {
    setErr("");
    if (action === "accept" && !name.trim()) return setErr("Please type your name.");
    if (action === "accept" && how === "draw" && !inked.current) return setErr("Draw your signature, or switch to Type.");
    setBusy(true);
    const signature = action === "accept" && how === "draw" ? pad.current!.toDataURL("image/png") : null;
    const res = await fetch("/api/public/respond", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, action, name, signature, reason }),
    });
    setBusy(false);
    const j = await res.json().catch(() => ({}));
    if (!res.ok) return setErr(j.error || "Something went wrong. Try again.");
    setStatus(action === "accept" ? "accepted" : "declined");
    setMode("idle");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const open = status === "sent" || status === "viewed";

  return (
    <div className="doc">
      <div className="head">
        {biz.logo && <img src={biz.logo} alt="" />}
        <div>
          <div style={{ fontWeight: 900, fontSize: "1.3rem" }}>{biz.name}</div>
          <div className="muted small">
            {[biz.address, biz.phone, biz.license && `Lic. ${biz.license}`].filter(Boolean).join(" · ")}
          </div>
        </div>
      </div>

      <h1>Estimate for {est.customer}</h1>
      {est.address && <div className="muted">{est.address}</div>}
      <div className="muted small">{new Date(est.date).toLocaleDateString([], { dateStyle: "long" })}</div>

      {status === "accepted" && <div className="ok">Accepted{est.signer || name ? ` by ${est.signer || name}` : ""}. {biz.name} has been notified — thank you!</div>}
      {status === "declined" && <div className="err">You declined this estimate. {biz.name} has been notified.</div>}

      <table>
        <thead><tr><th>Work</th><th className="n">Qty</th><th className="n">Amount</th></tr></thead>
        <tbody>
          {est.items.map((it, i) => (
            <tr key={i}><td>{it.description}</td><td className="n">{it.qty}</td><td className="n">{usd(lineTotal(it))}</td></tr>
          ))}
        </tbody>
      </table>
      <div className="total"><span>Total</span><span>{usd(est.total)}</span></div>
      {est.notes && <><h2>Notes &amp; terms</h2><p className="pre">{est.notes}</p></>}

      {open && mode === "idle" && (
        <div style={{ display: "grid", gap: 10, marginTop: 16 }}>
          <button className="good" onClick={() => setMode("sign")}>Accept this estimate</button>
          <button className="ghost" onClick={() => setMode("decline")}>No thanks</button>
        </div>
      )}

      {open && mode === "sign" && (
        <div className="card">
          <b>Sign to accept {usd(est.total)}</b>
          <label htmlFor="sn">Your name</label>
          <input id="sn" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          <div className="seg">
            <button className={how === "type" ? "on" : ""} onClick={() => setHow("type")}>Type</button>
            <button className={how === "draw" ? "on" : ""} onClick={() => setHow("draw")}>Draw</button>
          </div>
          {how === "type"
            ? <div className="sigpad" style={{ display: "grid", placeItems: "center", fontFamily: "cursive", fontSize: "2rem" }}>{name || <span className="muted" style={{ fontSize: "1rem", fontFamily: "system-ui" }}>Your name appears here</span>}</div>
            : <canvas ref={pad} className="sigpad" aria-label="Draw your signature" />}
          {err && <div className="err">{err}</div>}
          <p><button className="good" disabled={busy} onClick={() => submit("accept")}>{busy ? "Saving…" : "Accept & sign"}</button></p>
          <button className="ghost" onClick={() => setMode("idle")}>Back</button>
        </div>
      )}

      {open && mode === "decline" && (
        <div className="card">
          <b>Not this time?</b>
          <label htmlFor="rs">Reason (optional)</label>
          <textarea id="rs" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Price, timing, went another way…" />
          {err && <div className="err">{err}</div>}
          <p><button className="bad" disabled={busy} onClick={() => submit("decline")}>Decline estimate</button></p>
          <button className="ghost" onClick={() => setMode("idle")}>Back</button>
        </div>
      )}
    </div>
  );
}
