# Web V1.3 Reader Content — implementation review

Status: implementation and automated verification complete; **Preview deployment and actual browser reading QA blocked**. This is not a Production-ready completion claim.

## 1. Researcher baseline

Researcher commit: `1372da7cce8d12ec7d5f0c22b0e8b61219510adf`.
Web V1.2 base: `4ac9bfcc72954b1ea38d9a0cbce7ea6f561edfc3`.
The user supplied `[RESEARCHER_COMMIT]` as a placeholder. The available pinned Researcher draft still calls two fields `why_it_matters/outlook`. The latest user contract explicitly supersedes those names with `takeaway/what_to_watch` and makes both nullable.

The three QA packets here (September 20, 21, 23; 13 events) explicitly rename only those keys. Every string, null, source, analysis and other packet field is identical to the pinned Researcher packet. This is an isolated fixture adjustment, not runtime aliasing, copy editing or archive migration. Old draft readers fail schema/import validation and fall back wholly to Legacy in Web. Production Daily files and Researcher instructions were not edited.

## 2. Reader DB storage

Nullable `daily_briefing_events.reader jsonb`, scoped to Briefing×Event. No global Reader on `events`. JSONB retains values/nulls/text exactly, including paragraph boundaries; serialized object key order is not a content guarantee. Existing public read RLS applies. No new user table or write permission.

## 3. Importer

Explicit `ReaderContent`/`DailyNews.reader`, runtime contract validation, full snapshot mapping. Existing atomic RPC wrapped with accepted-result-only occurrence update. Private previous RPC cannot be called by anon/authenticated/service_role. Mapper bumped to `daily-projection-v1.3` so backfill is not skipped by old checksums. Reader-less corrections clear only that date; stale CAS requests do not write.

## 4. DTO

`ReaderContentDto`: version, headline, dek, body, nullable takeaway/whatToWatch/action. `EventDto.reader` is explicitly nullable. Both archive and Supabase adapters use one strict parser, preserve string bytes, and take Reader only from the selected occurrence.

## 5. Modes

Exactly seven keys, version 1.3, nonblank required strings, valid nullable fields => Reader. Missing, partial, old-draft or invalid payload => Legacy as a whole. No per-field fallback or generated copy.

## 6. Today

Reader headline/dek only, with no Reader dek clipping; Legacy title/oneLineSummary retained. No empty Opportunity section. Technical labels changed to news/source language.

## 7. Detail

Serif headline, aligned reading width, sans-serif article body without a card, `\n\n` paragraph boundaries. Optional quiet takeaway/watch/action sections. Closed native `AI 분석 더 보기` retains all four analysis fields and legacy why/outlook. Sources last. Metadata and image alt use the same Reader set. Dated routes display the requested date.

## 8. Duplicate paths removed

Reader default flow does not mount OriginalContent or default legacy analysis/why/outlook. Legacy no longer mounts OriginalContent, since it was derived solely from already-displayed summary/FACT. FACT stays in the existing responsive analysis component (one visible presentation per viewport). Internal fields remain in DTO/storage. Detail no longer treats arbitrary `business_opportunity` prose, including rejection reasons, as an eligible opportunity. There is no populated structured Event→eligible Opportunity mapping in the current importer; none is inferred.

## 9. Snapshot verification

Actual archive/Supabase adapter tests: A date => A Reader; B date => B Reader; generic => latest date even when A has higher revision; latest missing Reader => Legacy, not older Reader. SQL execution additionally verifies idempotent reimport, deterministic clean rebuild, null correction isolation, malformed RPC rollback and stale CAS refusal.

## 10. Actual reading/browser QA

**Not completed.** Browser cannot open local `127.0.0.1:3000` (`ERR_BLOCKED_BY_CLIENT`). Vercel dashboard redirects to login; no deployment connector/authenticated CLI is available. No substitute static render is claimed as a real-page read.

Pending: Desktop 1440, tablet 768, mobile 390; read at least four Reader stories end to end, check repeated meaning, paragraph flow, takeaway/watch distinction, no horizontal overflow, disclosure keyboard interaction and console errors. Suggested specimens: September 23 Alibaba, Meta Muse, Google/Irregular, and the Australia copyright article (use actual packet keys). Also inspect a legacy August 7 story and A/B/latest snapshot fixture.

## 11–14. Automated verification

- Importer: 19 tests passed, including schema/nullable/invalid/legacy and all 13 Reader specimens.
- Web: 65 tests passed, including actual rendered Reader/Legacy markup, 8 nullable combinations, Today, date links, and both adapters.
- SQL: all repository migrations executed in disposable PGlite 0.5.8 PostgreSQL WASM with pgcrypto. Existing `schema_contract.sql` and `rls_integration.sql` passed, including role isolation/account deletion cascade. Auth schema/uid is a minimal local stub: this does **not** replace hosted Supabase/PostgREST integration verification.
- `pnpm lint`, `pnpm typecheck`, `pnpm build`: passed.
- `git diff --check`: passed.

Reproduce SQL after importer build:

```sh
npm install --prefix /tmp/reader-db-qa @electric-sql/pglite@0.5.8
PGLITE_ROOT=/tmp/reader-db-qa/node_modules/@electric-sql/pglite node supabase/tests/reader-integration.mjs
```

## 15–17. Delivery

Preview URL: **not created** (Vercel authentication required).
Branch: `agent/web-v1.3-reader-content`.
Commit SHA: see the commit containing this report and the handoff message.

## 18. Before Production

1. Confirm a final Researcher commit using the seven-key contract; the supplied placeholder has not identified one.
2. Authenticate the existing Vercel Preview project. Apply migration only to the isolated Preview Supabase and import a pinned branch snapshot. Exercise hosted RPC/RLS and rebuild there.
3. Load the isolated Reader fixture packets into Preview only, retaining old dates for Legacy checks. Do not copy QA packets into main or enable production scheduling.
4. Run all viewport and four-story reading QA, record findings/screenshots and fix any issues before approval.
5. Obtain user approval before main merge, Production DB migration/deploy or automation changes.

No main merge, Production DB/deployment, scheduled-task or Notion change was performed.
