# AI Daily Intelligence Web V1 Architecture

## 구현 반영: 공개 Web read path (2026-08-08)

## 구현 반영: Auth와 개인 기능 (2026-08-08)

공개 route는 Proxy 인증 gate를 두지 않는다. Header의 작은 로그인 진입점과 개인 기능 클릭만 `/login`으로 연결된다. Google OAuth callback은 Supabase PKCE code를 server route에서 교환하고 검증된 same-origin 상대 경로로 복귀한다.

reaction, bookmark, follow는 browser session client와 RLS를 사용한다. Saved는 server-only 사용자 DAL이 `auth.getUser()`로 사용자 identity를 확인한 뒤 본인 row만 조회한다. UI 숨김이나 로그인 상태 표시는 보안 경계가 아니며 DB RLS가 최종 권한 경계다.

Trends는 최신 공개 Briefing 날짜를 기준으로 7/30일 occurrence를 집계한다. 기간 전·후반의 Topic/Entity 등장 횟수 차이를 방향 신호로 표시하며, 중요도나 검증 점수로 해석하지 않는다.

공개 페이지는 `Server Component → server-only content DAL → Supabase public RLS projection` 경로를 사용한다. DAL은 화면 전용 최소 DTO를 반환하며 service-role credential을 참조하지 않는다. 자격 증명이 없는 개발·CI에서는 Git daily archive adapter가 같은 DTO를 생성해 Today/Event Detail build와 archive 복구 가능성을 검증한다.

`CONTENT_SOURCE=supabase`는 Supabase URL과 publishable/anon key가 모두 있을 때만 동작한다. 설정 쌍이 불완전하면 자동 fallback하지 않고 오류로 중단한다. archive mode는 preview/build fallback이고 운영의 조회 대상은 Supabase projection이다.

Today와 Event Detail은 text-first Server Component로 구현한다. 이미지가 없으면 이미지 영역을 렌더링하지 않는다. YouTube는 검증 가능한 video ID가 있는 Source에 한해 원본 thumbnail card를 표시한다.

> 상태: V1 코드 구현 및 로컬 release gate 완료 — 운영 외부 설정 대기
> 작성일: 2026-08-07 (Asia/Seoul)
> 관련 문서: [CURRENT_ARCHITECTURE.md](CURRENT_ARCHITECTURE.md), [DB_SCHEMA.md](DB_SCHEMA.md), [DECISIONS.md](DECISIONS.md), [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md)

## 1. 목적과 설계 원칙

AI Daily Intelligence Web V1은 AI 관련 정보를 매일 읽기 좋은 한국어 Intelligence 웹사이트로 제공한다. 기존 AI Researcher가 생성한 Git 일일 JSON은 원본 archive 및 복구용 정본으로 유지하고, Supabase는 웹 조회와 사용자 기능을 위한 서비스 DB로 사용한다.

핵심 원칙은 다음과 같다.

1. GitHub `main`의 `data/daily/**`가 콘텐츠 기록 정본이다.
2. Supabase 콘텐츠 데이터는 Git에서 재구축할 수 있는 projection이다.
3. 사용자 계정과 반응 데이터는 Supabase가 정본이며 Git JSON에 기록하지 않는다.
4. 기존 AI Researcher → Opportunity Finder → Git Publisher → Notion 흐름을 변경하거나 웹서비스에 종속시키지 않는다.
5. Event를 핵심 콘텐츠 단위로 사용하고 하나의 Event에 여러 Source를 연결한다.
6. 사용자 반응은 추천·관심도에만 사용할 수 있고 사실 신뢰도나 검증 상태를 변경하지 않는다.
7. V1에 필요하지 않은 결제, entitlement, 댓글, 커뮤니티 인프라는 미리 구현하지 않는다.
8. 공개 콘텐츠는 로그인 없이 즉시 열람할 수 있고 로그인은 개인 기능을 위한 선택 사항이다.
9. 사용자 표시용 신규 콘텐츠는 한국어를 기본으로 하되 고유명사는 필요한 경우 원문을 유지한다.

## 2. 기술 스택

| 영역 | 기술 | 역할 |
|---|---|---|
| Web | Next.js App Router, TypeScript | SSR, Server Components, Route Handlers, metadata |
| UI | Tailwind CSS, shadcn/ui | 반응형 레이아웃과 접근 가능한 UI primitive |
| Database | Supabase PostgreSQL | Event 중심 조회 모델과 사용자 데이터 |
| Authentication | Supabase Auth + Google OAuth | V1의 유일한 로그인 provider, 세션, 사용자 식별 |
| Authorization | PostgreSQL RLS | 공개 읽기와 사용자별 쓰기 격리 |
| Hosting | Vercel | Next.js 배포, 캐시, 관측 로그 |
| Sync | GitHub Actions + TypeScript importer | Git JSON 검증 및 Supabase upsert |
| Canonical archive | GitHub `main` | 일일 JSON과 보고서 영구 기록 |

