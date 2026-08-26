"use client";

import Link from "next/link";
import { LogIn, LogOut, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const configured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
);

export function AuthEntry({ view = "button" }: { view?: "button" | "mobile-nav" }) {
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

  if (view === "mobile-nav") {
    if (!email) return (
      <Link href={`/login?next=${encodeURIComponent(pathname)}`} className="mobile-nav-item">
        <UserRound aria-hidden />
        <span>로그인</span>
      </Link>
    );
    return (
      <button
        type="button"
        title={email}
        className="mobile-nav-item"
        onClick={async () => {
          await createSupabaseBrowserClient().auth.signOut();
          router.push("/");
          router.refresh();
        }}
      >
        <LogOut aria-hidden />
        <span>로그아웃</span>
      </button>
    );
  }

  if (!email) return (
    <Button variant="outline" size="sm" asChild>
      <Link href={`/login?next=${encodeURIComponent(pathname)}`}><LogIn aria-hidden />로그인</Link>
    </Button>
  );

  return (
    <Button
      variant="outline"
      size="sm"
      title={email}
      className={cn("max-w-40")}
      onClick={async () => {
        await createSupabaseBrowserClient().auth.signOut();
        router.push("/");
        router.refresh();
      }}
    >
      <LogOut aria-hidden />로그아웃
    </Button>
  );
}
