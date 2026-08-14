# AI Daily Intelligence Decision Log

## 2026-08-08 구현 결정

### D-041 — 선택적 Google OAuth는 PKCE callback과 검증된 return path만 사용

- 상태: `confirmed`
- 결정: 공개 route는 Proxy에서 차단하지 않는다. 개인 기능 실행 시 `/login?next=...`로 이동하고 Supabase Google OAuth PKCE callback이 code를 교환한 뒤 검증된 상대 경로로만 복귀한다.
- 근거: 최초 진입 login gate를 없애면서 open redirect와 클라이언트 session 신뢰 문제를 방지한다.
- 보안 규칙: `next`는 반복 decoding 뒤 `/`로 시작하고 `//`, backslash, 제어 문자, encoding 상한 초과가 없어야 한다. unsigned `next`는 로컬 탐색 위치만 담고 권한·mutation replay에 쓰지 않으며 실패하면 `/`로 fallback한다.
- 영향: V1 provider는 Google 하나이며 OAuth credential·consent screen·정확한 callback allowlist는 운영 설정 gate다.

### D-042 — 개인 mutation은 사용자 JWT와 RLS를 유일한 쓰기 경계로 사용

- 상태: `confirmed`
- 결정: reaction, bookmark, follow는 Supabase browser client가 현재 사용자의 JWT로 직접 변경한다. 모든 row에 `user_id`를 명시하되 DB RLS의 `auth.uid() = user_id`가 타 사용자 접근을 거부한다.
- 근거: 별도 privileged API 없이 V1의 작은 mutation surface를 구현하고 service-role 노출 가능성을 제거한다.
- 영향: UI의 로그인 여부는 편의 기능일 뿐이며 실제 권한 검사는 RLS다. Saved server DAL도 `auth.getUser()` 후 본인 row만 조회한다.

### D-043 — Trends는 최신 Briefing 날짜를 기준으로 7/30일 occurrence를 비교

- 상태: `confirmed`
- 결정: Topic/Entity 빈도는 서버 현재 시각이 아니라 최신 공개 Briefing의 `date_kst`를 종료일로 삼고 기간 전·후반 Event occurrence 수의 차이를 표시한다.
- 근거: archive가 지연되거나 재구축되어도 같은 Git snapshot은 같은 trend 결과를 내야 한다.
- 한계: 빈도 변화는 중요도·사실 신뢰도를 뜻하지 않으며 구조화 Entity가 없는 legacy archive에서는 빈 상태를 명시한다.

### D-038 — 웹 공개 조회는 server-only DAL과 최소 DTO를 사용

- 상태: `confirmed`
- 결정: 공개 콘텐츠 조회는 `apps/web/src/lib/content`의 Server Component 전용 DAL을 통해서만 수행하고 화면에는 최소 DTO만 전달한다. 웹 런타임에는 publishable/anon key만 허용하며 service-role key를 사용하지 않는다.
- 근거: Supabase RLS를 공개 조회 경계로 유지하고 DB row와 내부 projection 필드를 Client Component에 그대로 노출하지 않기 위해서다.
- 대안: 각 페이지에서 직접 Supabase query, service-role 기반 SSR query
- 제외 이유: query·권한 규칙이 분산되고 service-role 노출 또는 RLS 우회 위험이 커진다.
- 영향: 이후 Auth/개인 기능도 브라우저 세션 client와 privileged importer를 별도 모듈로 유지한다.

### D-039 — Supabase projection과 Git archive preview가 동일 DTO를 공유

- 상태: `confirmed`
- 결정: `CONTENT_SOURCE=supabase`에서는 공개 Supabase projection을 읽고, 자격 증명이 없는 로컬·CI에서는 Git daily archive adapter가 동일 DTO를 만든다. 환경 변수 쌍이 불완전하거나 명시적 Supabase mode에서 누락되면 fail-closed한다.
- 근거: Git 정본에서 복구 가능한지 지속 검증하면서 외부 credential 없이도 build·UI 개발을 재현할 수 있다.
- 대안: 모든 환경에서 Supabase 필수, archive JSON을 Client에서 직접 import
- 제외 이유: 전자는 로컬/CI를 외부 상태에 결합하고 후자는 원본 구조를 UI에 결합하며 불필요한 데이터를 브라우저에 보낸다.
- 영향: archive mode는 preview/build fallback이며 production 운영 조회의 기본 목표는 Supabase다. legacy 영어 콘텐츠는 원문 fallback한다.

### D-040 — shadcn/ui는 최소 dependency와 소유 가능한 컴포넌트로 도입

- 상태: `confirmed`
- 결정: `@radix-ui/react-slot`, `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`로 `components/ui`의 최소 primitive부터 도입한다. Supabase 공개 조회·SSR Auth를 위해 `@supabase/ssr`, `@supabase/supabase-js`를 추가한다.
- 근거: V1에 필요한 접근 가능한 primitive와 variant 조합만 유지해 UI 의존성과 생성 코드를 최소화한다.
- 영향: 미사용 미래 컴포넌트는 미리 추가하지 않는다.

> 작성일: 2026-08-07 (Asia/Seoul)
> 목적: 중요한 제품·기술 결정을 근거, 대안, 영향과 함께 지속적으로 기록한다.

## 상태 정의

- `confirmed`: 사용자 요구사항 또는 기존 운영 계약으로 확정
- `proposed`: 설계 권고이며 사용자 승인 대기
- `superseded`: 후속 결정으로 대체
- `rejected`: 검토 후 채택하지 않음

## 결정 요약