구체적인 패키지 버전과 Supabase/Vercel 리전은 구현 시작 시 공식 지원 범위와 비용을 확인한 뒤 lockfile 및 결정 기록에 고정한다.

## 3. 시스템 경계와 데이터 흐름

```text
기존 수집 시스템
AI Researcher
  → Opportunity Finder
  → Git Publisher
  → GitHub main / data/daily/YYYY/YYYY-MM-DD.json
  → 기존 reports/latest/Notion 게시
                    │
                    │ main push 이후 비동기 실행
                    ▼
Web Sync Pipeline
GitHub Actions
  → 기존 Python validator
  → Web runtime validator
  → Git packet → Event model 변환
  → Supabase atomic upsert
  → import 결과 검증 및 기록
  → Next.js cache revalidation
                    │
                    ▼
서비스 계층
Supabase PostgreSQL + Auth + RLS
                    │
                    ▼
소비 계층
Next.js Web on Vercel
```

### 수집 시스템

- 기존 자동화가 소유한다.
- Git commit까지가 성공 경계다.
- 웹 DB, Vercel, Auth 또는 사용자 기능을 알 필요가 없다.

### 동기화 시스템

- `main`에 반영된 정본만 읽는다.
- 정본을 수정하지 않는다.
- 같은 입력을 반복 처리해도 같은 결과가 나오는 멱등 upsert를 수행한다.
- Supabase 실패는 별도 실패로 기록하며 기존 Git/Notion 결과를 취소하지 않는다.

### 서비스 DB

- 콘텐츠 projection: Event, Source, Topic, Entity, Opportunity, Briefing, Resource, Trend Signal
- 사용자 정본: Profile, Reaction, Bookmark, Follow
- import 실행 상태와 오류 기록

### 웹 애플리케이션

- 공개 콘텐츠는 Server Component에서 조회한다.
- 사용자별 상태와 mutation은 인증 세션과 RLS를 통과한다.
- service-role credential을 브라우저로 전달하지 않는다.

## 4. V1 페이지 구조

### 전역 내비게이션

```text
Today | Opportunities | Trends | Saved
```

- 데스크톱: 상단 내비게이션
- 모바일: 압축된 상단 헤더와 주요 메뉴 하단 내비게이션
- 본문 최대 폭과 긴 문장 행 길이를 제한하여 정보 밀도와 가독성을 함께 유지한다.
- 데스크톱에서는 헤더 우측 또는 사이드 영역에 작은 `로그인` 버튼/배너를 둔다.
- 모바일에서는 헤더 또는 메뉴 영역에 로그인 진입점을 둔다.
- 로그인하지 않은 사용자의 탐색과 콘텐츠 열람을 가리는 modal, popup, full-screen gate를 최초 진입 시 표시하지 않는다.

### Today — `/`

Newsio 스타일의 정보 중심 홈이다.

구성 순서:

1. KST 기준 날짜, 데이터 상태, Today's Insight
2. 오늘의 핵심 Event 3~5개
3. Opportunity Radar
4. Trending Signals
5. Tools / Open Source / Papers

데스크톱은 핵심 Event를 주 열에, Opportunity와 Trend를 보조 열에 배치한다. 모바일은 위 순서로 한 열에 쌓는다. 이미지는 검증된 이미지가 있을 때만 제한적으로 사용하고, 이미지가 없어도 정보 구조가 유지되어야 한다.

`partial` Briefing도 공개할 수 있다. 이 경우 날짜와 상태 영역에 작은 `일부 수집·검증 진행 중` badge 또는 callout을 표시하고 `warnings`를 확인할 수 있게 한다. 경고는 사실을 숨기지 않되 핵심 콘텐츠를 덮는 modal이나 full-screen alert로 표시하지 않는다.

Event card는 다음을 표시한다.

- 한국어 제목과 한 줄 요약
- 중요도
- 주요 Topic
- 연결 Source 수
- 대표 이미지가 있을 경우 작은 보조 이미지

V1 UI에는 AI 수치 점수를 표시하지 않고 중요도 `S/A/B`만 표시한다. 점수 저장 구조는 유지하되 공개 여부는 평가 체계가 안정화된 후 다시 결정한다.

### News Detail — `/events/[slug]`

단일 기사 페이지가 아니라 하나의 Event를 중심으로 구성한다.

- 한국어 제목
- 한 줄 요약
- 대표 이미지와 이미지 출처
- 중요도
- FACT
- INTERPRETATION
- SIGNAL
- SPECULATION
- 왜 중요한가
- 전망
- 관련 사업 기회
- 관련 Topic과 Entity
- 좋아요, 싫어요, 관심, 저장
- 연결된 모든 Source

