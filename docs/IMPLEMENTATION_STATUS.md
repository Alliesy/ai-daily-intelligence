# AI Daily Intelligence Web V1 Implementation Status

> 마지막 갱신: 2026-08-07 (Asia/Seoul)
> 현재 단계: 설계
> 전체 상태: 사용자 승인 대기
> 구현 권한: 승인되지 않음

## 1. 현재 목표

기존 Git 정본과 AI Researcher 자동화를 보존하면서 Next.js, TypeScript, Supabase, Tailwind CSS, shadcn/ui, Vercel 기반의 반응형 AI Daily Intelligence Web V1을 설계한다.

이번 단계는 문서화된 설계까지만 포함한다. 애플리케이션 scaffold, dependency 설치, Supabase project/migration 생성, Vercel 설정, 자동화 변경 또는 제품 배포는 시작하지 않는다.

## 2. 단계별 상태

| 단계 | 상태 | 결과/다음 조건 |
|---|---|---|
| 현재 저장소 분석 | 완료 | `CURRENT_ARCHITECTURE.md` |
| V1 요구사항 정리 | 완료 | 사용자 메시지와 `V1_ARCHITECTURE.md` |
| 시스템 아키텍처 설계 | 완료, 승인 대기 | `V1_ARCHITECTURE.md` |
| Supabase DB/ERD 설계 | 완료, 승인 대기 | `DB_SCHEMA.md` |
| 중요 결정 기록 | 완료, 일부 승인 대기 | `DECISIONS.md` |
| 독립 설계 검토 | revision required 후 지적 보완, 독립 재확인 대기 | RLS, raw summary, cascade, sync ordering/watermark, candidate scope, composite FK 보완 |
| 사용자 설계 승인 | 대기 | 구현 시작의 필수 gate |
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

## 5. 승인 대기 설계 결정

다음 권고는 아직 사용자 승인 전이다.

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
| V1 Auth provider | email magic link 우선 | OAuth 추가 시 provider 설정·개인정보·운영 범위 증가 |
| Legacy 한국어 콘텐츠 | 미제공 표시 후 별도 backfill | 자동 번역의 품질과 정본 위치를 결정해야 함 |
| AI 평가 점수 | explicit score가 있을 때만 표시 | S/A/B 임의 숫자 변환은 신뢰성 저하 |
| 대표 이미지 | Source URL 참조 + text fallback | 저작권, hotlink, 저장 정책 필요 |
| Source taxonomy mapping | 보수적 매핑, 불확실하면 unverified | 잘못된 verified 표시는 신뢰 위험 |
| `event_key` 범위 | 전역 stable identity | 여러 날짜 재등장 Event의 upsert 의미 결정 |
| `partial` 공개 | 경고와 함께 공개 또는 draft 유지 | 현재 자동화 status와 Web publication 분리 필요 |
| Supabase/Vercel region | 한국 사용자 latency 우선 | 비용, 데이터 위치, 가용 region 확인 필요 |
| 비용 한도 | 구현 전 owner 확정 | 외부 서비스 생성과 운영비 승인 필요 |

## 7. 구현 전 필수 gate

구현은 다음이 모두 충족된 후 시작한다.

1. 사용자가 V1 architecture와 DB schema를 승인한다.
2. 승인 대기 결정과 미결정 사항 중 V1을 막는 항목을 확정한다.
3. 마지막 sync watermark 보완에 대한 독립 재검토를 통과한다.
4. 기존 자동화 보호 acceptance criteria를 동의한다.
5. Supabase/Vercel project 생성 또는 비용 발생에 대한 권한을 확인한다.
6. 구현 branch와 배포 범위를 확정한다.

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

## 10. 변경 기록 규칙

- 설계가 바뀌면 `V1_ARCHITECTURE.md`, `DB_SCHEMA.md`, `DECISIONS.md` 중 관련 문서를 코드와 같은 변경 단위에서 갱신한다.
- 구현 상태가 바뀌면 이 문서의 단계 표, 완료 항목, 다음 작업을 갱신한다.
- 주요 사용자-visible 결과는 향후 `docs/CHANGELOG.md`에 기록한다.
- 중요한 결정은 기존 내용을 덮어쓰지 않고 `DECISIONS.md`에 새 ID로 추가한다.

## 11. 다음 권장 작업

사용자가 설계 문서를 검토하고 승인 여부와 미결정 사항에 대한 방향을 제공한다. 승인 전에는 구현을 시작하지 않는다.
