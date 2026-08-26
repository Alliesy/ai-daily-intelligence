# Changelog

AI Daily Intelligence의 사용자에게 의미 있는 구조·기능 변경을 기록한다. Git daily archive와 AI Researcher 자동화 변경은 별도로 명시한다.

## 2026-08-26

### V1.1 Daily Intelligence Morning Paper

- Today를 KPI dashboard에서 Cross-Event Insight, 실제 Evidence, Top Event 최대 3건, Opportunity 최대 1건의 editorial Morning Paper로 개편
- 전체 Event·Source·Trend·Resource·Opportunity 데이터와 기존 Event Detail을 보존
- `/archive` 날짜/키워드 검색과 월 calendar, `/daily/[date]` 과거 snapshot renderer, `/resources` 전용 화면 추가
- desktop/mobile navigation을 오늘·아카이브 중심으로 개편하고 명조+산세리프 조합, warm neutral, divider 중심 시각 시스템 적용
- optional `morning_paper`, Source taxonomy/evidence group, Problem Evidence와 9개 Opportunity realism gate를 schema 1.0에 additive 추가
- Supabase occurrence snapshot과 service-role import wrapper를 추가하고 기존 public read RLS와 사용자 데이터 경계 유지
- AI Researcher prompt에 Event clustering/Cross-Event Signal을, Opportunity Finder 앞에 Problem Scout와 엄격한 Today eligibility를 반영
- Preview Supabase에 V1.1 additive migration을 적용하고 schema contract, RLS 사용자 격리, service-role 경계와 account deletion cascade를 검증
- 전체 archive backfill 전 정본 계약 불일치(2026-08-22~25)를 발견해 검증 기준 완화 없이 import를 보류
- `agent/web-v1.1`을 Vercel Preview로 배포하고 Today, Archive, invalid month fallback, 390px 반응형을 live 검증
- 독립 리뷰에서 발견한 불가능한 archive month(`2026-99`) 입력을 최신 브리핑 월로 안전하게 fallback하도록 수정
- owner 승인에 따라 2026-08-22~25 legacy packet의 schema version, potential, community platform taxonomy를 의미 보존 방식으로 correction
- 전체 20개 packet dry-run과 Preview Supabase backfill을 통과하고 Today·Archive의 2026-08-26 최신 projection을 확인
- Preview branch용 임시 sync trigger/watermark 허용을 backfill 직후 제거해 workflow secret 경계를 다시 `main` 전용으로 복원
- Web V1.1 전체 변경과 분리된 canonical correction-only PR [#6](https://github.com/Alliesy/ai-daily-intelligence/pull/6)을 생성하고 main merge는 보류

## 2026-08-14

### 최신 Supabase briefing의 Preview 즉시 반영

- Today, News Detail, Opportunities, Trends의 빌드 시점 데이터 고정을 해제
- Git main에서 Preview Supabase로 동기화된 새 briefing과 correction을 Vercel 재빌드 없이 요청 시 조회
- 공개 projection RLS, 사용자 데이터, Auth, AI Researcher와 daily schema는 변경하지 않음
- 동적 rendering 회귀 테스트 4개와 production route classification 검증 추가

### 승인 목업 기반 UI/UX 개선

- 전역 header, typography, spacing, radius를 고밀도 newsroom 스타일로 조정
- Today, 사업 기회, 트렌드, 저장됨의 큰 Hero와 과도한 card 사용 축소
- News Detail 순서를 Header → Action → 원문 상세 → AI 분석 → 사업 기회 → 관련 자료로 재구성
- 원문 기반 상세 요약의 기본 접힘, gradient preview, 자세히 보기/접기 구현
- 명시적으로 확인된 legacy 누적 FACT 형식만 presentation 단계에서 정규화하고 정상 structured field는 보존
- Desktop 6-card 분석과 mobile accordion 구현
- Source를 한국어 taxonomy·authority·verification label의 compact list로 변경하고 많은 자료에서만 filter 표시
- Git archive, daily schema, Supabase schema/RLS, OAuth 보안 계약은 변경하지 않음
- 검증된 `agent/web-v1` 커밋을 Vercel Preview에만 재배포하고 desktop/mobile 핵심 화면을 live 검증

## 2026-08-08

### Vercel Preview 배포

- Hobby 범위의 Preview 전용 Vercel 프로젝트 `ai-daily-intelligence-preview` 생성
- `apps/web` monorepo Root Directory와 Preview Supabase 공개 연결 환경 변수 설정
- `agent/web-v1` 체크아웃을 Preview로 배포하고 공개 Today 페이지 및 Event projection 렌더링 확인
- PostgREST Source 조회를 composite FK 경로(`event_source_occurrences → event_sources → sources`)에 맞게 수정
- Supabase Auth exact redirect allowlist에 Preview `/auth/callback` 추가
- Google OAuth는 Client credential 설정 전 `WAITING_FOR_USER` 유지
- Production Vercel, Production Supabase, GitHub main은 변경하지 않음

### Preview Supabase 통합 검증

- Free/nano, AWS Seoul 전용 프로젝트 `ai-daily-intelligence-preview` 생성 및 V1 migration 적용
- service-role의 public table 직접 권한을 제거하고 atomic import RPC 경계를 실제 DB에서 검증
- importer RPC의 `events.canonical_event_key` 컬럼 참조 오류 수정
- Git archive backfill 성공 및 동일 SHA 재실행 `same_sha` skip 확인
- anon 공개 조회, 사용자별 reaction/bookmark/follow 격리, 교차 쓰기 차단, account deletion cascade 통합 테스트 추가 및 PASS
- schema contract의 PUBLIC 함수 권한 검사를 PostgreSQL ACL 기반으로 교정
- 검증용 secret 및 fixture 정리, legacy HS256 JWT key 폐기 확인
- 전체 test, lint, typecheck, production build PASS

### Preview Google OAuth 준비

- Preview Auth Site URL을 `http://localhost:3000`으로 확인
- exact redirect allowlist에 `http://localhost:3000/auth/callback` 추가
- Google OAuth provider가 Preview Client ID/Secret 부재로 Disabled 상태임을 확인
- Google Cloud 사용자 설정 완료 전 상태를 `WAITING_FOR_USER`로 기록

### Web 공개 화면

- server-only Supabase/public archive DAL과 화면 전용 DTO 추가
- 로그인 gate 없는 반응형 header 및 Today 화면 구현
- Event 중심 상세 화면, 상단 원문 CTA, 분석 4단계, 전체 Source badge·YouTube thumbnail 구현
- shadcn/ui 최소 primitive와 Supabase SSR/client dependency 추가
- Web typecheck, ESLint, production build와 archive 정적 페이지 생성을 검증

### V1 기능 화면과 개인 기능

- Opportunities, 7/30일 Trends, Saved 화면 추가
- Google OAuth PKCE callback과 open-redirect 방어 return path 추가
- 좋아요·싫어요·관심·저장·Topic Follow와 사용자별 Saved 조회 추가
- sitemap, robots, 404, 동적 metadata와 반응형·접근성 보강
- 모바일/데스크톱 브라우저에서 공개 탐색과 선택적 로그인 복귀 흐름 검증
- Event Detail의 최신 날짜 우선 occurrence 선택, 과거 correction 방지와 reviewed merge permanent redirect 구현
- Event 전체 Source 이력을 누적하고 Source별 최신 verification을 결정적으로 표시
- OAuth return path의 반복 encoding·제어문자 방어와 비대화형 Vitest thread pool 안정화
- 전체 test/lint/typecheck/build 통과 및 Phase F-I 독립 보안·릴리스 리뷰 `READY`

### 추가

- pnpm workspace와 `apps/web` Next.js 16.3 애플리케이션 기반
- TypeScript 공통 설정과 Tailwind CSS 4 기본 설정
- Supabase V1 content projection, 사용자 데이터, identity registry, sync 운영 table migration 초안
- service-role 전용 identity/import RPC와 공개/개인 데이터 RLS 정책
- Git 추적형 Event/Source identity registry schema 및 현재 archive bootstrap fixture
- migration/identity 정적 계약 테스트와 DB 적용 후 실행할 SQL 보안 검증문
- registry checksum 경쟁·누락 방어, immutable identity seed, 단일 단계 Event merge redirect reconciliation

### 보존

- `AUTOMATION_PROMPT.md`, `schema/daily.schema.json`, `data/daily/**`, 기존 Python validator/renderer와 Git 정본 구조는 변경하지 않았다.

## 2026-08-14 — Today newsroom dashboard 개선

- 승인된 desktop/mobile Today 목업을 기준으로 인사이트, 실제 당일 metric, lead/secondary Event hierarchy를 구현했다.
- Opportunity, Trend Signal, Resource를 compact 3열 dashboard로 재구성하고 mobile에서는 한 열 흐름을 유지했다.
- Today lead Event에 기존 RLS 기반 reaction/bookmark와 공유 action을 연결했다.
- 모바일 하단 navigation과 desktop 뉴스 section 진입점을 추가하고 선택적 로그인 정책을 유지했다.
- 목업의 예시 수치·대표 이미지·상승률은 복제하지 않았으며 Git archive, daily schema, importer, migration, RLS는 변경하지 않았다.

### 검증

- Web TypeScript typecheck, ESLint, production build 통과
- Supabase foundation 정적 계약 테스트 및 `git diff --check` 통과
- Phase A 독립 보안 리뷰 `READY`
- 실제 PostgreSQL/Supabase migration 적용 테스트는 로컬 DB runtime 확보 후 수행 예정

### Git → Supabase importer

- JSON Schema runtime validation과 Event/Source complete registry 검증
- raw/registry/mapper projection checksum 및 full-history ancestry 판정
- registry commit+checksum CAS와 packet별 cursor CAS
- tracking parameter, YouTube, X, GitHub URL normalization 및 보수적 taxonomy fallback
- incremental/backfill/dry-run CLI와 10개 importer 회귀 테스트
- secret 없는 manual dry-run과 main 전체 archive reconcile을 제공하는 별도 sync workflow
- legacy Opportunity의 이름 충돌을 막는 `date_kst + normalized name` fallback identity
- 전체 archive에서 신규 Event/Source를 deterministic UUIDv5로 발견하는 effective registry
- provenance와 semantic registry checksum 분리, stateful A→B→A·stale run 회귀 테스트
- Phase B-C 독립 기술 검토 `READY`
