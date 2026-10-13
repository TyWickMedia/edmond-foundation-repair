"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/lib/types";

/**
 * Gate for signed-in pages. Redirects to /login if no session, and makes sure
 * a profile row exists (created from the business name typed at sign-up).
 */
export function useAuth() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const sb = supabase();
      const { data } = await sb.auth.getSession();
      if (!data.session) { router.replace("/login"); return; }
      const uid = data.session.user.id;
      let { data: p } = await sb.from("profiles").select("*").eq("id", uid).maybeSingle();
      if (!p) {
        const name = (data.session.user.user_metadata?.business_name as string) || "My Business";
        const ins = await sb.from("profiles").insert({ id: uid, business_name: name }).select().single();
        p = ins.data;
      }
      if (!alive) return;
      setSession(data.session);
      setProfile(p as Profile);
      setReady(true);
    })();
    return () => { alive = false; };
  }, [router]);

  return { session, profile, setProfile, ready };
}
