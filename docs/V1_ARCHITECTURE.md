# AI Daily Intelligence Web V1 Architecture

> 상태: 설계안 — 사용자 승인 대기
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

## 2. 기술 스택

| 영역 | 기술 | 역할 |
|---|---|---|
| Web | Next.js App Router, TypeScript | SSR, Server Components, Route Handlers, metadata |
| UI | Tailwind CSS, shadcn/ui | 반응형 레이아웃과 접근 가능한 UI primitive |
| Database | Supabase PostgreSQL | Event 중심 조회 모델과 사용자 데이터 |
| Authentication | Supabase Auth | 로그인, 세션, 사용자 식별 |
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

### Today — `/`

Newsio 스타일의 정보 중심 홈이다.

구성 순서:

1. KST 기준 날짜, 데이터 상태, Today's Insight
2. 오늘의 핵심 Event 3~5개
3. Opportunity Radar
4. Trending Signals
5. Tools / Open Source / Papers

데스크톱은 핵심 Event를 주 열에, Opportunity와 Trend를 보조 열에 배치한다. 모바일은 위 순서로 한 열에 쌓는다. 이미지는 검증된 이미지가 있을 때만 제한적으로 사용하고, 이미지가 없어도 정보 구조가 유지되어야 한다.

Event card는 다음을 표시한다.

- 한국어 제목과 한 줄 요약
- 중요도
- AI 평가 점수 또는 `평가 점수 미제공`
- 주요 Topic
- 연결 Source 수
- 대표 이미지가 있을 경우 작은 보조 이미지

### News Detail — `/events/[slug]`

단일 기사 페이지가 아니라 하나의 Event를 중심으로 구성한다.

- 한국어 제목
- 한 줄 요약
- 대표 이미지와 이미지 출처
- 중요도
- AI 평가 점수와 산정 방식
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

원본 출처 링크는 상단 주요 CTA와 하단 Source 목록에 모두 노출한다. Source card는 source type, authority, verification status, publisher, published date를 보여준다.

YouTube source는 `external_id` 또는 URL에서 video ID를 안전하게 추출할 수 있을 때 썸네일 카드로 표시한다. 자동재생은 사용하지 않으며 실패 시 일반 Source card로 fallback한다.

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

- 비로그인 사용자: 로그인 안내
- 로그인 사용자: bookmark Event, interested Event, followed Topic
- 최신순, 저장순, Topic 필터

보조 인증 route로 `/login`, `/auth/callback`을 둔다. 구체적인 V1 로그인 provider는 승인 대기 사항이다.

## 5. 렌더링, 캐시, SEO

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

## 6. 인증, 권한, 개인정보

### 공개 사용자

- 게시된 Briefing, Event, Analysis, Source, Topic, Opportunity, Resource, Trend를 읽을 수 있다.
- 사용자 테이블을 읽거나 쓸 수 없다.

### 로그인 사용자

- 자신의 profile을 읽고 수정할 수 있다.
- 자신의 reaction, bookmark, follow만 생성·조회·수정·삭제할 수 있다.
- 다른 사용자의 식별 가능한 활동 데이터는 조회할 수 없다.

### 운영 권한

- GitHub sync job만 service-role로 콘텐츠 projection을 변경한다.
- service-role key는 GitHub Actions secret 또는 승인된 server-only 환경에만 저장한다.
- 브라우저와 public build artifact에는 publishable/anon key만 포함한다.

### 개인정보 최소화

- Profile에는 V1 표시와 계정 운영에 필요한 최소 필드만 저장한다.
- Auth provider 원본 토큰을 애플리케이션 테이블에 복제하지 않는다.
- 반응·저장·팔로우는 사용자 정본 데이터이며 account deletion 정책에서 함께 삭제할 수 있어야 한다.

## 7. 사용자 반응과 신뢰도 분리

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

## 8. Git → Supabase 동기화

### 트리거

- `main` push 중 `data/daily/**`가 변경된 경우 별도 GitHub Actions workflow 실행
- 최초 도입 또는 복구 시 전체 archive backfill command 실행
- Vercel Cron을 별도 일일 수집 스케줄러로 사용하지 않음

### 처리 순서

