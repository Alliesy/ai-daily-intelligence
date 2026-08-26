"use client";

import { Share2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);
  async function share() {
    const data = { title, url: window.location.href };
    if (navigator.share) await navigator.share(data); else { await navigator.clipboard.writeText(data.url); setCopied(true); }
  }
  return <Button variant="outline" size="lg" onClick={share}><Share2 aria-hidden />{copied ? "링크 복사됨" : "공유"}</Button>;
}
