# AI Daily Intelligence Decision Log

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
| D-008 | confirmed | Source authority는 source에, verification status는 event-source 관계에 저장한다. |
| D-009 | confirmed | 명시적 AI 점수가 없는 legacy Event에는 임의 점수를 만들지 않는다. |
| D-010 | confirmed | 사용자 reaction은 Event별 단일 row에 sentiment와 interested를 분리한다. |
| D-011 | confirmed | 결제, entitlement, 댓글, 컬렉션, 추천, 알림, 커뮤니티는 V1에서 제외한다. |
| D-012 | confirmed | Supabase write는 service-role 전용 atomic RPC로 제한한다. |
| D-013 | confirmed | 외부 이미지는 명시적 출처가 있을 때만 사용하고 무단 복제를 하지 않는다. |
| D-014 | confirmed | Opportunity–Event 관계는 명시적 근거 키가 있을 때만 생성한다. |
| D-015 | confirmed | Build-candidate 상태는 Opportunity 전역이 아니라 Briefing occurrence에 저장한다. |
| D-016 | confirmed | Legacy analysis 원문을 항상 보존하고 명확한 label만 구조화한다. |
| D-017 | confirmed | 공개 Event route는 내부 `event_key`가 아니라 별도 `slug`를 사용한다. |
| D-018 | confirmed | 공개 콘텐츠 우선이며 로그인은 개인 기능 사용 시에만 안내한다. |
| D-019 | confirmed | V1 로그인 provider는 Google OAuth 하나만 구현한다. |
| D-020 | confirmed | 신규 표시 콘텐츠는 한국어 기본, legacy 영어는 원문 fallback으로 처리한다. |
| D-021 | confirmed | AI 점수는 DB에 유지하되 V1 UI에는 S/A/B 중요도만 표시한다. |
| D-022 | confirmed | 대표 이미지는 검증 가능한 원문/공식 출처만 사용하고 AI 생성 이미지는 금지한다. |
| D-023 | confirmed | Partial Briefing도 비차단 경고와 함께 공개할 수 있다. |
| D-024 | confirmed | News Detail 상단 원문 CTA와 하단 전체 Source 목록을 제공한다. |
| D-025 | confirmed | 미래 기능의 확장 경계만 유지하고 V1 인프라를 선구축하지 않는다. |

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
- 결정: `apps/web`, `packages/intelligence-sync`, `supabase`를 새 영역으로 사용하고 기존 Python 자동화 경로를 보존한다.
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

- 상태: `confirmed`
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

- 상태: `confirmed`
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

- 상태: `confirmed`
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

## 미결정 사항

다음 항목은 아직 결정되지 않았다.

1. Source tier → authority/verification 매핑표
2. `event_key` 전역 identity 계약
3. Supabase/Vercel 리전, backup/PITR와 비용 한도
4. Google OAuth consent screen, 허용 계정 범위와 개인정보 처리 고지

새 결정을 추가할 때는 날짜, 상태, 근거, 대안, 이유, 영향과 재검토 조건을 포함한다. 기존 결정을 수정할 때는 원문을 삭제하지 않고 상태를 `superseded`로 변경한 뒤 새 Decision ID를 추가한다.
