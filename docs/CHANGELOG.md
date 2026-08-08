# Changelog

AI Daily Intelligence의 사용자에게 의미 있는 구조·기능 변경을 기록한다. Git daily archive와 AI Researcher 자동화 변경은 별도로 명시한다.

## 2026-08-08

### Preview Supabase 통합 검증

- Free/nano, AWS Seoul 전용 프로젝트 `ai-daily-intelligence-preview` 생성 및 V1 migration 적용
- service-role의 public table 직접 권한을 제거하고 atomic import RPC 경계를 실제 DB에서 검증
- importer RPC의 `events.canonical_event_key` 컬럼 참조 오류 수정
- Git archive backfill 성공 및 동일 SHA 재실행 `same_sha` skip 확인
- anon 공개 조회, 사용자별 reaction/bookmark/follow 격리, 교차 쓰기 차단, account deletion cascade 통합 테스트 추가 및 PASS
- schema contract의 PUBLIC 함수 권한 검사를 PostgreSQL ACL 기반으로 교정
- 검증용 secret 및 fixture 정리, legacy HS256 JWT key 폐기 확인
- 전체 test, lint, typecheck, production build PASS

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
