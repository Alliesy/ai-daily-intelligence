# AI Daily Intelligence Web V1 Implementation Status

> 마지막 갱신: 2026-08-08 (Asia/Seoul)
> 현재 단계: Phase B — Git → Supabase importer
> 전체 상태: 구현 진행 중
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
| Phase B-C: Git-to-Supabase sync | 진행 중 | importer, ancestry 판정, URL normalization, checksum과 workflow 구현 |
| Today/News Detail | 시작 안 함 | DB와 sync 검증 후 진행 |
| Opportunities/Trends | 시작 안 함 | 공개 read model 후 진행 |
| Auth/Saved/반응 기능 | 시작 안 함 | RLS 검증 후 진행 |
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
| Source taxonomy registry seed | 불확실하면 other/unknown/unverified | 최초 confirmed provider/domain 목록은 fixture 작성 시 확정 |
| Supabase/Vercel region | 한국 사용자 latency 우선 | 비용, 데이터 위치, 가용 region 확인 필요 |
| Backup/PITR | 구현 전 운영 수준 확정 | 콘텐츠 projection과 사용자 데이터의 복구 요구가 다름 |
| 비용 한도 | 구현 전 owner 확정 | 외부 서비스 생성과 운영비 승인 필요 |
| Google OAuth 운영 | consent screen, 허용 계정, 개인정보 고지 확정 | 외부 OAuth 설정과 개인정보 처리가 필요 |

## 7. 구현 전 필수 gate

구현은 다음이 모두 충족된 후 시작한다.

1. 사용자가 애플리케이션 구현 시작을 명시적으로 지시한다.
2. 기존 자동화 보호 acceptance criteria를 동의한다.
3. 외부 Supabase/Vercel project 생성 또는 비용 발생 전 권한을 확인한다.
4. 구현 branch와 배포 범위를 확정한다.

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

1. Git ancestry 판정, URL normalization, projection checksum과 RPC 호출을 담당하는 Phase B importer를 구현한다.
2. fixture 기반 correction·A→B→A·과거 날짜·전체 archive backfill 테스트를 통과시킨다.
3. GitHub Actions sync workflow에 concurrency와 safe retry/reconcile 경계를 추가한다.
4. 실제 Supabase runtime을 사용할 수 있게 되면 migration, 역할별 RLS와 account deletion cascade SQL 검증을 실행한다.
