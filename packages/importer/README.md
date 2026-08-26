# Git → Supabase importer

이 package는 Git main의 immutable daily snapshot과 identity registry를 검증해 Supabase content projection RPC로 전달한다. 기존 AI Researcher나 daily schema를 수정하지 않는다.

## Commands

```text
pnpm --filter @ai-daily/importer test
pnpm --filter @ai-daily/importer build
node packages/importer/dist/cli.js --mode dry-run --commit <sha> --remote-main <sha> --repo-root <path>
```

`incremental`과 `backfill` write mode에는 server-side `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`가 필요하다. `dry-run`은 secret 없이 전체 archive snapshot을 검증한다. GitHub main workflow는 누락된 pending run도 최신 snapshot이 흡수하도록 `backfill`을 사용한다. 서비스 키는 마지막 sync step에만 주입되며 브라우저 bundle이나 dry-run에는 전달하지 않는다.

Importer는 network redirect를 따라가지 않는다. registry의 명시적 canonical/alias와 review된 provider 규칙만 적용하며 불확실한 Source는 `other/unknown/unknown/unverified`로 남긴다.
