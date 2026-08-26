import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return <main className="mx-auto grid min-h-[65vh] max-w-xl place-items-center px-4 py-16 text-center"><div><p className="section-kicker">404</p><h1 className="mt-3 text-4xl font-black">요청한 Intelligence를 찾지 못했습니다</h1><p className="mt-4 leading-7 text-slate-600">Event가 병합되었거나 주소가 변경되었을 수 있습니다. Today에서 최신 브리핑을 확인해 주세요.</p><Button className="mt-7" asChild><Link href="/">Today로 이동</Link></Button></div></main>;
}
