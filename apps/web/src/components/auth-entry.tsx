"use client";

import Link from "next/link";
import { LogIn, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY));

export function AuthEntry() {
  const router = useRouter();
  const pathname = usePathname();
  const [email, setEmail] = useState<string | null>(null);
  useEffect(() => {
    if (!configured) return;
    const client = createSupabaseBrowserClient();
    void client.auth.getUser().then(({ data }: Awaited<ReturnType<typeof client.auth.getUser>>) => setEmail(data.user?.email ?? null));
    const { data } = client.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => setEmail(session?.user.email ?? null));
    return () => data.subscription.unsubscribe();
  }, []);

  if (!email) return <Button variant="outline" size="sm" asChild><Link href={`/login?next=${encodeURIComponent(pathname)}`}><LogIn aria-hidden />로그인</Link></Button>;
  return <Button variant="outline" size="sm" title={email} onClick={async () => { await createSupabaseBrowserClient().auth.signOut(); router.push("/"); router.refresh(); }}><LogOut aria-hidden />로그아웃</Button>;
}
