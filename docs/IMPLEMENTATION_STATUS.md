# AI Daily Intelligence Web V1 Implementation Status

## V1.1 Morning Paper 진행 상태 — 2026-08-26

| 영역 | 상태 | 결과 |
|---|---|---|
| 최신 main archive 통합 | 완료 | `agent/web-v1.1`에 2026-08-26까지 비파괴 history bridge 및 daily/report 동기화 |
| Additive Git contract | 완료 | optional Morning Paper, Source taxonomy, Problem Evidence, 9 Gate; schema 1.0/legacy 유지 |
| Supabase migration/importer | 완료 | 날짜별 snapshot, service-role wrapper, 17 importer tests; Preview additive migration 및 2026-08-07~26 전체 archive backfill 완료 |
| Today Morning Paper | 완료 | Insight/Evidence/Top 0~3/Opportunity 0~1 shared renderer |
| Archive 및 Daily route | 완료 | `/archive`, 월 이동 calendar, keyword search, `/daily/[date]` snapshot |
| Navigation/반응형 | 완료 | desktop 6개 메뉴, mobile 5개 bottom nav, editorial typography |
| AI Researcher/Opportunity prompt | 완료 | Cross-Event Signal, Problem Scout, 현실성 Gate 계약 반영. 외부 Cloud Scheduled Task prompt 동기화는 main 승인 이후 별도 운영 작업 |
| 로컬 검증 | 완료 | Supabase foundation, importer 17개, Web 34개, lint, typecheck, production build 및 1440/1024/768/390px browser QA PASS |
| Preview DB/배포 | 완료 | additive migration, schema contract, RLS/격리/cascade, 전체 backfill PASS. Today와 Archive에서 2026-08-26 최신 projection 확인 |

설계 변경은 모두 backward-compatible additive이며 기존 AI Researcher 게시 순서, Git 정본, 사용자 RLS/OAuth 정책, Event Detail을 변경하지 않는다.

기존 차단 이슈는 owner 승인 후 `agent/web-v1.1`에서 최소 correction했다. 2026-08-22~25의 schema version, potential, community platform taxonomy만 정규화했고 URL·요약·Event·Source 내용은 보존했다. 전체 archive dry-run과 GitHub Actions Preview backfill run `32929594618`이 통과했으며, 작업 브랜치에 일시 추가한 sync trigger/watermark 허용은 성공 직후 제거해 현재 workflow는 다시 `main` 전용이다. GitHub `main` 정본 반영은 별도 correction-only PR/merge 단계로 남아 있다.

과거 Morning Paper는 occurrence에 저장된 표시 필드만 노출한다. Topic·Entity 기반 Archive 검색은 현재 index를 사용하므로 당시 taxonomy 자체를 재현하는 기능은 후속 additive snapshot 후보이며, 과거 카드에는 current-derived publisher/time/topic label을 표시하지 않는다.

V1.1 Preview: `https://ai-daily-intelligence-preview-o2dnw4cs1-syparks-projects.vercel.app`. Vercel Deployment Protection 때문에 익명 HTTP 요청은 로그인 화면으로 전환되지만, 연결된 Preview 세션에서 Today·Archive·invalid month fallback·390px 무가로스크롤을 확인했다. 공개 사용자 리뷰가 필요하면 Production 변경 없이 Preview deployment protection 정책을 별도로 조정해야 한다. Google OAuth 실제 로그인은 기존 `WAITING_FOR_USER`를 유지한다.

> 마지막 갱신: 2026-08-08 (Asia/Seoul)
> 현재 단계: Phase I — integration, security review, final QA 완료
> 전체 상태: V1 코드 구현 및 로컬 검증 완료, 운영 외부 설정 대기
> 구현 권한: 승인된 V1 범위 내 자율 구현

## 1. 현재 목표

기존 Git 정본과 AI Researcher 자동화를 보존하면서 Next.js, TypeScript, Supabase, Tailwind CSS, shadcn/ui, Vercel 기반의 반응형 AI Daily Intelligence Web V1을 실제 실행 가능한 상태까지 구현한다.