| ID | 상태 | 결정 |
|---|---|---|
| D-001 | confirmed | GitHub `main/data/daily/**`를 콘텐츠 기록 정본으로 유지한다. |
| D-002 | confirmed | Supabase는 웹 조회 및 사용자 기능용 서비스 DB로 사용한다. |
| D-003 | confirmed | 콘텐츠의 기본 단위는 article이 아니라 Event다. |
| D-004 | confirmed | Git-to-Supabase sync는 Git commit 이후 별도 GitHub Actions workflow로 실행한다. |
| D-005 | confirmed | Web은 `apps/web`, importer는 별도 package, DB migration은 `supabase`에 격리한다. |
| D-006 | confirmed | Next.js App Router의 Server Component 우선 구조를 사용한다. |
| D-007 | confirmed | 사용자 반응은 사실 신뢰도와 출처 검증 상태를 변경하지 않는다. |
| D-008 | superseded | Source authority는 source에, verification status는 event-source 관계에 저장한다. |
| D-009 | confirmed | 명시적 AI 점수가 없는 legacy Event에는 임의 점수를 만들지 않는다. |
| D-010 | confirmed | 사용자 reaction은 Event별 단일 row에 sentiment와 interested를 분리한다. |
| D-011 | confirmed | 결제, entitlement, 댓글, 컬렉션, 추천, 알림, 커뮤니티는 V1에서 제외한다. |
| D-012 | superseded | Supabase write는 service-role 전용 atomic RPC로 제한한다. |
| D-013 | confirmed | 외부 이미지는 명시적 출처가 있을 때만 사용하고 무단 복제를 하지 않는다. |
| D-014 | confirmed | Opportunity–Event 관계는 명시적 근거 키가 있을 때만 생성한다. |
| D-015 | confirmed | Build-candidate 상태는 Opportunity 전역이 아니라 Briefing occurrence에 저장한다. |
| D-016 | confirmed | Legacy analysis 원문을 항상 보존하고 명확한 label만 구조화한다. |
| D-017 | superseded | 공개 Event route는 내부 `event_key`가 아니라 별도 `slug`를 사용한다. |
| D-018 | confirmed | 공개 콘텐츠 우선이며 로그인은 개인 기능 사용 시에만 안내한다. |
| D-019 | confirmed | V1 로그인 provider는 Google OAuth 하나만 구현한다. |
| D-020 | confirmed | 신규 표시 콘텐츠는 한국어 기본, legacy 영어는 원문 fallback으로 처리한다. |
| D-021 | confirmed | AI 점수는 DB에 유지하되 V1 UI에는 S/A/B 중요도만 표시한다. |
| D-022 | confirmed | 대표 이미지는 검증 가능한 원문/공식 출처만 사용하고 AI 생성 이미지는 금지한다. |
| D-023 | confirmed | Partial Briefing도 비차단 경고와 함께 공개할 수 있다. |
| D-024 | confirmed | News Detail 상단 원문 CTA와 하단 전체 Source 목록을 제공한다. |
| D-025 | confirmed | 미래 기능의 확장 경계만 유지하고 V1 인프라를 선구축하지 않는다. |
| D-026 | confirmed | Event UUID를 영구 identity로 사용하고 Git event_key는 versioned alias로 관리한다. |
| D-027 | confirmed | Source UUID와 URL alias/canonical 이력을 분리하고 불확실한 taxonomy는 unknown으로 보존한다. |
| D-028 | confirmed | Git sync 순서는 commit ancestry와 cursor CAS로 판정한다. |
| D-029 | confirmed | 날짜별 Event·Source·Opportunity occurrence snapshot을 비손실 보존한다. |
| D-030 | confirmed | 운영 content rebuild는 staging reconcile로 사용자 데이터를 보존한다. |
| D-031 | confirmed | Supabase privileged client/function/view 경계를 명시적으로 봉쇄한다. |
| D-032 | confirmed | OAuth return path는 PKCE와 엄격한 same-origin route 검증을 사용한다. |
| D-033 | confirmed | pnpm workspace와 Next.js 16 기준선을 사용한다. |
| D-034 | confirmed | migration 우선 DB 계약과 fail-closed import를 사용한다. |
| D-035 | confirmed | main sync는 전체 archive snapshot reconcile로 실행한다. |
| D-036 | confirmed | Source URL과 taxonomy는 무네트워크·보수적 규칙으로 projection한다. |
| D-037 | confirmed | 새 archive identity는 전체 Git snapshot에서 deterministic하게 발견한다. |

## 상세 결정

### D-001 — GitHub를 콘텐츠 기록 정본으로 유지

- 상태: `confirmed`
- 결정: GitHub `main`의 날짜별 JSON이 유일한 콘텐츠 archive 및 복구 정본이다.
- 근거: 기존 자동화와 사용자의 명시적 요구사항이 Git을 정본으로 정의한다.
- 고려한 대안:
  - Supabase를 새 콘텐츠 정본으로 전환
  - Git과 Supabase를 양방향 동기화
- 이유: 기존 자동화와 이력 보존을 깨지 않고 외부 서비스 장애와 vendor lock-in을 줄인다.
- 영향:
  - 콘텐츠 DB는 Git에서 재구축 가능해야 한다.
  - 웹이나 Supabase에서 Git 콘텐츠를 역으로 덮어쓰지 않는다.
- 재검토 조건: 콘텐츠 편집 workflow 자체를 Git 밖으로 이전하는 별도 제품 결정이 승인될 때

### D-002 — Supabase를 서비스 DB로 사용

- 상태: `confirmed`
- 결정: Supabase는 정규화된 콘텐츠 조회, Auth, reaction, bookmark, follow를 담당한다.
- 근거: 관계형 Event/Source 모델과 로그인 사용자 기능은 정적 Git 파일만으로 효율적으로 제공하기 어렵다.
- 고려한 대안:
  - GitHub raw JSON을 웹에서 직접 조회
  - Vercel KV 또는 별도 managed database
- 이유: PostgreSQL 관계 모델, Auth, RLS를 한 서비스에서 제공하며 V1 규모에 적합하다.
- 영향:
  - 콘텐츠 projection과 사용자 정본의 수명주기를 분리해야 한다.
  - RLS와 server-only credential 관리가 필수다.
- 재검토 조건: 성능, 비용, 리전 또는 운영 요구가 Supabase 범위를 초과할 때

### D-003 — Event 중심 도메인

- 상태: `confirmed`
- 결정: 하나의 사건을 `events`로 표현하고 여러 출처를 `event_sources`로 연결한다.
- 근거: 하나의 AI 사건은 공식 발표, 언론, 논문, GitHub, YouTube, 커뮤니티 반응 등 복수 근거를 가질 수 있다.
- 고려한 대안: Source/article 한 건을 news row 한 건으로 취급
- 이유: 중복 기사를 줄이고 사실·해석·신호·추측을 사건 단위로 통합할 수 있다.
- 영향: Event identity와 Source normalization 규칙이 중요해진다.
- 재검토 조건: 없음. 제품 핵심 원칙으로 유지한다.