대표 원본의 `원문 보기` CTA를 상단에서 쉽게 찾을 수 있게 하고 하단에는 Event와 연결된 모든 Source를 노출한다. Source card는 source type, authority, verification status, publisher, published date를 보여준다. OFFICIAL, INDEPENDENT, ANALYSIS, COMMUNITY 등의 출처 성격과 verified, corroborated, unverified, disputed 상태는 색상에만 의존하지 않는 text badge로 구분한다.

공식 YouTube 또는 관련 분석 영상은 `external_id` 또는 URL에서 video ID를 안전하게 추출할 수 있을 때 썸네일 카드로 표시한다. 자동재생은 사용하지 않으며 실패 시 일반 Source card로 fallback한다.

대표 이미지는 검증 가능한 원문 또는 공식 출처에서만 사용하고 Source 연결과 attribution을 보존한다. 이미지를 확보하지 못한 Event는 이미지 영역 없이 정상 렌더링한다. V1 뉴스 대표 이미지에는 AI 생성 이미지를 사용하지 않으며 사진이 텍스트보다 과도하게 강조되지 않게 한다.

### Opportunities — `/opportunities`

- 최신 및 과거 Opportunity
- 점수, 별점, potential, difficulty
- customer, problem, differentiation, 2주 MVP
- monetization과 falsification
- 명시적으로 연결된 근거 Event
- build candidate 및 owner-waiting 상태
- 날짜, Topic, potential 필터

웹은 `waiting_for_owner` 후보를 표시할 뿐 설계나 구현을 자동 시작하지 않는다.

### Trends — `/trends`

- 7일/30일 Topic 등장 변화
- 반복 등장 Entity
- 중요 Event 흐름
- 일일 Community/시장 signal
- Topic follow action

초기 데이터가 부족할 때는 의미 없는 증감률을 만들지 않고 `데이터 축적 중` 상태를 표시한다. V1 trend는 editorial fact score가 아니라 빈도, 최신성, 중요도, 출처 다양성에 기반한 탐색용 지표다.

### Saved — `/saved`

- 비로그인 사용자가 직접 진입하면 콘텐츠 탐색을 막지 않는 로그인 안내와 공개 페이지 복귀 동선을 제공
- 로그인 사용자: bookmark Event, interested Event, followed Topic
- 최신순, 저장순, Topic 필터

보조 인증 route로 `/login`, `/auth/callback`을 둔다. `/login`은 OAuth 처리 또는 사용자의 직접 로그인 진입점이며 사이트 기본 진입 화면으로 사용하지 않는다. V1 provider는 Google OAuth 하나만 구현한다.

## 5. 로그인 UX와 복귀 흐름

### 공개 우선

- `/`, Event Detail, Opportunities, Trends는 로그인 없이 직접 접근할 수 있다.
- 최초 진입을 `/login`으로 redirect하지 않는다.
- 로그인하지 않았다는 이유로 modal, popup, full-screen overlay를 자동 표시하지 않는다.
- 로그인 CTA는 작고 지속적으로 찾을 수 있지만 콘텐츠보다 우선하지 않는다.

### 개인 기능 요청 시 안내

사용자가 좋아요, 싫어요, 관심, 저장, Topic Follow 또는 Saved를 직접 사용하려는 경우에만 로그인 안내를 표시한다. 현재 페이지를 유지할 수 있는 inline prompt, popover 또는 작은 dialog를 사용할 수 있으나 사용자가 요청하지 않은 시점에는 표시하지 않는다.

### Google OAuth와 return path

1. 사용자가 개인 기능을 요청한다.
2. 현재 same-origin relative path, Event slug와 scroll anchor를 `next`로 보존한다. Supabase가 PKCE state/code verifier를 관리하고 애플리케이션은 `next`에 권한이나 mutation payload를 넣지 않으며 callback에서 다시 검증한다.
3. Google OAuth를 시작하고 `/auth/callback`으로 돌아온다.
4. callback은 허용된 relative `next` 값만 검증한 뒤 원래 페이지로 redirect한다.
5. 원래 Event와 읽던 위치를 복원하고 요청했던 action을 다시 수행할 수 있게 한다.

Open redirect를 방지하기 위해 `next`는 반복 decoding 후 단일 `/`로 시작하는 same-origin path만 허용한다. `//`, 역슬래시, scheme/host, 제어문자, decoding 상한 뒤에도 남은 encoding은 거부하고 실패 시 `/`로 보낸다. unsigned `next`는 권한 부여나 mutation replay에 사용하지 않고 안전한 로컬 탐색 위치만 담으므로 별도 애플리케이션 서명 state를 두지 않는다. Supabase production callback은 exact URL allowlist와 PKCE code exchange를 사용하며 wildcard는 preview 환경에만 한정한다. OAuth 전 action을 자동 확정하지 않고 로그인 후 사용자가 상태를 확인하거나 다시 실행할 수 있게 한다. 향후 provider를 추가할 수 있도록 auth adapter 경계는 유지하지만 V1에서는 Google 외 provider를 구성하거나 UI에 노출하지 않는다.