1. push된 정확한 commit을 checkout한다.
2. 기존 `scripts/validate_daily.py`를 실행한다.
3. Web importer의 runtime schema로 타입과 필수 매핑을 검증한다.
4. 원본 파일 SHA-256 checksum을 계산한다.
5. Full Git main history에서 commit revision을 계산하고 대상 commit이 현재 main의 ancestor인지 확인한다.
6. DB의 global advisory transaction lock을 획득해 content import를 직렬화한다.
7. per-path revision watermark를 확인하고 낮은 revision은 superseded로 skip한다.
8. 더 높은 revision이면 checksum이 같아도 watermark를 전진시키고, 내용이 같으면 content write 없이 종료한다.
9. 내용이 달라졌으면 Git field를 Supabase Event model로 변환한다.
10. 제한된 service-role 전용 RPC로 한 transaction 안에서 upsert한다.
11. 입력/출력 record count와 관계 무결성을 검증한다.
12. sync run 결과를 저장한다.
13. 성공 시 관련 Next.js cache tag를 재검증한다.

### 안정 키

| 도메인 | 안정 키 |
|---|---|
| Daily Briefing | `date_kst` |
| Event | `event_key` |
| Source | normalized URL |
| Topic | normalized slug |
| Entity | type + canonical name |
| Opportunity | explicit stable key; 없으면 date + normalized name |

### 같은 날짜 보강

- Briefing ID와 Event ID는 유지한다.
- 해당 Briefing의 노출 순서와 membership을 새 packet과 일치시킨다.
- 다른 날짜가 참조하는 Event, Source, Topic은 삭제하지 않는다.
- 정정 때문에 orphan이 생겨도 자동 hard delete하지 않고 reconcile 또는 archive 대상으로 기록한다.
- 같은 날짜 correction은 Git main의 monotonic `source_revision`이 더 클 때만 적용한다.
- Event의 현재 표시 필드와 current analysis는 `(input date, source_revision)`이 저장된 순서보다 클 때만 갱신한다.
- 과거 날짜 correction은 그 Briefing에 연결된 analysis version만 갱신하고 최신 Event 상태를 뒤로 되돌리지 않는다.
- build-candidate 상태는 Opportunity 전역 속성이 아니라 `Briefing × Opportunity` occurrence에 저장한다.

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
| 같은 날짜 correction 역순 도착 | 더 낮은 source revision을 superseded로 skip |
| A→B→A checksum reversion | 내용 no-op이어도 per-path revision watermark를 전진시켜 지연 B 차단 |
| 과거 correction | 해당 Briefing만 갱신하고 최신 Event current state 유지 |

## 9. 현재 데이터 계약의 호환성 보완

현재 Git packet과 Web 요구사항 사이에는 다음 차이가 있다.

### 한국어 제목과 요약

- 현재 일부 Event 제목과 요약은 영어다.
- V1 DB는 `title_original`, `title_ko`, `one_line_summary_ko`를 구분한다.
- 한국어 값이 명시되지 않은 legacy packet에는 임의 번역을 사실처럼 저장하지 않는다.
- 신규 daily output의 언어 규칙을 한국어 중심으로 보완하는 변경은 기존 자동화 호환성을 별도 검증한 뒤 진행한다.

### AI 평가 점수

- 현재 daily JSON에는 중요도 `S/A/B`는 있으나 수치 점수가 없다.
- `ai_score`와 `score_breakdown`은 nullable로 설계한다.
- 중요도에서 임의 수치 점수를 만들지 않는다.
- 향후 Git schema에 명시적 평가 결과가 추가되면 importer가 해당 값을 사용한다.

### Legacy 분석 원문

- 현재 `summary`는 schema상 자유 text이며 label이 없는 packet도 validator를 통과할 수 있다.
- importer는 `summary_raw`에 원문을 항상 보존한다.
- 네 label이 명확할 때만 FACT/INTERPRETATION/SIGNAL/SPECULATION으로 구조화한다.
- label이 불완전하면 raw analysis fallback을 표시하고 사실을 임의 생성하지 않는다.

### 대표 이미지

- 현재 Event 대표 이미지 필드가 없다.
- 명시적 Source image 또는 YouTube thumbnail만 우선 사용한다.
- 이미지가 없으면 text-first fallback을 사용한다.
- 외부 저작물을 권리 확인 없이 Supabase Storage로 복제하지 않는다.

### Source taxonomy