현재는 Web workspace와 Supabase content projection 기반을 만들고 있다. 기존 `AUTOMATION_PROMPT.md`, `schema/daily.schema.json`, `data/daily/**`, renderer와 validator는 변경하지 않는다.

## 2. 단계별 상태

| 단계 | 상태 | 결과/다음 조건 |
|---|---|---|
| 현재 저장소 분석 | 완료 | `CURRENT_ARCHITECTURE.md` |
| V1 요구사항 정리 | 완료 | 사용자 메시지와 `V1_ARCHITECTURE.md` |
| 시스템 아키텍처 설계 | 완료, 제품 방향 승인 | `V1_ARCHITECTURE.md` |
| Supabase DB/ERD 설계 | 완료, 제품 방향 승인 | `DB_SCHEMA.md` |
| 중요 결정 기록 | 완료, 제품·UX 결정 반영 | `DECISIONS.md` |
| 1차 독립 설계 검토 | approve | RLS, raw summary, cascade, candidate scope, composite FK 및 제품·UX 결정 일관성 확인 |
| 구현 전 최종 기술 검토 | READY | identity, Source taxonomy, Git ancestry/CAS, RLS, OAuth, rebuild, 다중 날짜 occurrence 보완 완료 |
| 사용자 제품·UX 승인 | 완료 | 2026-08-07 승인 및 8개 결정 확정 |
| 구현 지시 | 완료 | 2026-08-07 V1 자율 구현 승인 |
| Phase A: Web workspace/scaffold | 완료 | pnpm workspace, Next.js 16.3, TypeScript, Tailwind CSS 4 기반 생성; typecheck/lint/build 통과 |
| Phase A: Supabase migration/RLS | 완료 | schema, identity registry, 원자적 import RPC, 최소 권한 RLS/GRANT, 정적 계약 테스트 및 독립 보안 gate 통과 |
| Phase B-C: Git-to-Supabase sync | 완료 | full archive effective registry, importer CLI, ancestry/CAS, URL taxonomy, 14 tests, workflow와 독립 gate 통과 |
| Today/News Detail | 완료 | 공개 UI, Event 날짜 정렬·merge redirect·전체 Source 처리 완료 |
| Opportunities/Trends | 완료 | 공개 목록과 7/30일 Topic·Entity·Signal 집계 완료 |
| Auth/Saved/반응 기능 | 완료 | 선택적 Google OAuth, reaction/bookmark/follow와 Saved 완료 |
| Vercel 배포 | 외부 설정 필요 | 구현·검토 후 프로젝트/secret 설정 시 사용자 작업 필요 |

## 3. 완료된 문서

- `docs/CURRENT_ARCHITECTURE.md`
  - 기존 수집, Git 정본, 데이터와 보호 경계
- `docs/V1_ARCHITECTURE.md`
  - V1 시스템 경계, 페이지, sync, 보안, 실패 처리, 구현 순서
- `docs/DB_SCHEMA.md`
  - Supabase ERD, table, constraint, RLS, index, 복구 설계
- `docs/DECISIONS.md`
  - 확정 및 제안된 제품·기술 결정과 근거
- `docs/IMPLEMENTATION_STATUS.md`
  - 현재 단계, 승인 gate, 구현 진행 상태
- `docs/FINAL_TECHNICAL_REVIEW.md`
  - 구현 전 7개 핵심 영역의 문제, 보완 내용, 남은 위험과 READY 판정

## 4. 확정 요구사항

