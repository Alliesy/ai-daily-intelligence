# Supabase foundation

Migrations in `migrations/` create the rebuildable content projection, private
sync state, user-owned tables, RLS policies, the Auth profile trigger, and two
service-role-only RPC boundaries:

- `apply_identity_registry(...)` applies the schema-validated Git identity
  registries before packet import. The files are complete, append-preserving
  snapshots: removing a previously accepted identity is rejected.
- `import_daily_packet(...)` validates and atomically projects one canonical
  daily packet while enforcing the advisory lock, live registry checksum, and
  per-path cursor CAS.

The service role must only be used by the server-side sync process. Browser and
session-aware Supabase clients must never receive or reuse that credential. It
receives execute permission on the two RPCs, not direct write permission on
public content or personal tables.

Local verification after a Supabase CLI project is available:

```text
supabase db reset
psql "$LOCAL_DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/schema_contract.sql
node supabase/tests/verify-foundation.mjs
```

The Node contract test is credential-free. The SQL contract test requires a
local Supabase stack because it checks Supabase roles and `auth.users`-related
objects.