Event Detail은 Event가 등장한 가장 최신 `date_kst` occurrence의 표시·Analysis를 사용한다. 과거 날짜 correction의 높은 revision은 최신 날짜를 덮지 않으며 revision은 같은 날짜 tie-breaker에만 사용한다. 검토된 merge route는 canonical Event로 permanent redirect하고, Source 목록은 전체 Event occurrence를 누적한 뒤 Source별 최신 verification 상태를 표시한다.

## 6. 렌더링, 캐시, SEO

### 렌더링

- Today, Event Detail, Opportunities, Trends: Server Components 우선
- reaction, bookmark, follow control: 최소 Client Component
- Saved: 인증된 동적 서버 렌더링
- 사용자 mutation: Server Action 또는 Route Handler 한 방식을 프로젝트 전반에 일관되게 적용

### 캐시

- 공개 content query는 `briefing:{date}`, `event:{eventKey}`, `opportunities`, `trends` cache tag를 사용한다.
- sync 성공 뒤 서명된 revalidation endpoint가 관련 tag를 무효화한다.
- revalidation 실패 시 짧은 time-based revalidation로 회복한다.
- 사용자 세션과 Saved 데이터는 공유 cache에 저장하지 않는다.

### SEO

- Event별 canonical URL과 metadata
- 공개 Event sitemap
- 제목, 요약, 대표 이미지가 있는 경우 Open Graph metadata
- 외부 Source 링크는 명확한 출처 레이블과 안전한 외부 링크 속성을 사용

## 7. 인증, 권한, 개인정보

### 공개 사용자

- 게시된 Briefing, Event, Analysis, Source, Topic, Opportunity, Resource, Trend를 읽을 수 있다.
- 사용자 테이블을 읽거나 쓸 수 없다.
- 로그인하지 않은 상태가 기본 사용자 경험이며 공개 route 접근에 Auth session을 요구하지 않는다.

### 로그인 사용자

- 자신의 profile을 읽고 수정할 수 있다.
- 자신의 reaction, bookmark, follow만 생성·조회·수정·삭제할 수 있다.
- 다른 사용자의 식별 가능한 활동 데이터는 조회할 수 없다.
- V1 로그인 provider는 Google OAuth만 사용한다.

### 운영 권한

- GitHub sync job만 service-role로 콘텐츠 projection을 변경한다.
- service-role key는 GitHub Actions secret 또는 승인된 server-only 환경에만 저장한다.
- 브라우저와 public build artifact에는 publishable/anon key만 포함한다.
- service-role importer는 사용자 cookie/session을 읽는 Next.js SSR client와 인스턴스를 공유하지 않는 전용 server-only client를 사용한다.
- public schema의 모든 table은 RLS와 명시적 GRANT를 함께 적용하고, view는 `security_invoker`로 만들거나 API 비노출 schema에 둔다.
- `SECURITY DEFINER` import는 service-role만 실행 가능한 좁은 public RPC façade로 제공하고 운영 table은 private schema에 둔다. 고정 search path, schema-qualified object, `PUBLIC`/`anon`/`authenticated` EXECUTE revoke를 필수로 한다.

### 개인정보 최소화

- Profile에는 V1 표시와 계정 운영에 필요한 최소 필드만 저장한다.
- Auth provider 원본 토큰을 애플리케이션 테이블에 복제하지 않는다.
- 반응·저장·팔로우는 사용자 정본 데이터이며 account deletion 정책에서 함께 삭제할 수 있어야 한다.

## 8. 사용자 반응과 신뢰도 분리

사용자 반응은 다음 용도로만 사용한다.

- 개인 Saved/Interested view
- 향후 추천 및 관심도 계산
- 집계된 engagement 탐색

다음 필드는 사용자 반응으로 변경할 수 없다.

- Source authority
- Source verification status
- FACT 또는 다른 editorial analysis
- AI 평가 점수
- Event importance

V1에서는 전체 사용자 반응 수 공개가 필수 요구가 아니므로 개인 반응 상태만 제공할 수 있다. 공개 집계가 필요해지면 사용자 ID를 노출하지 않는 별도 aggregate를 설계한다.

## 9. Git → Supabase 동기화

### 트리거