- Git 일일 JSON은 원본 archive 및 복구 정본이다.
- Supabase는 Web 조회와 사용자 기능용 DB다.
- 기본 기술 스택은 Next.js, TypeScript, Supabase, Tailwind CSS, shadcn/ui, Vercel이다.
- V1 화면은 Today, News Detail, Opportunities, Trends, Saved다.
- Event 중심이며 Event는 복수 Source를 가질 수 있다.
- 비로그인 사용자도 대부분의 콘텐츠를 읽을 수 있다.
- 로그인 사용자는 좋아요, 싫어요, 관심, 저장, Topic follow를 사용할 수 있다.
- 사용자 반응은 사실 신뢰도에 영향을 주지 않는다.
- 기존 AI Researcher 자동화와 Git 정본을 깨뜨리면 안 된다.
- membership, entitlement, payment, comment, collection, recommendation, notification, community는 V1에서 과도하게 미리 구현하지 않는다.
- 공개 콘텐츠는 로그인 없이 즉시 열람하며 최초 진입 로그인 gate를 두지 않는다.
- V1 로그인 provider는 Google OAuth 하나다.
- 개인 기능 요청 때만 로그인 안내를 표시하고 OAuth 후 원래 페이지로 복귀한다.
- 신규 표시 콘텐츠는 한국어가 기본이며 legacy 영어는 일괄 번역 없이 원문 fallback을 허용한다.
- AI 점수는 DB에 유지하지만 V1 UI는 `S/A/B` 중요도만 표시한다.
- 대표 이미지는 검증 가능한 원문/공식 출처만 사용하고 AI 생성 이미지를 사용하지 않는다.
- partial Briefing도 비차단 경고와 함께 공개할 수 있다.
- News Detail은 상단 원문 CTA와 하단 전체 Source 목록을 제공한다.

## 5. 승인된 설계 결정

다음 설계 방향은 사용자에게 승인되었다.

- `apps/web` 기반 monorepo 구조
- GitHub Actions 기반 비동기 Supabase sync
- service-role 전용 atomic import RPC
- Server Component 우선 Next.js 구성
- Event별 단일 reaction row
- Source authority와 Event별 verification status 분리
- 명시적 점수가 없는 legacy Event의 `ai_score = null`
- 명시적 근거가 없는 Opportunity–Event 관계 미생성
- 대표 이미지의 출처 표시와 무단 복제 금지
- build-candidate 상태의 Briefing occurrence 저장
- legacy summary 원문 보존과 parse fallback
- public Event route의 별도 slug 사용
- checksum reversion을 포함한 per-path Git commit ancestry watermark
- immutable Event UUID와 versioned event key alias/merge registry
- Source UUID, URL alias/canonical 이력과 보수적 taxonomy fallback
- commit ancestry + cursor CAS 기반 Git watermark
- 날짜별 Event/Source/Opportunity occurrence snapshot
- staging reconcile 기반 사용자 데이터 보존형 content rebuild
- service-role 전용 definer RPC façade, private 운영 table, service client 분리, security-invoker view 원칙
- PKCE와 엄격한 same-origin return path 검증

상세 근거는 `DECISIONS.md`를 따른다.

## 6. 미결정 사항

| 항목 | 권장 기본값 | 결정이 필요한 이유 |
|---|---|---|
| Source taxonomy 확장 | V1 exact-domain v1 외에는 other/unknown/unverified | 추가 provider/domain은 evidence fixture와 review 필요 |
| Supabase/Vercel region | 한국 사용자 latency 우선 | 비용, 데이터 위치, 가용 region 확인 필요 |
| Backup/PITR | 구현 전 운영 수준 확정 | 콘텐츠 projection과 사용자 데이터의 복구 요구가 다름 |
| 비용 한도 | 구현 전 owner 확정 | 외부 서비스 생성과 운영비 승인 필요 |
| Google OAuth 운영 | consent screen, 허용 계정, 개인정보 고지 확정 | 외부 OAuth 설정과 개인정보 처리가 필요 |

## 7. 외부 환경·배포 전 필수 gate

외부 환경 연결과 배포는 다음이 모두 충족된 후 진행한다.

1. Supabase/Vercel project와 비용·region을 사용자가 승인한다.
2. production migration을 사전 검토하고 destructive operation이 없음을 확인한다.
3. Google OAuth consent, callback URL과 개인정보 고지를 설정한다.
4. service-role secret을 GitHub environment에, public key만 Vercel server/client 경계에 설정한다.

리전, backup/PITR, 비용, OAuth consent 운영 설정은 외부 환경 생성 전 gate이며 local scaffold, migration 초안과 importer 구현을 시작하는 구조적 blocker는 아니다.

