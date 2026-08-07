# AI Daily Intelligence Web V1 — 구현 전 최종 기술 검토

> 검토일: 2026-08-07 (Asia/Seoul)
> 검토 대상: `V1_ARCHITECTURE.md`, `DB_SCHEMA.md`, `DECISIONS.md`, `IMPLEMENTATION_STATUS.md`, 현재 Git daily schema/data
> 범위: 설계 문서만 검토·수정. 애플리케이션, migration, workflow, 기존 자동화와 daily schema는 변경하지 않음.

## 최종 판정

**READY**

아래의 구현 차단 설계 문제를 발견했으나 이번 문서 변경에서 모두 구조적으로 해소했다. 현재 설계로 V1 구현을 시작할 수 있다. 다만 실제 migration/importer 구현은 이 문서의 충돌·보안·복구 test matrix를 통과해야 한다.

## 검토 결과 요약

| 영역 | 기존 문제 | 반영한 설계 | 상태 |
|---|---|---|---|
| Event identity | 의미 계약이 없는 `event_key` 단독 UNIQUE, 변경·충돌·merge 이력 부재 | immutable Event UUID, `event_keys`, Git identity registry, collision quarantine, reviewed merge redirect | 해소 |
| Source identity | normalized URL 단독 identity, provider별 URL/canonical/redirect 처리 부족 | Source UUID, `source_urls`, provider external ID, versioned normalization과 alias/canonical 이력 | 해소 |
| Source taxonomy | authority required인데 불확실한 안전 fallback 부재 | `authority=unknown`, `type=other`, `verification=unverified`, mapping provenance/version | 해소 |
| Git watermark | commit count를 권위 순서로 사용하여 history rewrite와 race 판정이 불완전 | cursor SHA→incoming SHA ancestry, `expected_cursor_sha` CAS, divergence 중단 | 해소 |
| Supabase 보안 | `PUBLIC EXECUTE`, definer view, SSR/service client 혼용 위험을 충분히 명시하지 않음 | service-role 전용 RPC façade, private 운영 table, 명시적 revoke/GRANT, security-invoker view, 전용 service client | 해소 |
| 로그인 | relative `next` 검증만으로 encoding/backslash 우회 여지 | Supabase-managed PKCE state, exact production callback, strict same-origin path 검증과 `/` fallback | 해소 |
| 데이터 복구 | content truncate가 Event FK를 가진 사용자 데이터 보존 요구와 충돌 | 신규 DB backfill과 운영 staging reconcile 분리, stable UUID upsert, user/auth delete 권한 제외 | 해소 |
| 다중 날짜 | Event current row와 Event×Source row가 과거 표시·검증 상태를 덮어씀 | Briefing×Event, Briefing×Event×Source, Briefing×Opportunity occurrence snapshot | 해소 |

## 1. Event identity

현재 Git schema는 `event_key`를 문자열로만 검증하며 장기 불변성이나 사건 전역 유일성을 보장하지 않는다. 따라서 DB의 영구 identity는 `events.id` UUID로 고정한다.

- 같은 key는 `event_keys`를 통해 같은 Event로 resolve한다.
- key 변경·alias·merge는 Git main의 schema-validated `data/identity/event-aliases.json`에 immutable `event_uid`와 사유를 기록한 경우에만 적용한다.
- 동일 key가 다른 UUID에 연결되는 충돌은 packet을 `needs_review`로 격리하고 기존 row를 변경하지 않는다.
- 제목·Source 유사도는 review 후보만 만들고 자동 merge하지 않는다.
- merge는 hard delete 대신 `merged_into_event_id`와 public redirect를 남겨 bookmark/reaction 연결을 보존한다.

이 구조는 같은 사건의 여러 날짜 재등장, 후속 보강, key rename, collision 및 rebuild를 모두 복구 가능하게 한다.

## 2. Source identity와 taxonomy

`sources.id`를 identity로 사용하고 URL은 별도 `source_urls` 이력으로 분리한다. raw URL을 보존하면서 normalized, canonical, alternate, redirect 관계를 관리한다.

