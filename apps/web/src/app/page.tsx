import { MorningPaper } from "@/components/morning-paper";
import { getLatestBriefing } from "@/lib/content";

export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const briefing = await getLatestBriefing();
  if (!briefing) return <main className="mx-auto min-h-[60vh] max-w-5xl px-5 py-20"><h1 className="font-serif text-3xl font-semibold">아직 공개된 브리핑이 없습니다.</h1></main>;
  return <MorningPaper briefing={briefing} />;
}