## 8. 구현 순서

승인 후 권장 순서:

1. 기존 자동화 회귀 baseline 확보
2. Web workspace와 별도 CI scaffold
3. Supabase migrations, index, RLS, DB tests
4. importer와 atomic sync/backfill
5. 공개 read-only Today와 Event Detail
6. Opportunities와 Trends
7. Auth, reaction, bookmark, follow, Saved
8. cache, SEO, observability, responsive/accessibility 검증
9. 독립 implementation/security review
10. 승인된 환경에 배포

## 9. 기술 acceptance criteria

- 기존 daily JSON path와 schema version을 계속 읽을 수 있다.
- 기존 Python validation과 renderer 동작이 유지된다.
- Git commit 성공이 Supabase 또는 Vercel 상태에 의존하지 않는다.
- 동일 packet sync는 멱등이다.
- 동시 sync는 직렬화되며 한 번 실행한 것과 결과가 같다.
- sync 순서는 commit ancestry와 cursor CAS로 판정하고 diverged history는 중단한다.
- identity-only correction과 mapper version 변경은 projection input checksum으로 감지해 raw JSON이 같아도 재투영한다.
- 과거 correction은 최신 Event current state를 덮어쓰지 않는다.
- Event key 변경은 alias로 복구되고 충돌은 quarantine된다.
- Source URL 변형과 불확실 taxonomy가 보수적으로 처리된다.
- 동일 Event의 날짜별 표시·Analysis·Source·Opportunity occurrence가 덮어써지지 않는다.
- current occurrence가 correction에서 제거되면 남은 occurrence로 current/first/last를 재계산하고 없으면 archive한다.
- Git archive와 identity registry에서 콘텐츠 projection 전체를 stable identity까지 복구할 수 있다.
- 운영 content rebuild는 사용자 데이터와 Event 연결을 보존한다.
- public user는 게시 콘텐츠만 읽을 수 있다.
- authenticated user는 자신의 user data만 변경할 수 있다.
- 계정 삭제 시 reaction, bookmark, follow가 cascade 삭제된다.
- service-role key가 client에 노출되지 않는다.
- anon/authenticated가 import RPC, private 운영 table, 다른 사용자의 row, definer view를 통해 RLS를 우회할 수 없다.
- 사용자 반응은 analysis/verification/importance를 변경하지 않는다.
- News Detail은 복수 Source와 원본 링크를 명확히 표시한다.
- 핵심 화면이 모바일과 데스크톱에서 동작한다.
- 공개 route는 로그인 없이 열리고 최초 진입 강제 login UX가 없다.
- Google OAuth PKCE 후 검증된 same-origin return path로 원래 Event 또는 페이지에 복귀하고 악성 next는 `/`로 fallback한다.
- partial Briefing은 명확하지만 비차단 상태 안내와 함께 공개된다.
- V1 UI는 수치 AI 점수를 노출하지 않는다.
- 검증 가능한 출처가 없는 대표 이미지와 AI 생성 뉴스 이미지를 사용하지 않는다.

## 10. 변경 기록 규칙

- 설계가 바뀌면 `V1_ARCHITECTURE.md`, `DB_SCHEMA.md`, `DECISIONS.md` 중 관련 문서를 코드와 같은 변경 단위에서 갱신한다.
- 구현 상태가 바뀌면 이 문서의 단계 표, 완료 항목, 다음 작업을 갱신한다.
- 주요 사용자-visible 결과는 향후 `docs/CHANGELOG.md`에 기록한다.
- 중요한 결정은 기존 내용을 덮어쓰지 않고 `DECISIONS.md`에 새 ID로 추가한다.

## 11. 다음 권장 작업

1. Supabase public read adapter와 credential 없는 archive preview adapter를 구현한다.
2. Today와 Event Detail을 text-first 반응형 Server Component로 구현한다.
3. Source CTA, authority/verification badge, partial briefing 안내와 이미지 없는 fallback을 검증한다.
4. 실제 Supabase runtime을 사용할 수 있게 되면 migration, 역할별 RLS와 account deletion cascade SQL 검증을 실행한다.