### D-004 — Git commit 이후 비동기 sync

- 상태: `confirmed`
- 결정: `data/daily/**`가 변경된 `main` push 후 별도 GitHub Actions workflow가 Supabase를 갱신한다.
- 근거: Supabase 장애가 기존 Git Publisher와 Notion 게시를 막으면 안 된다.
- 고려한 대안:
  - Git Publisher 내부에 Supabase write 추가
  - Vercel Cron으로 Git을 주기적으로 polling
  - Vercel deploy build 중 import
- 이유: commit 이벤트와 처리 대상 SHA가 명확하며 기존 스케줄러와 중복되지 않는다.
- 영향:
  - sync는 eventually consistent다.
  - retry, checksum, run log가 필요하다.
- 재검토 조건: GitHub Actions 실행 비용이나 지연이 서비스 요구를 충족하지 못할 때

### D-005 — Monorepo 내 경계 분리

- 상태: `confirmed`
- 결정: `apps/web`, `packages/importer`, `supabase`를 새 영역으로 사용하고 기존 Python 자동화 경로를 보존한다.
- 근거: 같은 저장소를 사용하면서도 수집, sync, web 책임을 구분해야 한다.
- 고려한 대안:
  - 저장소 root에 Next.js 직접 설치
  - 별도 Web 저장소 생성
- 이유: 기존 root 파일 충돌을 줄이고 Git 정본과 Web 변경을 한 PR에서 검증할 수 있다.
- 영향: root workspace 설정과 별도 Web CI가 필요하다.
- 재검토 조건: 배포 플랫폼이나 팀 운영이 별도 저장소를 요구할 때

### D-006 — Server Component 우선 Web

- 상태: `confirmed`
- 결정: 공개 page는 Next.js App Router Server Component를 기본으로 하고 interaction control만 client로 둔다.
- 근거: 콘텐츠 중심 사이트의 SEO, 초기 응답, client bundle 최소화에 적합하다.
- 고려한 대안:
  - 전체 client-side SPA
  - Pages Router
- 이유: 서버 조회와 cache를 활용하면서 개인화 component를 작게 격리할 수 있다.
- 영향: authenticated dynamic data와 public cache 경계를 명시해야 한다.
- 재검토 조건: 승인된 Next.js 버전의 공식 권고 또는 hosting 제약이 달라질 때

### D-007 — Engagement와 사실 신뢰도 분리

- 상태: `confirmed`
- 결정: 좋아요, 싫어요, 관심, 저장, follow는 추천·개인화에만 사용하며 editorial verification을 변경하지 않는다.
- 근거: 사용자 요구사항
- 고려한 대안: 다수 반응을 source trust score에 반영
- 이유: 인기와 사실성을 혼동하지 않는다.
- 영향: analysis/source verification과 engagement schema 및 mutation 경로를 분리한다.
- 재검토 조건: 없음. 핵심 신뢰 원칙으로 유지한다.

### D-008 — Authority와 verification 분리

- 상태: `superseded` — D-027, D-029로 구체화
- 결정: `sources.authority`는 출처 자체 속성, `event_sources.verification_status`는 특정 Event에 대한 근거 상태로 저장한다.
- 근거: 같은 Source도 사건마다 근거의 역할과 검증 상태가 다를 수 있다.
- 고려한 대안: 두 값을 모두 `sources`에 저장
- 이유: 관계의 문맥을 잃지 않고 Source 중복을 방지한다.
- 영향: Source card query는 event-source join이 필요하다.
- 재검토 조건: verification이 전적으로 Source 전역 평가라는 제품 정책이 승인될 때

### D-009 — Legacy AI 점수는 nullable

- 상태: `confirmed`
- 결정: 현재 Git에 명시적 수치 점수가 없으면 `ai_score = null`로 저장한다. V1 UI에는 점수 또는 미제공 상태를 표시하지 않고 `S/A/B` 중요도만 표시한다.
- 근거: 중요도 S/A/B를 임의 수치로 매핑하면 실제 평가 근거를 왜곡한다.
- 고려한 대안:
  - S/A/B를 고정 점수로 변환
  - Web sync에서 새 모델로 재평가
- 이유: 출처가 없는 정밀도를 만들지 않는다.
- 영향: DB 필드는 유지하지만 V1 public projection과 UI에는 수치 점수나 산정 방식을 노출하지 않고 `S/A/B`만 표시한다.
- 재검토 조건: score 정의, method version과 설명 UX가 안정화되어 공개 여부를 별도로 결정할 때

### D-010 — Event별 단일 reaction row

- 상태: `confirmed`
- 결정: `(user_id, event_id)` 한 row에 nullable `sentiment`와 `interested`를 저장한다.
- 근거: like와 dislike의 동시 선택을 DB 구조로 방지하면서 interested는 독립적으로 지원한다.
- 고려한 대안: reaction type별 여러 row
- 이유: constraint와 toggle mutation이 단순하다.
- 영향: 두 상태가 모두 비면 row를 삭제한다.
- 재검토 조건: 반응 종류가 V1 이후 크게 확장될 때

### D-011 — 미래 기능은 V1에서 제외

- 상태: `confirmed`
- 결정: membership, entitlement, payment, comment, collection, recommendation, notification, community를 V1에서 구현하지 않는다.
- 근거: 사용자 요구사항과 최소 V1 범위
- 고려한 대안: 확장 table과 permission engine 선구축
- 이유: 사용되지 않는 복잡도와 migration 부담을 피한다.
- 영향: Auth identity, domain module, RLS 경계는 확장을 막지 않게 유지하지만 미래 기능용 table, provider, worker 또는 permission engine은 만들지 않는다. 향후 기능은 별도 승인과 migration으로 추가한다.
- 재검토 조건: 해당 기능이 다음 승인 scope에 포함될 때

### D-012 — Service-role 전용 atomic import RPC

- 상태: `superseded` — D-028, D-031로 구체화
- 결정: importer는 일반 Web mutation과 분리된 제한적 RPC로 content projection을 한 transaction 안에서 upsert하고 global advisory lock으로 import를 직렬화한다.
- 근거: 여러 관계 테이블의 부분 성공을 방지해야 한다.
- 고려한 대안:
  - client에서 테이블별 순차 upsert
  - 직접 DB connection 사용
