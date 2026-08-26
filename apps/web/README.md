# AI Daily Intelligence Web

Next.js V1 application. Public content is readable without authentication.

## Local preview

From the repository root:

```bash
pnpm install
pnpm dev
```

Without environment variables the app reads the canonical Git archive through the server-only archive adapter. Copy `.env.example` to `.env.local` and set the public Supabase values to test the projection and Google OAuth.

## Content source

- `CONTENT_SOURCE=archive`: credential-free Git archive preview
- `CONTENT_SOURCE=supabase`: public Supabase projection; missing URL/key fails closed
- unset: Supabase when both public values exist, otherwise archive

Never add `SUPABASE_SERVICE_ROLE_KEY` to the web application or Vercel environment. It belongs only to the isolated Git-to-Supabase sync job.

The Supabase Auth dashboard must enable Google and allow the exact callback URL `/auth/callback`. Production also requires `NEXT_PUBLIC_SITE_URL`.

## Checks

```bash
pnpm --filter @ai-daily/web test
pnpm --filter @ai-daily/web lint
pnpm --filter @ai-daily/web typecheck
pnpm --filter @ai-daily/web build
```