- `main` push 중 `data/daily/**` 또는 `data/identity/**`가 변경된 경우 별도 GitHub Actions workflow 실행
- identity registry만 변경되면 영향 key를 계산하되 V1 안전 기본값은 고정된 main snapshot에서 전체 archive reconcile
- 최초 도입 또는 복구 시 전체 archive backfill command 실행
- Vercel Cron을 별도 일일 수집 스케줄러로 사용하지 않음

### 처리 순서

1. push된 정확한 commit을 checkout한다.
2. 기존 `scripts/validate_daily.py`를 실행한다.
3. Web importer의 runtime schema로 타입과 필수 매핑을 검증한다.
4. 전체 archive에서 explicit registry에 없는 Event key와 normalized Source URL을 deterministic UUIDv5로 발견해 complete effective registry를 만든다. Alias/merge correction은 explicit registry가 우선한다.
5. 원본 파일 SHA-256과 effective identity registry checksum을 계산하고, 두 값과 importer mapping version을 합친 projection input checksum을 만든다.
6. Full Git main history에서 DB registry/cursor SHA → incoming SHA → 현재 remote main SHA의 ancestry를 검증한다. commit count는 진단값으로만 기록한다.
7. Registry는 commit SHA와 checksum의 2-field CAS로 적용해 A→B→A 또는 늦은 실행의 registry rollback을 막는다.
8. DB의 global advisory transaction lock을 획득해 registry와 content import를 각각 직렬화한다.
9. Packet RPC가 global lock 안에서 workflow가 읽은 `expected_cursor_sha`와 live registry checksum을 실제 값과 비교한다. 하나라도 바뀌었으면 write 없이 재시도한다.
10. accepted descendant commit이면 checksum이 같아도 SHA watermark를 전진시킨다. raw JSON뿐 아니라 identity registry와 mapper version까지 포함한 projection input checksum이 같을 때만 content write 없이 종료한다. ancestor 지연 실행은 skip하고 diverged/force-push history는 reconcile failure로 중단한다.
11. 내용이 달라졌으면 Git field를 Supabase Event model로 변환한다.
12. 제한된 service-role 전용 RPC로 한 transaction 안에서 upsert한다.
13. 입력/출력 record count와 관계 무결성을 검증한다.
14. sync run 결과를 저장한다.
15. 성공 시 관련 Next.js cache tag를 재검증한다.

### 안정 키

| 도메인 | 안정 키 |
|---|---|
| Daily Briefing | `date_kst` |
| Event | immutable UUID; Git `event_key`는 versioned alias registry로 resolve |
| Source | immutable UUID; provider external ID와 versioned URL alias/canonical registry로 resolve |
| Topic | normalized slug |
| Entity | type + canonical name |
| Opportunity | explicit stable key; 없으면 date + normalized name |

### 같은 날짜 보강

- Briefing ID와 Event ID는 유지한다.
- 해당 Briefing의 노출 순서와 membership을 새 packet과 일치시킨다.
- 다른 날짜가 참조하는 Event, Source, Topic은 삭제하지 않는다.
- 정정 때문에 orphan이 생겨도 자동 hard delete하지 않고 reconcile 또는 archive 대상으로 기록한다.
- correction으로 제거된 occurrence가 Event/Opportunity의 current 근거였으면 같은 transaction에서 남은 occurrence를 `(date_kst, accepted commit ancestry)` 순으로 다시 계산한다. 남은 published occurrence가 없으면 본체를 `archived`로 전환한다.
- `first_seen_date`, `last_seen_date`, `is_current` analysis와 Event/Opportunity current 표시 필드는 영향 occurrence 전체에서 재계산하여 stale current를 노출하지 않는다.
- 같은 날짜 correction은 incoming commit이 stored cursor의 descendant일 때만 적용한다.
- Event의 현재 표시 필드와 current analysis는 날짜가 더 최신이거나 같은 날짜의 accepted descendant correction일 때만 갱신한다.
- 과거 날짜 correction은 그 Briefing에 연결된 analysis version만 갱신하고 최신 Event 상태를 뒤로 되돌리지 않는다.
- build-candidate 상태는 Opportunity 전역 속성이 아니라 `Briefing × Opportunity` occurrence에 저장한다.
- 제목, 요약, 중요도, 이미지, Analysis, Source verification/대표 여부/순서/인용문, Opportunity 평가 필드는 날짜별 occurrence snapshot에 저장하여 다른 Briefing의 기록을 덮어쓰지 않는다.

### 실패 처리

