# Changelog

AI Daily Intelligence의 사용자에게 의미 있는 구조·기능 변경을 기록한다. Git daily archive와 AI Researcher 자동화 변경은 별도로 명시한다.

## 2026-08-08

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
