import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { GoogleLoginButton } from "@/components/google-login-button";
import { safeReturnPath } from "@/lib/auth/return-path";
import { getSupabasePublicConfig } from "@/lib/supabase/config";

type Props = { searchParams: Promise<{ next?: string | string[] }> };

export default async function LoginPage({ searchParams }: Props) {
  const raw = (await searchParams).next;
  const returnPath = safeReturnPath(Array.isArray(raw) ? raw[0] : raw);
  const configured = Boolean(getSupabasePublicConfig());
  return <main className="mx-auto grid min-h-[70vh] max-w-lg place-items-center px-4 py-16"><section className="w-full rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-10"><Link href={returnPath} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950"><ArrowLeft className="size-4" aria-hidden />읽던 페이지로 돌아가기</Link><div className="mt-10 grid size-12 place-items-center rounded-2xl bg-sky-50 text-sky-700"><ShieldCheck aria-hidden /></div><h1 className="mt-5 text-3xl font-black tracking-tight">로그인은 선택 사항입니다</h1><p className="mt-4 leading-7 text-slate-600">공개 콘텐츠는 로그인 없이 계속 읽을 수 있습니다. 저장, 관심, 반응, Topic Follow를 사용할 때만 Google 로그인이 필요합니다.</p><div className="mt-8"><GoogleLoginButton returnPath={returnPath} configured={configured} /></div>{!configured && <p role="status" className="mt-4 rounded-xl bg-amber-50 p-3 text-sm leading-6 text-amber-900">로컬 환경에 Supabase OAuth 설정이 없어 로그인만 비활성화되어 있습니다. 공개 콘텐츠는 정상적으로 이용할 수 있습니다.</p>}<p className="mt-6 text-xs leading-5 text-slate-500">로그인하면 인증을 위해 Google과 Supabase가 계정 식별 정보를 처리합니다. V1은 Google OAuth만 지원합니다.</p></section></main>;
}