| 실패 | 동작 |
|---|---|
| 기존 JSON validation 실패 | Supabase write 없이 종료 |
| runtime mapping 실패 | Supabase write 없이 sync failure 기록 |
| RPC 중간 실패 | transaction rollback |
| Supabase 장애 | Git/Notion 결과 유지, workflow 재실행 가능 |
| cache revalidation 실패 | DB 성공 유지, 경고 기록, time-based cache로 회복 |
| 동일 실행 중복 | checksum과 unique constraint로 no-op/upsert |
| 동시 push/sync | DB advisory lock으로 직렬화한 뒤 lock 안에서 checksum 재검사 |
| 같은 날짜 correction 역순 도착 | cursor의 ancestor인 지연 commit을 superseded로 skip |
| A→B→A checksum reversion | 내용 no-op이어도 descendant commit SHA watermark를 전진시켜 지연 B 차단 |
| cursor/incoming history divergence | 자동 순서를 추측하지 않고 reconcile failure |
| identity registry만 변경 | Web sync를 실행하고 영향 archive를 새 projection checksum으로 reconcile |
| 과거 correction | 해당 Briefing만 갱신하고 최신 Event current state 유지 |

## 10. 현재 데이터 계약의 호환성 보완

현재 Git packet과 Web 요구사항 사이에는 다음 차이가 있다.

### 한국어 제목과 요약

- 현재 일부 Event 제목과 요약은 영어다.
- V1 DB는 `title_original`, `title_ko`, `one_line_summary_ko`를 구분한다.
- 앞으로 AI Researcher가 생성하는 사용자 표시용 콘텐츠는 한국어를 기본으로 한다.
- 기업명, 제품명, 모델명, 기술명 등 고유명사는 필요한 경우 원문을 유지한다.
- 기존 legacy 영어 데이터를 V1 구축 과정에서 일괄 번역하지 않는다.
- 한국어 값이 없는 legacy Event는 `title_original`과 원문 summary를 fallback으로 표시한다.
- 이 결정은 출력 언어 정책이며, 이번 문서 변경에서 기존 Researcher 자동화나 Git schema를 수정하지 않는다.

### AI 평가 점수

- 현재 daily JSON에는 중요도 `S/A/B`는 있으나 수치 점수가 없다.
- `ai_score`와 `score_breakdown`은 nullable로 설계한다.
- 중요도에서 임의 수치 점수를 만들지 않는다.
- 향후 Git schema에 명시적 평가 결과가 추가되면 importer가 해당 값을 사용한다.
- V1 사용자 UI는 중요도 `S/A/B`만 표시하고 수치 점수와 세부 산정 방식은 표시하지 않는다.
- 평가 체계가 안정화되면 공개 여부를 별도 제품 결정으로 다시 검토한다.

### Legacy 분석 원문

- 현재 `summary`는 schema상 자유 text이며 label이 없는 packet도 validator를 통과할 수 있다.
- importer는 `summary_raw`에 원문을 항상 보존한다.
- 네 label이 명확할 때만 FACT/INTERPRETATION/SIGNAL/SPECULATION으로 구조화한다.
- label이 불완전하면 raw analysis fallback을 표시하고 사실을 임의 생성하지 않는다.

### 대표 이미지

- 현재 Event 대표 이미지 필드가 없다.
- 검증 가능한 원문 또는 공식 Source의 image와 YouTube thumbnail만 사용한다.
- 이미지 URL, 연결 Source, attribution을 추적할 수 있어야 한다.
- 이미지가 없으면 text-first fallback을 사용한다.
- 외부 저작물을 권리 확인 없이 Supabase Storage로 복제하지 않는다.
- V1 뉴스 대표 이미지에 AI 생성 이미지를 사용하지 않는다.
- 이미지 크기와 배치는 텍스트 가독성을 우선하며 콘텐츠보다 과도하게 강조하지 않는다.

### Source taxonomy

- 현재 `tier A/B/C`만으로 source type, authority, verification status를 완전히 결정할 수 없다.
- 명확한 URL/provider 규칙만 자동 매핑하고 불확실한 값은 `source_type=other`, `authority=unknown`, `verification_status=unverified`로 둔다.
- 검증 상태를 과장하는 추정 매핑을 금지한다.
- Source identity는 URL 문자열 하나가 아니라 stable UUID다. raw/normalized/canonical/alternate/redirect URL을 별도 이력으로 보존하고 mapping rule version과 근거를 기록한다.
- YouTube video ID, X status ID, GitHub resource 종류를 보수적으로 정규화하고 tracking parameter는 명시적 denylist만 제거한다.
- 서로 다른 URL은 검증된 canonical/provider ID/redirect 또는 Git identity registry 없이 자동 병합하지 않는다.
- redirect 확인은 SSRF 방어, public HTTP(S) 주소, hop/timeout 제한을 충족할 때만 수행하며 실패하면 관측 URL을 그대로 보존한다.

### Event identity

