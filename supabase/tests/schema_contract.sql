-- Run after `supabase db reset` in a local Supabase stack.
-- These checks are intentionally read-only and abort on a security regression.

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'daily_briefings', 'events', 'event_keys', 'event_analysis', 'sources',
    'source_urls', 'event_sources', 'event_source_occurrences', 'topics',
    'event_topics', 'entities', 'event_entities', 'daily_briefing_events',
    'opportunities', 'daily_briefing_opportunities', 'opportunity_events',
    'resources', 'daily_briefing_resources', 'trend_signals', 'profiles',
    'reactions', 'bookmarks', 'follows'
  ] loop
    if not exists (
      select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relname = table_name and c.relrowsecurity
    ) then
      raise exception 'RLS is not enabled on public.%', table_name;
    end if;
  end loop;

  if has_function_privilege('anon', 'public.import_daily_packet(text,jsonb,text,text,bigint,text,text,text)', 'EXECUTE')
     or has_function_privilege('authenticated', 'public.import_daily_packet(text,jsonb,text,text,bigint,text,text,text)', 'EXECUTE')
     or exists (
       select 1 from pg_proc p
       cross join lateral aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) acl
       where p.oid = 'public.import_daily_packet(text,jsonb,text,text,bigint,text,text,text)'::regprocedure
         and acl.grantee = 0 and acl.privilege_type = 'EXECUTE'
     ) then
    raise exception 'import_daily_packet is executable by an unprivileged role';
  end if;

  if has_function_privilege('anon', 'public.apply_identity_registry(jsonb,jsonb,text,text,text,text)', 'EXECUTE')
     or has_function_privilege('authenticated', 'public.apply_identity_registry(jsonb,jsonb,text,text,text,text)', 'EXECUTE')
     or exists (
       select 1 from pg_proc p
       cross join lateral aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) acl
       where p.oid = 'public.apply_identity_registry(jsonb,jsonb,text,text,text,text)'::regprocedure
         and acl.grantee = 0 and acl.privilege_type = 'EXECUTE'
     ) then
    raise exception 'apply_identity_registry is executable by an unprivileged role';
  end if;

  if not has_function_privilege('service_role', 'public.import_daily_packet(text,jsonb,text,text,bigint,text,text,text)', 'EXECUTE') then
    raise exception 'service_role cannot execute import_daily_packet';
  end if;

  if has_function_privilege('anon', 'public.get_sync_cursor(text)', 'EXECUTE')
     or has_function_privilege('authenticated', 'public.get_sync_cursor(text)', 'EXECUTE')
     or exists (
       select 1 from pg_proc p
       cross join lateral aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) acl
       where p.oid = 'public.get_sync_cursor(text)'::regprocedure
         and acl.grantee = 0 and acl.privilege_type = 'EXECUTE'
     ) then
    raise exception 'get_sync_cursor is executable by an unprivileged role';
  end if;

  if has_function_privilege('anon', 'public.get_identity_registry_state()', 'EXECUTE')
     or has_function_privilege('authenticated', 'public.get_identity_registry_state()', 'EXECUTE')
     or exists (
       select 1 from pg_proc p
       cross join lateral aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) acl
       where p.oid = 'public.get_identity_registry_state()'::regprocedure
         and acl.grantee = 0 and acl.privilege_type = 'EXECUTE'
     ) then
    raise exception 'get_identity_registry_state is executable by an unprivileged role';
  end if;

  if has_table_privilege('anon', 'public.event_keys', 'SELECT')
     or has_table_privilege('authenticated', 'public.event_keys', 'SELECT') then
    raise exception 'event_keys must not be directly exposed';
  end if;

  if has_table_privilege('authenticated', 'public.profiles', 'DELETE') then
    raise exception 'profiles must only be deleted through auth.users cascade';
  end if;

  if has_table_privilege('service_role', 'public.reactions', 'INSERT')
     or has_table_privilege('service_role', 'public.bookmarks', 'DELETE')
     or has_table_privilege('service_role', 'public.follows', 'UPDATE') then
    raise exception 'service_role must not bypass the atomic RPC boundary for personal tables';
  end if;

  if has_schema_privilege('anon', 'private', 'USAGE')
     or has_schema_privilege('authenticated', 'private', 'USAGE') then
    raise exception 'private schema is exposed';
  end if;
end;
$$;