- 이유: transaction 경계와 권한을 DB에 고정하면서 GitHub Actions secret 범위를 제한할 수 있다.
- 영향: SECURITY DEFINER search path, execute grant, input validation을 엄격히 구성해야 한다. Git main revision과 per-path watermark로 같은 날짜 correction의 권위를 정하며, checksum이 과거 내용으로 되돌아와도 watermark는 전진한다. `(date, revision)`이 낮은 correction은 최신 Event current state를 덮어쓰지 않는다.
- 재검토 조건: packet 크기나 RPC 시간 제한이 운영 범위를 초과할 때

### D-013 — 이미지 attribution과 무단 복제 금지

- 상태: `confirmed`
- 결정: 검증 가능한 원문 또는 공식 Source image와 YouTube thumbnail만 사용하고, 권리 확인 없는 외부 이미지를 Storage로 복제하지 않으며 뉴스 대표 이미지에 AI 생성 이미지를 사용하지 않는다.
- 근거: V1은 text-first이며 대표 이미지는 보조 요소다.
- 고려한 대안: 모든 Source의 Open Graph image 자동 복제
- 이유: 저작권, 저장 비용, broken image와 hotlink 위험을 줄인다.
- 영향: image URL, 연결 Source, attribution을 추적하고 이미지 없는 Event를 위한 일관된 text-first fallback이 필요하다.
- 재검토 조건: 별도의 이미지 라이선스와 저장 정책이 승인될 때

### D-014 — Opportunity–Event 관계는 명시적 근거만 사용

- 상태: `confirmed`
- 결정: supporting event key가 없으면 Opportunity를 Daily Briefing에만 연결하고 Event 관계는 생성하지 않는다.
- 근거: 현재 `business_ideas[]`에는 근거 Event ID가 없다.
- 고려한 대안: 제목·태그 유사도로 자동 연결
- 이유: 잘못된 근거 관계를 사실처럼 표시하지 않는다.
- 영향: legacy Opportunity의 관련 Event 섹션은 비어 있을 수 있다.
- 재검토 조건: Git contract에 supporting event key가 추가될 때

### D-015 — Build-candidate는 Briefing occurrence 상태

- 상태: `confirmed`
- 결정: candidate status와 owner-action flag를 `opportunities`가 아니라 `daily_briefing_opportunities`에 저장한다.
- 근거: Git `build_candidate`는 특정 날짜 packet의 판단이며 같은 아이디어가 다른 날짜에 다시 평가될 수 있다.
- 고려한 대안: Opportunity 전역 상태를 마지막 import 값으로 덮어쓰기
- 이유: 과거 후보 기록과 현재 후보 판단을 모두 보존하고 candidate → non-candidate 전환의 문맥을 잃지 않는다.
- 영향: Opportunity 목록은 최신 occurrence 또는 날짜별 occurrence를 명시해 후보 상태를 조회해야 한다.
- 재검토 조건: 별도의 장기 Opportunity lifecycle이 제품 범위로 승인될 때

### D-016 — Legacy analysis 비손실 보존

- 상태: `confirmed`
- 결정: Git `news[].summary`를 `summary_raw`에 항상 저장하고, 명확한 label만 구조 필드로 파싱한다.
- 근거: 현재 schema와 validator는 FACT label이 없는 자유 text도 유효하게 허용한다.
- 고려한 대안: summary를 반드시 네 label로 파싱하거나 전체 문장을 FACT로 저장
- 이유: 유효한 legacy packet을 거부하거나 해석을 사실로 승격하지 않으면서 원문을 보존한다.
- 영향: UI에 `원문 분석` fallback과 parse status가 필요하다.
- 재검토 조건: Git schema가 구조화된 analysis 필드를 필수로 강제할 때

### D-017 — Public route는 slug 사용

- 상태: `superseded` — D-026으로 identity 정의를 교체하되 slug 사용 결정은 유지
- 결정: Event 내부 identity는 `event_key`, 공개 URL은 `/events/[slug]`를 사용한다.
- 근거: event key의 장기 형식과 URL 안전성이 아직 계약으로 확정되지 않았다.
- 고려한 대안: `/events/[eventKey]` 직접 사용
- 이유: 데이터 identity와 사용자-facing URL을 분리하고 내부 key 형식 변경이 public URL에 직접 영향을 주지 않게 한다.
- 영향: slug는 최초 생성 후 immutable로 유지한다. 변경이 필요해지는 시점에만 별도 redirect 정책을 설계한다.
- 재검토 조건: event key가 영구적이고 URL-safe한 공개 식별자로 확정될 때

### D-018 — 공개 콘텐츠 우선, 선택 로그인

- 상태: `confirmed`
- 결정: 사이트 최초 진입과 공개 route에 로그인 gate를 두지 않고 개인 기능을 직접 요청할 때만 로그인 안내를 표시한다.
- 근거: 2026-08-07 사용자 제품/UX 승인
- 고려한 대안: 최초 로그인 redirect, 자동 modal, full-screen gate
- 이유: 공개 Intelligence 탐색을 기본 가치로 유지한다.
- 영향: 로그인 CTA는 작은 보조 요소이며 OAuth 후 검증된 return path로 원래 페이지와 맥락을 복원한다.
- 재검토 조건: 유료 전용 콘텐츠가 별도 scope로 승인될 때

### D-019 — V1은 Google OAuth만 사용

- 상태: `confirmed`
- 결정: V1 Supabase Auth provider는 Google OAuth 하나만 구현한다.
- 근거: 2026-08-07 사용자 제품/UX 승인
- 고려한 대안: email magic link, 다중 OAuth provider
- 이유: 초기 로그인 선택지와 운영 복잡도를 최소화한다.
- 영향: Profile은 provider 고유 ID가 아니라 `auth.users.id`에 결합해 향후 provider 추가를 허용한다.
- 재검토 조건: 다른 provider 요구가 확인될 때

### D-020 — 한국어 기본과 legacy 원문 fallback

