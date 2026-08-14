# Git → Preview Supabase Sync Operations

## 목적

Cloud Scheduled Task의 책임은 기존과 동일하다.

1. AI Researcher와 Opportunity Finder가 당일 packet을 만든다.
2. Git Publisher가 `main`의 `data/daily/YYYY/YYYY-MM-DD.json`과 파생 문서를 한 번 commit한다.
3. Git 성공 후 Notion Latest를 갱신한다.

Supabase 동기화는 Scheduled Task 안에서 DB를 직접 호출하지 않는다. GitHub `main` push를 받은 별도 GitHub Actions workflow가 Git 정본 전체를 Preview content projection으로 재구성한다. Notion과 Supabase는 모두 Git에서 다시 만들 수 있는 소비 projection이다.

## 대상 환경

- Supabase project: `ai-daily-intelligence-preview`
- Project ref: `obqlzsnoavoxlqjrhsnl`
- Region: AWS Seoul
- GitHub Environment: `preview`
- Workflow: `.github/workflows/sync-supabase.yml`

Workflow는 `SUPABASE_URL`이 위 Preview ref와 정확히 일치하지 않으면 write 전에 실패한다. Production Supabase로의 자동 전환은 허용하지 않는다.

## GitHub 설정

Repository `Settings → Environments → New environment`에서 이름이 정확히 `preview`인 environment를 만든다. 다음 environment secret 두 개를 추가한다.

- `SUPABASE_URL`: Preview project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Preview project의 server-side service-role key

Secret 값은 Git, 문서, Action log, 대화에 기록하지 않는다. Environment에는 required reviewer를 설정하지 않는다. 설정하면 매일 sync마다 수동 승인이 필요하다. Deployment branch rule은 `main`만 허용하는 것을 권장한다.

## 최초 연결

1. 위 environment와 secret을 먼저 설정한다.
2. sync infrastructure PR을 **squash가 아닌 merge commit**으로 `main`에 merge한다. 이 PR의 history bridge parent는 기존 Preview watermark 계보를 보존한다.
3. merge push가 `packages/importer/**`와 workflow path를 포함하므로 `backfill`이 자동 실행된다.
4. GitHub Actions에서 `Sync Supabase content projection`이 성공했는지 확인한다.
5. Preview DB에서 최신 `daily_briefings`와 Event/Source/Opportunity/Resource/Signal projection을 확인한다.

PR 단계에서는 `Validate Supabase importer`가 secret 없이 전체 제안 snapshot을 dry-run한다. 이 검사가 실패하면 merge하지 않는다.

Preview의 최초 bootstrap watermark는 Web 작업 브랜치 commit에서 생성됐다. 현재 main과는 공통 조상 이후 갈라져 있으므로 squash/rebase merge는 ancestry 증거를 없애고 sync를 `diverged`로 중단시킨다. 파일 트리는 Web 앱을 포함하지 않되 기존 watermark commit을 두 번째 parent로 갖는 history bridge를 유지해야 한다. DB cursor 삭제나 importer ancestry 우회로 대체하지 않는다.

필요하면 Actions의 `Run workflow`에서 `backfill`을 선택해 전체 archive를 다시 투영할 수 있다. `dry-run`은 DB secret 없이 Git snapshot과 importer 계약만 검증한다.

## 일일 동작

`main`의 다음 경로가 바뀌면 sync가 자동 실행된다.

- `data/daily/**`
- `data/identity/**`
- `schema/**`
- `packages/importer/**`

모든 write run은 최신 main snapshot의 전체 archive를 스캔한다. 동일 commit은 skip되고, 오래된 실행이나 diverged revision은 cursor/registry CAS에서 중단된다.

## 실패 처리

- Git Publisher 실패: Notion과 Supabase 모두 진행하지 않는다.
- Supabase sync 실패: Git과 Notion 정본은 유지된다. Action을 수정하거나 secret을 복구한 뒤 `backfill`을 재실행한다.
- 같은 날짜 correction: Git의 correction commit이 새 main snapshot으로 다시 투영된다.
- DB 재구축: 새 Preview DB에 migration을 적용하고 전체 archive `backfill`을 실행한다. 사용자 소유 table은 content rebuild 대상이 아니다.

## 보안 경계

- service-role key는 `preview` GitHub Environment secret에만 둔다.
- 브라우저, Vercel public environment, Cloud Scheduled Task prompt에는 service-role key를 전달하지 않는다.
- importer는 public table 직접 write 대신 승인된 atomic RPC만 호출한다.
- Production, main의 기존 daily schema, AI Researcher, Notion Publisher의 동작은 이 연결로 변경하지 않는다.