- 현재 `tier A/B/C`만으로 source type, authority, verification status를 완전히 결정할 수 없다.
- 명확한 URL/provider 규칙만 자동 매핑하고 불확실한 값은 `other` 또는 `unverified`로 둔다.
- 검증 상태를 과장하는 추정 매핑을 금지한다.

### Opportunity 근거 관계

- 현재 `business_ideas[]`에는 supporting event key가 없다.
- 기존 packet은 Briefing과만 연결하고 Event 근거 관계는 비워 둔다.
- 제목 유사도만으로 Opportunity–Event 관계를 만들지 않는다.

## 10. 관측성과 운영

V1 최소 관측 항목:

- sync commit SHA, packet path, checksum
- sync started/finished timestamp와 status
- 입력/출력 record count
- mapping/constraint/RPC/cache 오류 분류
- DB의 최신 `date_kst`와 Git `latest.json` 날짜 차이
- Vercel request error와 latency
- Auth callback 및 RLS 거부 오류

운영자가 확인할 수 있는 server-only health check는 Git latest date와 Supabase latest briefing date를 비교해야 한다. 사용자에게는 민감한 오류 세부정보 대신 최신 데이터 상태와 안전한 fallback을 표시한다.

## 11. V1 범위

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

## 12. 예상 디렉터리 구조

```text
ai-daily-intelligence/
├─ .github/workflows/
│  ├─ validate.yml                 # 기존 유지
│  ├─ web-ci.yml                   # 신규
│  └─ sync-supabase.yml            # 신규
├─ data/                            # 기존 Git 정본
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
│  └─ intelligence-sync/
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

## 13. 구현 순서

1. 사용자 설계 승인과 미결정 사항 확정
2. 기존 자동화 회귀 기준과 Web workspace 경계 설정
3. Supabase schema, index, RLS, import RPC 및 DB 테스트
4. importer, single-day sync, same-day rerun, full backfill
5. 공개 read-only Today와 Event Detail
6. Opportunities와 Trends
7. Auth, reaction, bookmark, follow, Saved
8. cache revalidation, SEO, 관측성, Vercel 환경 설정
9. 전체 회귀·보안·접근성·복구 검증
10. 독립 release review 후 배포

## 14. 기술 승인 기준

- 기존 AI Researcher와 Git/Notion 자동화 결과가 변경되지 않는다.
- 기존 Python 테스트와 daily validation이 계속 통과한다.
- 같은 JSON을 반복 sync해도 DB 결과가 동일하다.
- 동시에 같은 packet을 sync해도 한 번 처리한 것과 결과가 같다.
- 과거 correction이 더 최신 Event current state를 덮어쓰지 않는다.
- 빈 콘텐츠 DB를 Git archive로 재구축할 수 있다.
- Supabase 장애가 Git Publisher를 실패시키지 않는다.
- Event Detail에서 복수 Source와 눈에 띄는 원본 링크를 제공한다.
- 비로그인 사용자는 공개 콘텐츠를 읽을 수 있다.
- 로그인 사용자는 자신의 reaction, bookmark, follow만 변경할 수 있다.
- 계정 삭제 시 reaction, bookmark, follow가 cascade 삭제되어 FK가 삭제를 막지 않는다.
- 사용자 반응이 source verification 또는 AI 분석 점수를 변경하지 않는다.
- 모바일 360px부터 데스크톱까지 핵심 정보 손실 없이 표시한다.
- 서비스 credential이 client bundle이나 로그에 노출되지 않는다.

## 15. 승인 대기 사항

다음 항목은 구현 전에 사용자 결정 또는 별도 호환성 승인이 필요하다.

1. V1 로그인 provider: email magic link만 사용할지, Google 등 OAuth를 포함할지
2. 한국어가 없는 legacy Event의 처리: 미제공 표시, 별도 번역 backfill, 또는 Researcher 계약 보완
3. AI 평가 점수를 V1 필수 공개 항목으로 볼지, explicit score가 있을 때만 표시할지
4. 대표 이미지 수집·저장 정책과 외부 이미지 사용 범위
5. Source taxonomy 자동 매핑 규칙의 보수성 수준
6. `event_key`가 여러 날짜에 걸쳐 전역적으로 동일 Event를 가리킨다는 계약
7. Supabase 및 Vercel 배포 리전과 예상 비용 한도