- `events.id` UUID가 영구 identity이며 `event_key`는 Git 입력 alias다.
- 동일 key의 재등장은 같은 UUID로 resolve한다. key 변경은 Git main의 schema-validated identity registry가 이전 key와 새 key를 같은 immutable `event_uid`에 연결할 때만 같은 Event로 합친다.
- 동일 key가 다른 Event에 연결되거나 alias/merge가 모순되면 해당 import를 `needs_review`로 격리하고 기존 Event를 덮어쓰지 않는다.
- 제목·Source 유사도는 review 후보만 만들 수 있고 자동 merge 근거가 될 수 없다.
- merge된 Event row는 hard delete하지 않고 redirect target과 사유를 남겨 public slug, bookmark, reaction을 보존한다.

### Opportunity 근거 관계

- 현재 `business_ideas[]`에는 supporting event key가 없다.
- 기존 packet은 Briefing과만 연결하고 Event 근거 관계는 비워 둔다.
- 제목 유사도만으로 Opportunity–Event 관계를 만들지 않는다.

## 11. 관측성과 운영

V1 최소 관측 항목:

- sync commit SHA, packet path, checksum
- sync started/finished timestamp와 status
- 입력/출력 record count
- mapping/constraint/RPC/cache 오류 분류
- DB의 최신 `date_kst`와 Git `latest.json` 날짜 차이
- Vercel request error와 latency
- Auth callback 및 RLS 거부 오류

운영자가 확인할 수 있는 server-only health check는 Git latest date와 Supabase latest briefing date를 비교해야 한다. 사용자에게는 민감한 오류 세부정보 대신 최신 데이터 상태와 안전한 fallback을 표시한다.

### 복구 경계

- Event/Source alias와 merge/canonical override도 Git main의 versioned identity registry에 보존하여 새 콘텐츠 DB에서 동일 identity 관계를 재현한다.
- 신규 빈 DB는 migrations + Git snapshot만으로 콘텐츠 projection을 재구축할 수 있다. Auth와 사용자 데이터는 Git 복구 범위가 아니며 Supabase backup/PITR 대상이다.
- 사용자 데이터가 존재하는 운영 DB의 콘텐츠 rebuild는 truncate가 아니라 staging backfill → 검증 → stable UUID reconcile/upsert로 수행한다.
- rebuild 역할은 `auth.users`, `profiles`, `reactions`, `bookmarks`, `follows`에 delete/truncate 권한을 갖지 않으며 전후 row count와 FK 연결을 검증한다.

## 12. V1 범위

### 포함

- 다섯 개 화면과 반응형 UI
- Event 중심 콘텐츠 및 다중 Source
- Git-to-Supabase 멱등 sync와 backfill
- 공개 콘텐츠 읽기
- Supabase Auth
- 좋아요, 싫어요, 관심, 저장, Topic follow
- RLS와 최소 관측성
- SEO, loading/empty/error state
- Vercel 배포와 독립된 Web CI

### 제외

- FREE/PLUS/PRO membership
- entitlement engine와 결제
- 댓글, 컬렉션, 커뮤니티 작성
- 개인화 추천 모델과 알림
- 관리자 CMS
- 자동 이미지 복제
- 사용자 반응에 의한 사실 신뢰도 변경
- 기존 Notion 구조 변경
- AI Architect 또는 제품 구현 자동 실행

### 향후 확장 경계

향후 FREE/PLUS/PRO membership, entitlement, payment, comment, collection, personal recommendation, notification, community를 최소 변경으로 추가할 수 있도록 Auth identity, Server Action/Route Handler, RLS와 domain module 경계를 명확히 유지한다. 그러나 V1에서는 관련 table, 결제 provider, entitlement engine, comment moderation, notification worker 또는 recommendation pipeline을 생성하지 않는다. 실제 요구가 승인될 때 별도 migration과 결정 기록으로 추가한다.

## 13. 예상 디렉터리 구조

```text
ai-daily-intelligence/
├─ .github/workflows/
│  ├─ validate.yml                 # 기존 유지
│  ├─ web-ci.yml                   # 신규
│  └─ sync-supabase.yml            # 신규
├─ data/                            # 기존 Git 정본
│  ├─ daily/                        # 기존 AI Researcher archive, 변경 없음
│  └─ identity/                     # Web identity alias/merge registry, 구현 시 별도 schema/review 추가
├─ reports/                         # 기존 보고서
├─ publish/                         # 기존 Notion projection
├─ schema/                          # 기존 daily 계약
├─ scripts/                         # 기존 Python 자동화
├─ tests/                           # 기존 Python 테스트
├─ docs/
├─ apps/
│  └─ web/
│     ├─ app/
│     │  ├─ (public)/
│     │  │  ├─ page.tsx
│     │  │  ├─ events/[slug]/
│     │  │  ├─ opportunities/
│     │  │  └─ trends/
│     │  ├─ (account)/saved/
│     │  ├─ auth/callback/
│     │  └─ api/revalidate/
│     ├─ components/
│     ├─ lib/
│     │  ├─ supabase/
│     │  ├─ queries/
│     │  ├─ actions/
│     │  ├─ auth/
│     │  └─ cache/
│     ├─ styles/
│     └─ types/
├─ packages/
│  └─ importer/
│     ├─ src/
│     └─ tests/
├─ supabase/
│  ├─ migrations/
│  ├─ tests/
│  └─ config.toml
├─ package.json
├─ pnpm-workspace.yaml
└─ pnpm-lock.yaml
```