## 12. 2026-08-08 Phase D-E 완료 기록

- 상태: `완료`
- 완료: Next.js 공개 Server Component DAL, Supabase public projection adapter, Git archive preview adapter
- 완료: Today의 Today's Insight, 핵심 Event, Opportunity Radar, Trending Signals, Tools/Open Source/Papers
- 완료: Event Detail의 S/A/B, FACT/INTERPRETATION/SIGNAL/SPECULATION, 중요성·전망·사업 기회, 상단 원문 CTA, 전체 Source와 YouTube thumbnail
- 완료: 로그인 강제 없는 반응형 header와 선택적 로그인 진입점
- 검증: Web typecheck, ESLint, Next.js production build 통과; archive에서 Today 1개와 Event 3개 정적 생성
- 진행 중: Phase F-G — Opportunities, Trends, Saved, Google OAuth, reaction/bookmark/follow
- 대기: 실제 Supabase/PostgreSQL runtime RLS 통합 검증과 Google OAuth/Vercel 운영 설정은 외부 환경 필요

## 13. 2026-08-08 Phase F-I 완료 기록

- 상태: `V1 코드 구현 및 로컬 release gate 완료`
- 완료: Opportunities 목록·상세 정보, 7/30일 Topic/Entity 변화와 Signal
- 완료: 선택적 Google OAuth PKCE route, same-origin return path 검증, session refresh Proxy
- 완료: reaction like/dislike/interest, bookmark, Topic Follow client와 Saved 개인 DAL
- 완료: sitemap, robots, dynamic metadata, 404, mobile/desktop text-first responsive UI
- 검증 완료: OAuth return path와 Event occurrence/source/merge route Web 단위 테스트 15개 통과
- 검증 완료: 브라우저에서 Today, Event Detail, Opportunities, Trends, Saved, 개인 기능→로그인 복귀 확인; 390px 가로 overflow 및 console runtime error 없음
- 검증 완료: `pnpm test`, `pnpm lint`, `pnpm typecheck`, `pnpm build` 통과
- 외부 설정 필요: Supabase project migration, Google provider/consent/callback, Vercel public env, 실제 역할별 RLS integration test
- 독립 보안 리뷰: 최종 `READY`. 공개 route 비강제 로그인, Web service-role 미사용, 사용자별 RLS 경계, PKCE/open redirect 방어, Git 정본 비변경을 확인했다. 1차 지적의 occurrence 정렬·merge redirect·전체 Source 집계와 return-path 문서 계약을 수정한 뒤 재검토를 통과했다.
- 남은 gate: preview Supabase에서 migration, 역할별 RLS, account deletion cascade와 실제 Google OAuth callback을 통합 검증한다.

## 14. 2026-08-08 Preview Supabase 통합 검증

- 상태: `PASS`
- Preview 프로젝트: `ai-daily-intelligence-preview` (`obqlzsnoavoxlqjrhsnl`), Free/nano, AWS Seoul (`ap-northeast-2`)
- 적용 완료: V1 migration 2개, service-role 직접 테이블 권한 차단 교정, importer RPC 컬럼명 교정
- import 완료: 원격 `agent/web-v1` commit `c53899930ce086579ad85b407ec6d7a8eab3fde5`를 Preview 검증 watermark로 사용해 2026-08-07 archive 1건 backfill
- projection 결과: Briefing 1, Event 3, Source 6, Analysis 3, Opportunity 2, Resource 5, Signal 2
- 멱등성: 동일 commit backfill 재실행은 `same_sha`로 skip
- DB 검증: `schema_contract.sql` PASS, `rls_integration.sql` PASS
- RLS 범위: anon published read/draft 차단, 사용자 A/B profile·reaction·bookmark·follow 격리, 교차 insert/update/delete 차단, service-role 개인 테이블 직접 쓰기 차단, `auth.users` 삭제 cascade
- 정리: fixture transaction rollback 확인, 검증용 secret key와 로컬 임시 credential 파일 삭제, legacy HS256 JWT key 폐기 확인
- 로컬 gate: `pnpm test` 29개 PASS, `pnpm lint` PASS, `pnpm typecheck` PASS, `pnpm build` PASS
- 남은 외부 설정: Google OAuth Preview provider/consent/callback, Vercel Preview 연결과 환경 변수, 향후 자동 sync용 GitHub Preview environment secret
- Production Supabase, Production Vercel, GitHub main은 변경하지 않음