- 상태: `confirmed`
- 결정: 신규 사용자 표시 콘텐츠는 한국어를 기본으로 하고 고유명사는 필요시 원문을 유지한다. 기존 영어 archive는 일괄 번역하지 않는다.
- 근거: 2026-08-07 사용자 제품/UX 승인
- 고려한 대안: legacy 전체 자동 번역, 영어 콘텐츠 비공개
- 이유: 향후 한국어 경험을 개선하면서 기존 정본을 임의 변환하지 않는다.
- 영향: 한국어가 없는 legacy Event는 title과 summary 원문을 fallback으로 표시한다.
- 재검토 조건: 별도 번역 backfill 프로젝트가 승인될 때

### D-021 — AI 점수는 저장하되 V1 비공개

- 상태: `confirmed`
- 결정: DB의 nullable AI score 구조는 유지하지만 V1 UI는 `S/A/B` 중요도만 표시한다.
- 근거: 평가 체계와 산정 방식이 아직 공개 수준으로 안정화되지 않았다.
- 고려한 대안: 현재 점수 공개, 중요도에서 수치 점수 파생
- 이유: 불완전한 정밀도나 설명 없는 점수를 사용자에게 노출하지 않는다.
- 영향: public query projection에서 score를 제외하고 공개 여부는 별도 결정으로 재검토한다.
- 재검토 조건: score 정의, method version, 설명 UX가 안정화될 때

### D-022 — 검증 가능한 대표 이미지와 AI 이미지 금지

- 상태: `confirmed`
- 결정: 검증 가능한 원문 또는 공식 출처 이미지에 한해 대표 이미지로 사용하고 Source와 attribution을 추적한다. AI 생성 이미지는 사용하지 않는다.
- 근거: 2026-08-07 사용자 제품/UX 승인
- 고려한 대안: Open Graph image 무조건 사용, AI fallback image 생성
- 이유: 신뢰성과 출처 투명성을 유지하고 이미지가 사실 콘텐츠를 오도하지 않게 한다.
- 영향: 이미지가 없는 Event는 이미지 영역 없이 정상 렌더링하며 text-first layout을 유지한다.
- 재검토 조건: 별도 이미지 라이선스·asset 정책이 승인될 때

### D-023 — Partial Briefing 공개 허용

- 상태: `confirmed`
- 결정: `partial` Briefing도 published 상태가 될 수 있으며 수집·검증 미완료 사실과 warnings를 비차단 방식으로 표시한다.
- 근거: 2026-08-07 사용자 제품/UX 승인
- 고려한 대안: complete만 공개, partial은 full-screen 경고
- 이유: 가용한 정보를 제공하면서 한계를 투명하게 전달한다.
- 영향: Today 상태 badge/callout과 warning 접근 경로가 필요하며 콘텐츠를 가리는 modal은 사용하지 않는다.
- 재검토 조건: partial 품질이 사용자 신뢰에 반복적으로 문제를 일으킬 때

### D-024 — 원문 CTA와 전체 Source 목록

- 상태: `confirmed`
- 결정: News Detail 상단에 대표 원본 `원문 보기` CTA를 두고 하단에 연결된 모든 Source를 표시한다.
- 근거: 2026-08-07 사용자 제품/UX 승인
- 고려한 대안: 원문 링크를 하단에만 배치, 대표 Source만 노출
- 이유: 사용자가 분석 근거를 빠르게 검증하고 출처 다양성을 확인할 수 있게 한다.
- 영향: authority와 verification을 text badge로 구분하고 YouTube는 가능한 경우 thumbnail card로 표시한다.
- 재검토 조건: Source 수가 많아 별도 정렬·접기 UX가 필요할 때

### D-025 — 미래 확장 가능하되 선구축 금지

- 상태: `confirmed`
- 결정: membership, entitlement, payment, comment, collection, recommendation, notification, community를 추가할 수 있는 경계는 유지하되 V1에서 관련 인프라를 구현하지 않는다.
- 근거: 2026-08-07 사용자 제품/UX 승인
- 고려한 대안: 미래 table과 entitlement engine 사전 구축
- 이유: 과설계를 피하고 실제 요구가 생길 때 최소 migration으로 추가한다.
- 영향: V1 domain/auth/RLS interface는 확장을 막지 않지만 미래 기능 코드는 존재하지 않는다.
- 재검토 조건: 후속 기능이 승인 scope에 포함될 때

### D-026 — UUID 기반 Event identity와 Git alias registry

- 상태: `confirmed`
- 결정: `events.id` UUID를 영구 identity로 사용하고 Git `event_key`는 `event_keys`와 Git main의 versioned identity registry를 통해 resolve한다. key 변경·merge는 명시적 registry만 허용하고 충돌은 quarantine한다.
- 근거: 현재 daily schema는 `event_key`의 불변성이나 전역 유일성을 보장하지 않으며 실제 key에 날짜가 포함될 수 있다.
- 고려한 대안: event_key 단독 UNIQUE, 제목/Source 유사도 자동 merge
- 이유: 후속 보강, key 변경과 충돌을 복구 가능하게 만들고 오병합을 막는다.
- 영향: production bootstrap 전에 immutable `event_uid`를 가진 registry를 Git에 고정하며 slug와 사용자 FK는 key 변경에도 유지된다.
- 재검토 조건: upstream Git schema가 영구 UUID를 직접 발급할 때

### D-027 — Source UUID, URL 이력과 보수적 taxonomy

- 상태: `confirmed`
- 결정: Source UUID와 `source_urls`를 분리하고 raw/normalized/canonical/alternate/redirect URL 이력을 보존한다. 불확실한 매핑은 `other`/`unknown`/`unverified`로 둔다.
- 근거: tracking, redirect, YouTube, X, GitHub와 canonical URL은 단일 generic normalization으로 안전하게 식별할 수 없다.
- 고려한 대안: normalized URL 하나를 Source PK로 사용
- 이유: 중복과 오병합을 모두 줄이고 매핑 근거와 rule version을 감사할 수 있게 한다.
- 영향: provider별 fixture, SSRF-safe redirect 정책과 Git alias registry가 importer acceptance criteria가 된다.
- 재검토 조건: upstream이 provider ID와 taxonomy를 구조화해 제공할 때

### D-028 — Commit ancestry와 cursor CAS 기반 sync 순서

