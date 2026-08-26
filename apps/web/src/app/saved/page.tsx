import Link from "next/link";
import { Bookmark, Heart, LogIn, Tags } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getUserCollections, type SavedEventDto } from "@/lib/user/collections";

export const metadata = { title: "저장됨", description: "저장·관심·Follow한 AI Intelligence" };
export const dynamic = "force-dynamic";

export default async function SavedPage() {
  const data = await getUserCollections();
  if (data.status !== "signed_in") return <main className="mx-auto grid min-h-[65vh] max-w-xl place-items-center px-4 py-14"><section className="w-full rounded-lg border border-slate-200 bg-white p-7 text-center"><Bookmark className="mx-auto size-8 text-blue-600" aria-hidden /><h1 className="mt-4 text-2xl font-black">나만의 Intelligence 보관함</h1><p className="mt-3 text-sm leading-6 text-slate-600">저장한 Event, 관심 표시한 소식, Follow한 Topic을 한곳에서 봅니다. 공개 콘텐츠 탐색에는 로그인이 필요하지 않습니다.</p><Button className="mt-6" asChild><Link href="/login?next=%2Fsaved"><LogIn aria-hidden />Google로 로그인</Link></Button>{data.status === "unconfigured" && <p className="mt-4 text-xs text-amber-700">현재 환경에는 OAuth 설정이 없어 개인 기능만 비활성화되어 있습니다.</p>}</section></main>;
  return <main><header className="border-b border-slate-200 bg-white"><div className="mx-auto max-w-6xl px-4 py-9 sm:px-6 lg:px-8"><p className="section-kicker">MY INTELLIGENCE</p><h1 className="mt-2 text-[1.8rem] font-black tracking-[-0.03em] sm:text-[2.15rem]">저장됨</h1><p className="mt-3 text-sm text-slate-600">내 계정에만 보이는 저장·관심·Follow 목록입니다.</p></div></header><div className="mx-auto grid max-w-6xl gap-5 px-4 py-8 sm:px-6 lg:grid-cols-2 lg:px-8"><Collection title="저장한 Event" icon={Bookmark} events={data.bookmarked} /><Collection title="관심 Event" icon={Heart} events={data.interested} /><section className="rounded-lg border border-slate-200 bg-white p-5 lg:col-span-2"><h2 className="flex items-center gap-2 text-lg font-black"><Tags className="text-blue-600" aria-hidden />Follow한 Topic</h2><div className="mt-4 flex flex-wrap gap-1.5">{data.topics.map((topic) => <Badge key={topic.id}>{topic.name}</Badge>)}{!data.topics.length && <p className="text-sm text-slate-500">아직 Follow한 Topic이 없습니다.</p>}</div></section></div></main>;
}
function Collection({ title, icon: Icon, events }: { title: string; icon: typeof Bookmark; events: SavedEventDto[] }) {
  return <section className="rounded-lg border border-slate-200 bg-white p-5"><h2 className="flex items-center gap-2 text-lg font-black"><Icon className="text-blue-600" aria-hidden />{title}</h2><div className="mt-4 divide-y divide-slate-200">{events.map((event) => <Link key={event.id} href={`/events/${event.slug}`} className="block py-3 first:pt-0 hover:text-blue-700"><Badge>{event.importance} 중요도</Badge><h3 className="mt-2 text-sm font-bold leading-6">{event.title}</h3><p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-600">{event.summary}</p></Link>)}{!events.length && <p className="text-sm text-slate-500">아직 선택한 Event가 없습니다.</p>}</div></section>;
}
