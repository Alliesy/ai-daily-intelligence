import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MorningPaper } from "@/components/morning-paper";
import { getBriefingByDate } from "@/lib/content";
import { isValidDateKst } from "@/lib/content/calendar";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ date: string }> }): Promise<Metadata> {
  const { date } = await params;
  return { title: `${date} 브리핑` };
}

export default async function DailyBriefingPage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  if (!isValidDateKst(date)) notFound();
  const briefing = await getBriefingByDate(date);
  if (!briefing) notFound();
  return <MorningPaper briefing={briefing} isArchive />;
}