- 상태: `confirmed`
- 결정: `git rev-list --count`는 진단값으로만 사용하고 stored cursor SHA와 incoming SHA의 ancestry 및 RPC의 `expected_cursor_sha` CAS로 correction 순서를 결정한다.
- 근거: GitHub Actions와 advisory lock은 실행 도착 순서를 보장하지 않고 commit count는 history rewrite에서 권위가 될 수 없다.
- 고려한 대안: workflow concurrency FIFO, 숫자 revision 단독 비교
- 이유: 동일 날짜 재실행, 역순, A→B→A, 과거 correction과 force-push divergence를 명시적으로 판정한다.
- 영향: shallow/diverged history는 자동 적용하지 않고 retry 또는 reconcile failure로 중단한다. Identity-only 변경도 sync를 trigger하며 packet, identity registry, mapper version을 합친 projection checksum이 달라지면 재투영한다.
- 재검토 조건: Git 외부의 신뢰 가능한 monotonic sequence가 도입될 때

### D-029 — 날짜별 occurrence snapshot 보존

- 상태: `confirmed`
- 결정: Briefing×Event에 표시 snapshot과 Analysis를, Briefing×Event×Source에 verification/대표/순서/인용문을, Briefing×Opportunity에 당시 평가 snapshot을 저장한다.
- 근거: 전역 current row만 갱신하면 동일 Event의 과거 날짜 문맥이 손실된다.
- 고려한 대안: Event, event_sources, opportunities의 최신 row만 유지
- 이유: 후속 보강과 correction이 다른 날짜 기록을 덮어쓰지 않게 한다.
- 영향: Today는 occurrence snapshot, 최신 Event Detail은 current projection, 과거 Briefing은 해당 occurrence를 조회한다.
- 재검토 조건: 완전한 event-sourcing model이 별도 승인될 때

### D-030 — 사용자 데이터 보존형 content rebuild

- 상태: `confirmed`
- 결정: 신규 빈 DB rebuild와 운영 DB rebuild를 분리한다. 운영 DB는 staging backfill 후 stable UUID reconcile/upsert하며 content table을 truncate하지 않는다.
- 근거: reaction/bookmark의 Event FK 때문에 content truncate는 사용자 데이터 보존 요구와 충돌한다.
- 고려한 대안: production content truncate 후 backfill
- 이유: 사용자 정본과 연결을 유지하면서 Git projection만 재구축한다.
- 영향: Git은 콘텐츠만 복구하며 Auth/사용자 재난 복구는 Supabase backup/PITR가 담당한다.
- 재검토 조건: 사용자 데이터를 포함한 별도 export/import 체계가 승인될 때

### D-031 — Supabase privileged boundary 강화

- 상태: `confirmed`
- 결정: service-role importer를 SSR session client와 분리하고 service-role 전용 public RPC façade의 `PUBLIC`/`anon`/`authenticated` 실행을 revoke한다. 운영 table은 private schema에 두고 모든 공개 object는 RLS+GRANT, view는 security-invoker 원칙을 따른다.
- 근거: service-role은 RLS를 우회하고 definer function/view는 잘못 노출되면 RLS 우회 경로가 된다.
- 고려한 대안: service client 공유, public function의 policy 의존
- 이유: credential 노출과 권한 상승 경로를 구조적으로 줄인다.
- 영향: 역할별 DB test, client bundle secret scan과 account deletion cascade test가 필수다.
- 재검토 조건: 별도 backend worker와 DB role model을 도입할 때

### D-032 — OAuth PKCE와 엄격한 return path 검증

- 상태: `confirmed`
- 결정: Google OAuth callback은 Supabase가 관리하는 PKCE state/code verifier와 exact production callback allowlist를 사용한다. 애플리케이션 `next`는 권한이나 mutation을 담지 않는 same-origin 상대 경로로 제한하고 callback에서 다시 검증한다.
- 근거: 선택 로그인 UX를 유지하면서 open redirect와 action replay를 막아야 한다.
- 고려한 대안: 임의 relative `next`, 별도 애플리케이션 서명 state/cookie, client storage만으로 복귀 상태 관리
- 이유: 외부 URL, protocol-relative, backslash와 encoding 우회를 일관되게 거부한다.
- 영향: 실패 시 `/`로 안전하게 복귀하고 OAuth 전 mutation은 자동 실행하지 않는다.
- 재검토 조건: 추가 provider 또는 native app callback이 승인될 때

### D-044 — Event Detail의 날짜·merge·Source 이력 조회 규칙

- 상태: `confirmed`
- 결정: Event Detail은 `daily_briefings.date_kst DESC`를 우선하고 같은 날짜에서만 accepted `source_revision DESC`를 tie-breaker로 사용한다. 검토된 merge Event route는 canonical target으로 permanent redirect하며, Source는 Event 전체 occurrence를 합쳐 Source별 최신 날짜의 verification을 표시한다.
- 근거: 과거 날짜 correction, merge 전 bookmark, 여러 날짜에 걸친 Source 보강이 Event 중심 상세의 최신 의미와 근거 접근성을 훼손하면 안 된다.
- 고려한 대안: 전역 revision 정렬, merge row 직접 렌더링, 선택 Briefing Source만 표시
- 이유: 날짜별 Analysis를 보존하면서 최신 표시와 전체 근거를 결정적으로 유지한다.
- 영향: Today는 Briefing 범위 Source를 유지하고 Event Detail만 누적 Source를 조회한다. 다중 날짜·과거 correction·merge 회귀 테스트를 유지한다.
- 재검토 조건: Source verification history 자체를 사용자에게 시계열로 공개할 때

### D-033 — pnpm workspace와 Next.js 16 기준선

- 상태: `confirmed`
- 결정: 기존 archive 저장소 루트에 pnpm workspace를 두고 Web 앱은 `apps/web`에 격리한다. 구현 기준선은 Next.js 16.3, React 19, TypeScript, Tailwind CSS 4이며 Next.js 16의 `proxy.ts` 및 Server Component 보안 모델을 따른다.
- 근거: 기존 Git 정본 경로를 이동하지 않으면서 Web/동기화 코드를 독립적으로 빌드하고 Vercel root directory를 명시할 수 있어야 한다.
- dependency 이유: Next.js/React는 승인된 Web runtime, TypeScript는 승인된 언어, Tailwind CSS는 승인된 styling layer, ESLint는 정적 품질 gate다. pnpm은 단일 lockfile과 workspace별 명령을 제공한다.
- 고려한 대안: 저장소 루트에 Next.js 생성, npm workspace, 별도 저장소
- 이유: `apps/web` 경계가 기존 자동화와 경로 충돌 위험을 가장 작게 유지한다.
- 영향: root script는 앱별 script를 filter하고 native build 허용 목록은 `sharp`, `unrs-resolver`로 제한한다.
- 재검토 조건: Vercel 또는 운영 환경이 pnpm/Next.js 16을 지원하지 않을 때

