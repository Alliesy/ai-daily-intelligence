"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { safeReturnPath } from "@/lib/auth/return-path";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function GoogleLoginButton({ returnPath, configured }: { returnPath: string; configured: boolean }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  async function login() {
    if (!configured) return;
    setPending(true); setError(null);
    const next = safeReturnPath(returnPath);
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
    const { error: authError } = await createSupabaseBrowserClient().auth.signInWithOAuth({ provider: "google", options: { redirectTo } });
    if (authError) { setError("로그인을 시작하지 못했습니다. 잠시 후 다시 시도해 주세요."); setPending(false); }
  }
  return <div><Button size="lg" className="w-full" disabled={!configured || pending} onClick={login}><span className="text-base" aria-hidden>G</span>{pending ? "Google로 이동 중…" : "Google로 계속하기"}</Button>{error && <p role="alert" className="mt-3 text-sm text-rose-700">{error}</p>}</div>;
}
