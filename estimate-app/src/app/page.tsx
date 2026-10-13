"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/useAuth";
import { supabase } from "@/lib/supabase";
import { usd } from "@/lib/money";
import type { Estimate, Status } from "@/lib/types";

const FILTERS: { key: "all" | Status; label: string }[] = [
  { key: "all", label: "All" },
  { key: "sent", label: "Sent" },
  { key: "viewed", label: "Viewed" },
  { key: "accepted", label: "Accepted" },
  { key: "declined", label: "Declined" },
];

export default function Home() {
  const { profile, ready } = useAuth();
  const [rows, setRows] = useState<Estimate[] | null>(null);
  const [filter, setFilter] = useState<"all" | Status>("all");

  useEffect(() => {
    if (!ready) return;
    const load = () =>
      supabase().from("estimates").select("*").order("created_at", { ascending: false }).limit(200)
        .then(({ data }) => setRows((data as Estimate[]) ?? []));
    load();
    const t = setInterval(load, 20000); // pick up Viewed/Accepted without a refresh
    return () => clearInterval(t);
  }, [ready]);

  if (!ready) return <main className="wrap muted">Loading…</main>;
  const shown = (rows ?? []).filter((r) => filter === "all" || r.status === filter);
  const counts = (rows ?? []).reduce<Record<string, number>>((m, r) => ((m[r.status] = (m[r.status] ?? 0) + 1), m), {});

  return (
    <main className="wrap">
      <div className="top">
        <span className="biz">{profile?.business_name}</span>
        <Link href="/settings">Settings</Link>
      </div>
      <h1>Estimates</h1>
      <div className="tabs" role="tablist">
        {FILTERS.map((f) => (
          <button key={f.key} className={filter === f.key ? "on" : ""} onClick={() => setFilter(f.key)}>
            {f.label}{f.key !== "all" && counts[f.key] ? ` ${counts[f.key]}` : ""}
          </button>
        ))}
      </div>
      {rows === null ? <p className="muted">Loading…</p> : shown.length === 0 ? (
        <p className="muted">{rows.length === 0 ? "No estimates yet. Tap the big button." : "Nothing here."}</p>
      ) : shown.map((r) => (
        <Link key={r.id} href={`/estimate/${r.id}`} className="card row">
          <div>
            <div className="who">{r.customer_name}</div>
            <span className={`badge ${r.status}`}>{r.status}</span>{" "}
            <span className="muted small">{new Date(r.created_at).toLocaleDateString()}</span>
          </div>
          <div className="amt">{usd(Number(r.total))}</div>
        </Link>
      ))}
      <Link href="/new" className="btn primary fab">+ New estimate</Link>
    </main>
  );
}