### D-034 — migration 우선 DB 계약과 fail-closed import

- 상태: `confirmed`
- 결정: 공개 content projection과 사용자 table/RLS를 SQL migration으로 관리하고, Git packet write는 service-role 전용 원자적 RPC만 허용한다. identity 누락·충돌, cursor CAS 불일치, 지원하지 않는 packet은 projection을 부분 변경하지 않고 실패시킨다.
- 근거: Git main 정본의 재현성과 사용자 데이터 격리를 코드 관례가 아닌 DB constraint와 권한 경계로 보장해야 한다.
- 고려한 대안: importer가 public table을 순차 직접 upsert, 클라이언트가 service-role 사용
- 이유: transaction 중간 실패와 credential/RLS 우회 노출면을 줄인다.
- 영향: 실제 Supabase 적용 전 정적 계약 테스트를 사용한다. service-role은 public table 직접 write 권한을 받지 않으며 RPC는 PostgREST JWT claim 또는 직접 세션 role을 검증한다. identity registry checksum은 import transaction에서 재확인하고 Event merge는 단일 단계 target만 허용해 기존 row를 redirect 상태로 reconcile한다. 로컬/preview DB가 준비되면 migration·RLS·cascade 통합 테스트를 추가 통과해야 한다.
- 재검토 조건: 별도 trusted backend role 또는 queue worker가 도입될 때

### D-035 — main sync는 전체 snapshot reconcile

- 상태: `confirmed`
- 결정: main push의 write workflow는 고정된 commit에서 전체 `data/daily/**`를 backfill/reconcile한다. GitHub Actions concurrency가 이전 pending run을 대체해도 최신 main snapshot 하나가 누락된 중간 변경을 포함한다.
- 근거: GitHub Actions concurrency는 실행 중 job을 유지하더라도 pending run의 FIFO를 보장하지 않는다.
- 고려한 대안: 마지막 commit의 changed path만 incremental sync, workflow queue 순서 신뢰
- 이유: daily archive 규모에서 전체 scan 비용은 작고 correction·identity·mapper 변경과 실행 누락을 같은 경로로 복구한다.
- 영향: full-history checkout, commit ancestry 검증, registry 2-field CAS, packet cursor CAS와 projection checksum no-op을 함께 사용한다. manual dry-run에는 secret을 주입하지 않는다.
- 재검토 조건: archive 규모로 매 실행 전체 scan이 운영 한도를 넘을 때

### D-036 — 무네트워크 URL 정규화와 보수적 taxonomy

- 상태: `confirmed`
- 결정: importer는 URL fetch나 redirect 추적 없이 generic tracking parameter와 YouTube/X/GitHub의 명확한 provider 형식만 정규화한다. taxonomy 근거가 부족하면 `other/unknown/unknown/unverified`를 유지한다.
- 근거: 자동 redirect 추적은 SSRF와 identity 오병합 위험을 만들고 legacy packet에는 authority/verification의 충분한 근거가 없다.
- 고려한 대안: 모든 redirect 자동 추적, publisher 이름 기반 official 추정, 모든 URL generic canonicalization
- 이유: 원문 접근성을 유지하면서 잘못된 사실 신뢰도 표시와 Source 합병을 방지한다.
- 영향: raw URL을 별도 보존하고 YouTube thumbnail은 검증 가능한 video ID에서만 파생한다. Domain rule은 Source의 성격만 분류하며 Event별 verification은 자동 승격하지 않는다. GitHub URL만으로 repository owner를 알 수 없으므로 authority는 unknown이다. 추가 provider/domain mapping은 fixture와 review를 거쳐 rule version으로 도입한다.
- 재검토 조건: 안전한 redirect resolver 또는 검토된 taxonomy registry가 승인될 때

### D-037 — 전체 archive 기반 deterministic identity discovery

- 상태: `confirmed`
- 결정: importer는 매 sync마다 고정된 Git snapshot의 전체 daily archive를 읽어 explicit identity registry에 없는 Event key와 normalized Source URL을 UUIDv5로 deterministic하게 추가한 effective registry를 만든다. explicit alias/merge가 항상 우선한다.
- 근거: 기존 AI Researcher와 Git Publisher는 `data/identity/**`를 갱신하지 않으며 그 동작은 변경할 수 없다. explicit registry만 요구하면 다음 daily packet부터 Web projection이 중단된다.
- 고려한 대안: 기존 Publisher가 registry를 commit, workflow가 Git에 자동 commit, 신규 identity마다 운영자 승인
- 이유: 기존 자동화를 수정하거나 workflow write 권한을 주지 않고도 Git archive만으로 빈 DB의 동일 UUID를 재구축한다.
- 영향: namespace, normalization version과 semantic effective identity가 checksum/CAS 입력이다. `generated_from_commit` 같은 provenance는 별도 watermark로 저장해 내용 checksum에서 제외한다. Key rename·merge는 추측하지 않으며 별도 explicit registry correction으로 같은 UUID에 연결한다.
- 재검토 조건: upstream daily schema가 immutable Event/Source UUID를 직접 발급할 때

### D-045 — Preview 검증은 격리 프로젝트와 원격 작업 브랜치 watermark를 사용