## 14. 구현 순서

1. 승인된 제품·UX 결정을 기준으로 최종 기술 검토와 남은 운영 사항 확정
2. 기존 자동화 회귀 기준과 Web workspace 경계 설정
3. Supabase schema, index, RLS, import RPC 및 DB 테스트
4. importer, single-day sync, same-day rerun, full backfill
5. 공개 read-only Today와 Event Detail
6. Opportunities와 Trends
7. Auth, reaction, bookmark, follow, Saved
8. cache revalidation, SEO, 관측성, Vercel 환경 설정
9. 전체 회귀·보안·접근성·복구 검증
10. 독립 release review 후 배포

## 15. 기술 승인 기준

- 기존 AI Researcher와 Git/Notion 자동화 결과가 변경되지 않는다.
- 기존 Python 테스트와 daily validation이 계속 통과한다.
- 같은 JSON을 반복 sync해도 DB 결과가 동일하다.
- 동시에 같은 packet을 sync해도 한 번 처리한 것과 결과가 같다.
- Git commit 실행 순서가 역전되거나 A→B→A로 되돌아와도 commit ancestry와 cursor CAS가 최신 main 상태를 보존한다.
- diverged/force-push history는 자동 적용하지 않고 reconcile failure로 중단한다.
- 과거 correction이 더 최신 Event current state를 덮어쓰지 않는다.
- 빈 콘텐츠 DB를 Git archive와 identity registry로 동일한 stable identity까지 재구축할 수 있다.
- 운영 content rebuild가 기존 profile/reaction/bookmark/follow를 삭제하거나 Event 연결을 끊지 않는다.
- 동일 Event의 날짜별 제목·중요도·Analysis·Source 상태·Opportunity occurrence가 비손실로 보존된다.
- Event key 변경은 alias로 복구되고 key 충돌은 quarantine되며 자동 오병합되지 않는다.
- Source URL 변형은 versioned normalization fixture를 통과하고 불확실한 taxonomy는 `other`/`unknown`/`unverified`로 fallback한다.
- Supabase 장애가 Git Publisher를 실패시키지 않는다.
- Event Detail에서 복수 Source와 눈에 띄는 원본 링크를 제공한다.
- 비로그인 사용자는 공개 콘텐츠를 읽을 수 있다.
- 최초 진입에서 로그인 redirect, 강제 modal, popup 또는 full-screen gate가 나타나지 않는다.
- 개인 기능 요청 때만 Google 로그인을 안내하고 성공 후 검증된 same-origin return path로 원래 페이지에 복귀한다.
- 로그인 사용자는 자신의 reaction, bookmark, follow만 변경할 수 있다.
- 계정 삭제 시 reaction, bookmark, follow가 cascade 삭제되어 FK가 삭제를 막지 않는다.
- 사용자 반응이 source verification 또는 AI 분석 점수를 변경하지 않는다.
- 모바일 360px부터 데스크톱까지 핵심 정보 손실 없이 표시한다.
- partial Briefing은 공개되며 비차단 상태 안내와 warnings 접근 경로를 제공한다.
- V1 UI는 수치 AI 평가 점수를 노출하지 않고 `S/A/B`만 표시한다.
- 대표 이미지가 없는 Event도 정상 렌더링되고 뉴스 대표 이미지에 AI 생성 이미지를 사용하지 않는다.
- 서비스 credential이 client bundle이나 로그에 노출되지 않는다.
- anon/authenticated는 import RPC, private 운영 table, 다른 사용자의 개인 row, definer view 우회 경로에 접근할 수 없다.
- OAuth callback은 PKCE와 exact production callback allowlist를 사용하고 악성 `next`를 `/`로 fallback한다.

## 16. 구현 전 미결정 사항

다음 항목은 구현 전에 별도 기술·운영 확정이 필요하다.

1. Source taxonomy rule registry의 최초 confirmed domain/provider 목록
2. Supabase 및 Vercel 배포 리전, backup 수준과 예상 비용 한도
3. Google OAuth consent screen, 허용 계정 범위와 개인정보 처리 고지

위 항목은 환경 생성·운영 전에는 확정해야 하지만 schema와 importer 구현 시작을 막는 구조적 미결정은 아니다.
