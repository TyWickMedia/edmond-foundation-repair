import { notFound } from "next/navigation";
import { admin } from "@/lib/server";
import type { Item } from "@/lib/types";
import { EstimateView } from "./EstimateView";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

export default async function PublicEstimate({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const db = admin();
  const { data: e } = await db
    .from("estimates")
    .select("user_id, customer_name, customer_address, items, notes, total, status, created_at, signer_name, responded_at")
    .eq("public_token", token)
    .neq("status", "draft")
    .maybeSingle();
  if (!e) notFound();
  const { data: p } = await db
    .from("profiles").select("business_name, logo_url, address, license, phone").eq("id", e.user_id).single();

  return (
    <EstimateView
      token={token}
      biz={{ name: p?.business_name ?? "Your contractor", logo: p?.logo_url ?? null, address: p?.address ?? null, license: p?.license ?? null, phone: p?.phone ?? null }}
      est={{
        customer: e.customer_name, address: e.customer_address as string | null, items: e.items as Item[], notes: e.notes, total: Number(e.total),
        status: e.status, date: e.created_at, signer: e.signer_name, respondedAt: e.responded_at,
      }}
    />
  );
}
