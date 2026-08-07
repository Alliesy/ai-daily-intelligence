# Identity registries

These versioned registries make the Git archive sufficient to rebuild the
Supabase content projection without treating mutable external keys or URLs as
database identities.

- `event-aliases.json` assigns an immutable `event_uid` to every accepted Git
  `event_key` and records reviewed aliases or merges.
- `source-aliases.json` assigns an immutable `source_uid` to canonical URLs and
  records evidence-backed alternate URLs, provider IDs, or merges.

The initial entries are deterministic UUIDv5 values generated from each
entry's immutable `identity_seed` in the first canonical archive commit. Once
committed, both the seed and UID must never be regenerated. A later canonical
key or URL rename changes only the canonical/alias fields; it retains the
original seed and UID. Renames and merges require an explicit reason.
Conflicting keys or URLs must stop import for review; they must never trigger a
fuzzy or last-write-wins merge.

These files are inputs to the Web projection only. They do not change
`schema/daily.schema.json` or the AI Researcher output contract.
