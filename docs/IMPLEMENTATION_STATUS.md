# AI Daily Intelligence Web V1 Implementation Status

> 마지막 갱신: 2026-08-07 (Asia/Seoul)
> 현재 단계: 설계
> 전체 상태: 제품·UX 및 기술 설계 승인, 구현 지시 대기
> 구현 권한: 승인되지 않음

## 1. 현재 목표

기존 Git 정본과 AI Researcher 자동화를 보존하면서 Next.js, TypeScript, Supabase, Tailwind CSS, shadcn/ui, Vercel 기반의 반응형 AI Daily Intelligence Web V1을 설계한다.

이번 단계는 문서화된 설계까지만 포함한다. 애플리케이션 scaffold, dependency 설치, Supabase project/migration 생성, Vercel 설정, 자동화 변경 또는 제품 배포는 시작하지 않는다.

## 2. 단계별 상태

| 단계 | 상태 | 결과/다음 조건 |
|---|---|---|
| 현재 저장소 분석 | 완료 | `CURRENT_ARCHITECTURE.md` |
| V1 요구사항 정리 | 완료 | 사용자 메시지와 `V1_ARCHITECTURE.md` |
| 시스템 아키텍처 설계 | 완료, 제품 방향 승인 | `V1_ARCHITECTURE.md` |
| Supabase DB/ERD 설계 | 완료, 제품 방향 승인 | `DB_SCHEMA.md` |
| 중요 결정 기록 | 완료, 제품·UX 결정 반영 | `DECISIONS.md` |
| 독립 설계 검토 | approve | RLS, raw summary, cascade, sync ordering/watermark, candidate scope, composite FK 및 제품·UX 결정 일관성 확인 |
| 사용자 제품·UX 승인 | 완료 | 2026-08-07 승인 및 8개 결정 확정 |
| 구현 지시 | 대기 | 이번 단계에서는 문서만 변경 |
| Web workspace/scaffold | 시작 안 함 | 승인 후 진행 |
| Supabase migration/RLS | 시작 안 함 | 승인 후 진행 |
| Git-to-Supabase sync | 시작 안 함 | 승인 후 진행 |
| Today/News Detail | 시작 안 함 | DB와 sync 검증 후 진행 |
| Opportunities/Trends | 시작 안 함 | 공개 read model 후 진행 |
| Auth/Saved/반응 기능 | 시작 안 함 | RLS 검증 후 진행 |
| Vercel 배포 | 시작 안 함 | 구현·검토·승인 후 진행 |

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
- checksum reversion을 포함한 per-path Git revision watermark

상세 근거는 `DECISIONS.md`를 따른다.

## 6. 미결정 사항

| 항목 | 권장 기본값 | 결정이 필요한 이유 |
|---|---|---|
| Source taxonomy mapping | 보수적 매핑, 불확실하면 unverified | 잘못된 verified 표시는 신뢰 위험 |
| `event_key` 범위 | 전역 stable identity | 여러 날짜 재등장 Event의 upsert 의미 결정 |
| Supabase/Vercel region | 한국 사용자 latency 우선 | 비용, 데이터 위치, 가용 region 확인 필요 |
| Backup/PITR | 구현 전 운영 수준 확정 | 콘텐츠 projection과 사용자 데이터의 복구 요구가 다름 |
| 비용 한도 | 구현 전 owner 확정 | 외부 서비스 생성과 운영비 승인 필요 |
| Google OAuth 운영 | consent screen, 허용 계정, 개인정보 고지 확정 | 외부 OAuth 설정과 개인정보 처리가 필요 |

## 7. 구현 전 필수 gate

구현은 다음이 모두 충족된 후 시작한다.

1. 미결정 사항 중 구현을 막는 운영 항목을 확정한다.
2. 사용자가 애플리케이션 구현 시작을 명시적으로 지시한다.
3. 기존 자동화 보호 acceptance criteria를 동의한다.
4. Supabase/Vercel project 생성 또는 비용 발생에 대한 권한을 확인한다.
5. 구현 branch와 배포 범위를 확정한다.

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
- 과거 correction은 최신 Event current state를 덮어쓰지 않는다.
- Git archive에서 콘텐츠 projection 전체를 복구할 수 있다.
- public user는 게시 콘텐츠만 읽을 수 있다.
- authenticated user는 자신의 user data만 변경할 수 있다.
- 계정 삭제 시 reaction, bookmark, follow가 cascade 삭제된다.
- service-role key가 client에 노출되지 않는다.
- 사용자 반응은 analysis/verification/importance를 변경하지 않는다.
- News Detail은 복수 Source와 원본 링크를 명확히 표시한다.
- 핵심 화면이 모바일과 데스크톱에서 동작한다.
- 공개 route는 로그인 없이 열리고 최초 진입 강제 login UX가 없다.
- Google OAuth 후 안전한 return path로 원래 Event 또는 페이지에 복귀한다.
- partial Briefing은 명확하지만 비차단 상태 안내와 함께 공개된다.
- V1 UI는 수치 AI 점수를 노출하지 않는다.
- 검증 가능한 출처가 없는 대표 이미지와 AI 생성 뉴스 이미지를 사용하지 않는다.

## 10. 변경 기록 규칙

- 설계가 바뀌면 `V1_ARCHITECTURE.md`, `DB_SCHEMA.md`, `DECISIONS.md` 중 관련 문서를 코드와 같은 변경 단위에서 갱신한다.
- 구현 상태가 바뀌면 이 문서의 단계 표, 완료 항목, 다음 작업을 갱신한다.
- 주요 사용자-visible 결과는 향후 `docs/CHANGELOG.md`에 기록한다.
- 중요한 결정은 기존 내용을 덮어쓰지 않고 `DECISIONS.md`에 새 ID로 추가한다.

## 11. 다음 권장 작업

남은 운영 결정을 정리한 뒤 사용자가 별도로 구현 시작을 지시할 때까지 애플리케이션 구현을 시작하지 않는다.