## 15. 2026-08-08 Preview Google OAuth 설정

- 상태: `WAITING_FOR_USER`
- Supabase Preview `Site URL`: `http://localhost:3000`
- Supabase Preview exact redirect allowlist: `http://localhost:3000/auth/callback`, `https://ai-daily-intelligence-preview-gn3buyh18-syparks-projects.vercel.app/auth/callback`
- Google OAuth client가 등록해야 할 Supabase callback: `https://obqlzsnoavoxlqjrhsnl.supabase.co/auth/v1/callback`
- Google provider: Disabled. Preview 전용 Google OAuth Client ID와 Client Secret이 아직 없음
- 유지된 보안 계약: PKCE code exchange, exact local callback allowlist, same-origin return-path 검증, 공개 route 비강제 로그인
- 사용자 작업: Google Auth Platform에서 Preview용 Web application OAuth client를 만들고 최소 identity scope만 설정한 뒤 Client ID/Secret을 Supabase Preview Google provider에 입력
- 실제 로그인 통합 테스트는 provider credential 설정 후 가능
- Production Supabase, Vercel Production, main은 변경하지 않음

## 16. 2026-08-08 Vercel Preview 배포

- 상태: `PASS`
- Vercel 프로젝트: `ai-daily-intelligence-preview`, Hobby 범위
- Preview URL: `https://ai-daily-intelligence-preview-gn3buyh18-syparks-projects.vercel.app`
- 배포 소스: 로컬 `agent/web-v1` 체크아웃. Git 자동 배포 연결과 Production 승격은 수행하지 않음
- 프로젝트 Root Directory: `apps/web`
- Preview 전용 환경 변수: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SITE_URL` 설정 완료
- QA 수정: PostgREST가 직접 연결할 수 없던 `event_source_occurrences → sources` 조회를 승인된 composite FK 경로인 `event_source_occurrences → event_sources → sources`로 교정
- 검증: 전체 test 29개, lint, typecheck, Supabase 연동 production build PASS; 실제 Preview Today 공개 페이지와 3개 Event 렌더링 확인
- Google OAuth: `WAITING_FOR_USER` 유지. Google provider 활성화나 Client ID/Secret 입력은 수행하지 않음
- Production Vercel, Production Supabase, GitHub main은 변경하지 않음

## 17. 2026-08-14 승인 목업 기반 UI/UX 개선

- 상태: `구현·검증·Vercel Preview 재배포 완료`
- 디자인 정본: `docs/UI_DESIGN_SPEC.md` 생성
- 완료: 전역 newsroom typography와 compact header, 한국어 navigation label
- 완료: News Detail 최종 콘텐츠 순서, 원문 상세 disclosure, Desktop 분석 card grid, mobile accordion, compact Opportunity/Source list
- 완료: Today, Opportunities, Trends, Saved의 정보 밀도와 card 사용 조정
- 데이터 처리: DB/schema 변경 없이 기존 summary와 정규화된 FACT로 rights-safe detailed summary 구성; legacy 영어는 fallback
- 보존: Git archive, AI Researcher, daily schema, RLS, PKCE/open redirect, 사용자 격리 변경 없음
- 로컬 확인: Desktop·Tablet·390px의 Today, News Detail, Opportunities, Trends, Saved에서 가로 overflow 없음. 원문 접기/펼치기, mobile analysis accordion, 개인 기능의 선택적 로그인 안내와 현재 Event 유지 확인
- 품질 gate: Supabase foundation contract, importer test 14개, Web test 21개, lint, typecheck, production build 통과
- 독립 검토 수정: legacy 누적 분석 정규화를 `FACT:`로 시작하고 네 label이 정확히 한 번 canonical 순서로 존재하는 알려진 형식에만 한정. fact 외 field는 누적 FACT에서 계산한 suffix와 전체 문자열이 정확히 일치할 때만 정리하고 그 외 structured value는 보존
- 독립 검토: 데이터 보존 우선 수정 후 최종 `READY`
- Preview: `https://ai-daily-intelligence-preview-gohilzj20-syparks-projects.vercel.app`에서 Today와 mobile News Detail, Supabase projection, 원문 disclosure, accordion, 선택적 로그인 안내 확인
- 배포 보안: 배포용 1시간 임시 Vercel token과 임시 전달 파일은 배포 직후 폐기·삭제
- 남은 외부 gate: Google OAuth 실제 로그인은 기존대로 owner credential 대기. Production 승격과 main merge는 수행하지 않음