- tracking parameter는 명시적 denylist만 제거하고 의미를 모르는 query는 유지한다.
- YouTube는 검증된 video ID, X는 status ID, GitHub는 repository/release/issue/PR/commit/blob resource 종류를 구분한다.
- 서로 다른 URL은 provider ID, 검증된 canonical, redirect 또는 Git registry 근거 없이 합치지 않는다.
- redirect 확인은 public HTTP(S), DNS/IP 재검증, private/link-local 차단, hop/timeout 제한을 적용한다.
- taxonomy가 불확실하면 `other`/`unknown`/`unverified`이며 공식성이나 검증 상태를 추정 승격하지 않는다.

## 3. Git revision watermark

GitHub Actions concurrency는 실행 순서를 보장하지 않으므로 workflow queue나 DB lock의 도착 순서에 의존하지 않는다. [GitHub 공식 문서](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency)도 concurrency group의 처리 순서는 보장되지 않는다고 명시한다.

권위 판정은 다음과 같다.

1. full history에서 stored cursor SHA, incoming SHA, current remote main SHA를 확보한다.
2. [`git merge-base --is-ancestor`](https://git-scm.com/docs/git-merge-base)로 commit 관계를 검증한다.
3. same SHA는 duplicate, cursor→incoming descendant는 수락, incoming→cursor ancestor는 stale skip한다.
4. diverged/force-push/shallow history는 자동 추측하지 않고 reconcile failure로 중단한다.
5. RPC는 global advisory lock 안에서 `expected_cursor_sha` CAS를 수행한다. cursor가 바뀌었으면 write 없이 재시도한다.
6. A→B→A처럼 checksum이 되돌아와도 accepted descendant SHA로 cursor를 먼저 전진한다.
7. `data/identity/**` 변경도 Web sync를 실행하며 packet, identity registry와 mapper version을 합친 projection input checksum이 달라지면 raw JSON이 같아도 재투영한다.

과거 날짜 correction은 해당 occurrence만 수정하며 최신 Event current projection은 날짜 우선, 같은 날짜에서는 accepted descendant 순서로만 갱신한다. 전체 rebuild는 하나의 immutable main snapshot에서 identity registry를 먼저 적용하고 날짜순으로 수행한다.

## 4. Supabase 보안

Supabase는 exposed schema table에 RLS를 요구하며 service key는 RLS를 우회할 수 있다. 또한 일반 view는 기본적으로 생성자 권한으로 RLS를 우회할 수 있으므로 security-invoker 또는 비노출 schema가 필요하다. [Supabase RLS 공식 문서](https://supabase.com/docs/guides/database/postgres/row-level-security)

확정한 통제는 다음과 같다.

- public table 전체에 RLS와 최소 GRANT를 함께 적용한다.
- content는 게시 row만 anon/authenticated SELECT, 일반 content write는 금지한다.
- reaction/bookmark/follow/profile은 `auth.uid()`와 `WITH CHECK`로 본인 row만 허용한다.
- import는 Data API에서 호출 가능한 좁은 public RPC façade로 두되 fixed search path와 schema-qualified object를 사용하고 `PUBLIC`, `anon`, `authenticated` EXECUTE를 revoke한다. 운영 table은 API 비노출 private schema에 둔다.
- service-role importer는 사용자 cookie를 읽는 SSR client와 분리하며 브라우저 bundle·로그에 secret을 넣지 않는다.
- public view는 `security_invoker`, materialized view/function은 별도 권한 누출 test를 적용한다.
- authenticated profile 직접 DELETE는 금지하고 재인증된 server-side flow의 `auth.users` 삭제 → profile → reaction/bookmark/follow cascade를 DB test로 검증한다.

## 5. 선택 로그인과 안전한 복귀

공개 route는 middleware가 session을 refresh하더라도 비로그인 사용자를 `/login`으로 redirect하지 않는다. 개인 기능을 직접 요청할 때만 Google OAuth를 안내한다.

- Supabase PKCE code exchange를 사용한다.
- production callback은 exact allowlist를 사용하고 wildcard는 preview에만 제한한다. [Supabase Redirect URL 공식 문서](https://supabase.com/docs/guides/auth/redirect-urls), [PKCE 공식 문서](https://supabase.com/docs/guides/auth/sessions/pkce-flow)
- Supabase가 PKCE state/code verifier를 관리한다. 애플리케이션 `next`는 권한이나 mutation을 담지 않는 상대 경로로 제한하고 callback에서 다시 검증한다.
- 반복 decoding 뒤 단일 `/` 시작 route만 허용하고 `//`, 역슬래시, scheme/host, 제어문자와 decoding 상한 초과를 거부한다.
- 검증 실패는 `/`로 fallback하며 OAuth 전 mutation은 자동 재실행하지 않는다.

## 6. 데이터 복구

복구 범위를 분리한다.

- 신규 DB: repo migrations + 고정 Git main snapshot의 daily archive + identity registry로 콘텐츠 projection을 재구축한다.
- 운영 DB: 별도 staging projection에 backfill·검증한 뒤 stable UUID로 reconcile/upsert하고 누락 콘텐츠는 archive한다. content table을 truncate하지 않는다.
- rebuild role은 Auth와 사용자 table에 delete/truncate 권한이 없다.
- Git만으로 복구되는 것은 콘텐츠다. Auth와 사용자 정본의 재난 복구는 Supabase backup/PITR가 담당한다.

따라서 콘텐츠 rebuild는 기존 reaction/bookmark/follow와 Event FK를 유지한다.

## 7. Event 다중 날짜

- Event 본체: UUID와 최신 표시 projection
- 날짜별 Analysis: Event×Briefing version
- 날짜별 표시: Briefing×Event occurrence snapshot
- Source 본체와 URL: 전역 identity 및 URL 이력
- 날짜별 Source 상태: Briefing×Event×Source occurrence
- Opportunity 본체: 장기 identity/current projection
- 날짜별 Opportunity 평가와 candidate: Briefing×Opportunity occurrence snapshot

과거 Briefing은 전역 current row가 아니라 해당 occurrence를 읽으므로 후속 보강이나 correction이 다른 날짜 기록을 덮어쓰지 않는다. 공개 RLS는 Briefing에서 실제 선택된 `analysis_id`만 노출하여 superseded 분석 version의 직접 조회도 차단한다.

Correction이 최신 occurrence를 제거하면 affected Event/Opportunity의 current, first/last seen과 `is_current` analysis를 남은 occurrence에서 transaction으로 재계산한다. 남은 published occurrence가 없으면 본체를 archive하여 stale current 콘텐츠가 공개되지 않게 한다.

## 남은 위험과 구현 gate

다음은 구조적 blocker는 아니지만 구현·운영 전에 검증해야 한다.

1. 실제 archive가 현재 소수 날짜이므로 다중 날짜, key 변경, correction fixture를 인공적으로 추가한 importer test가 필요하다.
2. Source taxonomy의 최초 confirmed provider/domain registry는 fixture와 함께 review해야 한다.
3. Supabase/Vercel region, 비용 한도, backup/PITR 수준은 외부 project 생성 전에 owner 승인이 필요하다.
4. Google consent screen, 허용 계정 범위와 개인정보 고지는 Auth 운영 전에 확정해야 한다.
5. account deletion과 backup restore는 staging 환경에서 실제 end-to-end 검증해야 한다.

## 다음 권장 작업

사용자 구현 승인이 있으면 다음 순서로 시작한다.

1. identity registry JSON schema와 legacy bootstrap fixture
2. Supabase migration 초안, RLS/GRANT/definer function DB tests
3. URL normalization 및 Git ancestry/CAS importer tests
4. 신규 DB backfill과 사용자 데이터 보존형 staging reconcile test
5. 그 후 공개 read-only Today/Event Detail 구현