- 상태: `confirmed`
- 결정: Preview 통합 검증은 별도 Free 프로젝트 `ai-daily-intelligence-preview`에서만 수행한다. importer와 identity registry가 아직 main에 없으므로 원격 `agent/web-v1` commit `c53899930ce086579ad85b407ec6d7a8eab3fde5`를 Preview 전용 watermark로 사용한다.
- 근거: 해당 commit의 `data/daily/**`는 `origin/main`과 동일하지만 V1 importer와 `data/identity/**`를 함께 재현할 수 있다.
- 안전 경계: 이 선택은 Preview bootstrap 검증에만 적용한다. main merge 방식으로 commit identity가 달라지면 Production 전에 새 authoritative main SHA에서 content projection을 rebuild/reconcile한다.
- credential: 검증용 secret은 일시 생성하고 importer 및 멱등성 검증 후 삭제한다. 장기 sync credential은 GitHub Preview environment에 사용자가 별도로 설정한다.
- 영향: Production Supabase, Vercel, main에는 변경이 없으며 Preview 결과를 Production watermark로 승격하지 않는다.

### D-046 — service-role도 직접 테이블 접근 없이 atomic import RPC만 사용

- 상태: `confirmed`
- 결정: public schema의 table 및 default table privilege를 `service_role`에서도 revoke한다. content importer에는 `apply_identity_registry`와 `import_daily_packet` RPC execute만 허용한다.
- 근거: service-role이 개인 또는 content table을 직접 변경할 수 있으면 atomic CAS, identity 검증과 사용자 데이터 격리 경계를 우회할 수 있다.
- 검증: Preview의 schema contract와 역할 기반 RLS/cascade 통합 테스트에서 직접 개인 테이블 write privilege 부재를 확인했다.
- 영향: importer 변경은 항상 RPC 계약과 migration을 함께 갱신해야 하며 일반 Supabase service client로 public table을 직접 쓰는 구현은 금지한다.

### D-047 — 최초 Vercel 검증은 Git 자동 연결 없는 Preview 전용 프로젝트로 수행

- 상태: `confirmed`
- 결정: Vercel Hobby의 별도 프로젝트 `ai-daily-intelligence-preview`를 만들고 Root Directory를 `apps/web`로 지정한다. 최초 검증은 로컬 `agent/web-v1` 체크아웃을 `preview` target으로만 배포하며 Git 자동 배포와 Production 승격은 연결하지 않는다.
- 근거: Git 저장소 연결 과정에서 `main`의 첫 배포가 Production으로 생성되는 위험을 피하면서, 승인된 작업 브랜치와 Preview Supabase 조합을 먼저 검증해야 한다.
- 고려한 대안: GitHub 저장소를 즉시 연결해 `main`을 Production branch로 사용, 기존 Vercel 프로젝트에 병합, Preview를 Production domain으로 승격
- 이유: Preview와 Production의 변경 경계를 명시적으로 유지하고 사용자의 별도 승인 전에는 main 및 Production 상태에 영향을 주지 않는다.
- 영향: Preview 환경 변수는 Vercel의 `preview` target에만 저장한다. 후속 자동 배포가 필요하면 main merge·Production 배포와 분리된 Git integration 정책을 별도로 승인받아 설정한다.
- 재검토 조건: Preview 검증 완료 후 사용자가 Git 자동 배포 또는 Production 승격을 승인할 때

### D-048 — 원문 상세 V1은 기존 검증 필드의 presentation projection으로 제공

- 날짜: 2026-08-14
- 상태: `confirmed`
- 결정: `원문 기반 상세 내용`은 현재 `one_line_summary`와 정규화된 FACT만 사용해 `detailed_summary` presentation DTO로 구성한다. 외부 기사 전문이나 전체 번역을 저장하지 않고 근거 데이터가 없으면 `unavailable`로 표시한다. 이번 변경에서는 DB migration을 추가하지 않는다.
- 근거: 기존 Git archive와 Supabase projection에는 권리 상태가 확인된 전문/번역 필드가 없지만 사건 개요와 확인된 사실은 이미 분리 가능한 형태로 존재한다.
- 고려한 대안: UI에서 AI로 즉석 번역·확장, 빈 DB column 선추가, 외부 기사 전문 저장
- 이유: 내용을 만들어내거나 저작권 상태를 추정하지 않으면서 승인 목업의 읽기 흐름을 제공하고 V1 과설계를 피한다.
- 영향: legacy 영어는 원문 fallback으로 표시된다. 향후 upstream이 content mode, rights status, localized content와 provenance를 제공하는 계약이 승인되면 persistent model을 재검토한다.
- 재검토 조건: AI Researcher 출력 계약에 검증된 상세 콘텐츠와 권리 metadata가 추가될 때

### D-049 — legacy 분석 정규화는 명시적으로 확인된 누적 형식에만 적용

- 날짜: 2026-08-14
- 상태: `confirmed`
- 결정: presentation 단계의 분석 정규화는 FACT field가 `FACT:`로 시작하고 FACT → INTERPRETATION → SIGNAL → SPECULATION label이 각각 정확히 한 번 canonical 순서로 존재할 때만 수행한다. fact 외 기존 structured field는 누적 FACT에서 계산한 canonical suffix와 전체 문자열이 정확히 일치할 때만 정리하고, 그 밖의 값은 보존한다.
- 근거: label substring만으로 legacy row를 추정하면 정상 분석 문장이나 더 최신인 structured field를 오래된 누적 문자열로 덮을 수 있다.
- 고려한 대안: 두 개 이상의 label만 발견하면 모든 field 덮어쓰기, DB correction migration, 정규화 제거
- 이유: 현재 확인된 legacy 표시 결함은 고치면서 Supabase 정본과 Git fallback의 정상 구조화 값을 presentation layer가 훼손하지 않게 한다.
- 영향: partial·out-of-order·repeated label과 label을 언급하는 일반 문장은 자동 수정하지 않는다. 해당 데이터는 upstream correction 대상이며 UI가 임의로 재해석하지 않는다.
- 재검토 조건: importer가 누적형 analysis를 더 이상 생성하지 않으며 archive correction이 완료될 때

## 미결정 사항

다음 항목은 아직 결정되지 않았다.

1. Source taxonomy registry의 최초 confirmed domain/provider 목록
2. Supabase/Vercel 리전, backup/PITR와 비용 한도
3. Google OAuth consent screen, 허용 계정 범위와 개인정보 처리 고지

새 결정을 추가할 때는 날짜, 상태, 근거, 대안, 이유, 영향과 재검토 조건을 포함한다. 기존 결정을 수정할 때는 원문을 삭제하지 않고 상태를 `superseded`로 변경한 뒤 새 Decision ID를 추가한다.