## 18. 2026-08-14 Today 페이지 최종 목업 적용

- 상태: `구현·검증·Vercel Preview 배포 완료`
- 완료: Today 상단 인사이트와 실제 briefing metric 4개, lead Event와 compact secondary Event hierarchy
- 완료: 사업 기회 레이더, 트렌딩 시그널, URL 중복 제거 도구·오픈소스·논문 3열 dashboard
- 완료: Today lead Event의 좋아요·싫어요·관심·저장·공유 action과 개인 기능 요청 시 선택적 로그인 복귀
- 완료: desktop newsroom header의 뉴스 진입점과 mobile header/menu, 5항목 fixed bottom navigation
- 데이터 원칙: 목업 예시 수치·이미지·상승률을 복제하지 않고 Preview의 Event 3, Source 6, Signal 2, Opportunity 2, Resource 5만 표시
- 반응형 QA: 1440px, 820px, 390px에서 가로 overflow 없음. 390px 하단 navigation이 footer와 콘텐츠를 가리지 않음
- 브라우저 QA: 공개 Today 직접 진입, 개인 action → `/login?next=%2F`, external resource, console error 없음
- 검증: importer 14개 + Web 21개 test PASS, lint PASS, typecheck PASS, production build PASS
- 보존: Supabase migration/RLS, importer, Git archive, AI Researcher, daily schema, PKCE/open redirect를 변경하지 않음
- Preview: `https://ai-daily-intelligence-preview-git-agent-web-v1-syparks-projects.vercel.app` (`agent/web-v1` branch alias)
- 배포 확인: Vercel Preview `Ready`, 실제 Supabase projection의 Event 3개 렌더링, 390px overflow 0, console error 0
- 대기: Google OAuth provider credential 설정 후 실제 Google 로그인 callback 통합 검증
- 외부 설정: Google OAuth 실제 로그인은 기존 `WAITING_FOR_USER` 유지

## 20. 2026-08-14 최신 Supabase projection 실시간 반영

- 상태: `구현·검증·Vercel Preview 배포 완료`
- 발견: Preview Supabase는 2026-08-14까지 동기화됐지만 공개 페이지가 빌드 시점의 2026-08-07 데이터를 정적으로 유지
- 수정: Today, News Detail, Opportunities, Trends를 요청 시 동적 렌더링하도록 명시
- 회귀 방지: 네 공개 콘텐츠 route의 dynamic 정책을 검사하는 Web test 4개 추가
- 검증: importer 14개 + Web 25개 test PASS, lint PASS, typecheck PASS, production build PASS
- build 증거: `/`, `/events/[slug]`, `/opportunities`, `/trends`가 모두 dynamic server-rendered route로 출력
- Preview: `https://ai-daily-intelligence-preview-git-agent-web-v1-syparks-projects.vercel.app`
- live 검증: 2026-08-14 briefing, Event 5건, Source 15건, 07:02 업데이트 표시 및 console warning/error 없음
- 보존: Supabase schema/RLS, importer, Git archive, AI Researcher, daily schema, OAuth 보안 정책 변경 없음
