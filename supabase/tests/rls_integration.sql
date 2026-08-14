-- Run after the V1 migrations and at least one successful archive import.
-- This script exercises real anon/authenticated roles and rolls back every fixture.

begin;

insert into public.events (
  id, canonical_event_key, slug, title_original, importance, publication_state,
  first_seen_date, last_seen_date, current_source_commit_sha, source_schema_version
) values (
  '00000000-0000-4000-8000-000000000101',
  'preview-rls-draft-event',
  'preview-rls-draft-event',
  'Preview RLS draft fixture',
  'B',
  'draft',
  current_date,
  current_date,
  repeat('0', 40),
  'test'
);

insert into public.topics (id, slug, name_ko, publication_state)
values (
  '00000000-0000-4000-8000-000000000102',
  'preview-rls-topic',
  'Preview RLS Topic',
  'published'
);

insert into auth.users (
  id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  (
    '00000000-0000-4000-8000-000000000201',
    'authenticated', 'authenticated', 'preview-rls-a@example.invalid', '', now(),
    '{"provider":"google","providers":["google"]}'::jsonb, '{}'::jsonb, now(), now()
  ),
  (
    '00000000-0000-4000-8000-000000000202',
    'authenticated', 'authenticated', 'preview-rls-b@example.invalid', '', now(),
    '{"provider":"google","providers":["google"]}'::jsonb, '{}'::jsonb, now(), now()
  );

do $$
begin
  if (select count(*) from public.profiles where id in (
    '00000000-0000-4000-8000-000000000201',
    '00000000-0000-4000-8000-000000000202'
  )) <> 2 then
    raise exception 'auth.users trigger did not create both profiles';
  end if;
end;
$$;

insert into public.reactions (user_id, event_id, sentiment, interested)
select '00000000-0000-4000-8000-000000000202', id, 'dislike', false
from public.events where publication_state = 'published' order by id limit 1;
insert into public.bookmarks (user_id, event_id)
select '00000000-0000-4000-8000-000000000202', id
from public.events where publication_state = 'published' order by id limit 1;
insert into public.follows (user_id, topic_id)
values ('00000000-0000-4000-8000-000000000202', '00000000-0000-4000-8000-000000000102');

set local role anon;

do $$
begin
  if not exists (select 1 from public.events where publication_state = 'published') then
    raise exception 'anon cannot read imported published Events';
  end if;
  if exists (select 1 from public.events where id = '00000000-0000-4000-8000-000000000101') then
    raise exception 'anon can read a draft Event';
  end if;
end;
$$;

reset role;
select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-4000-8000-000000000201","role":"authenticated"}',
  true
);
set local role authenticated;

do $$
begin
  if (select count(*) from public.profiles) <> 1 then
    raise exception 'authenticated profile read is not isolated to auth.uid()';
  end if;
  if exists (select 1 from public.reactions where user_id = '00000000-0000-4000-8000-000000000202')
    or exists (select 1 from public.bookmarks where user_id = '00000000-0000-4000-8000-000000000202')
    or exists (select 1 from public.follows where user_id = '00000000-0000-4000-8000-000000000202') then
    raise exception 'authenticated user can read another user personal data';
  end if;
end;
$$;

update public.profiles set display_name = 'Preview user A'
where id = '00000000-0000-4000-8000-000000000201';

insert into public.reactions (user_id, event_id, sentiment, interested)
select '00000000-0000-4000-8000-000000000201', id, 'like', true
from public.events where publication_state = 'published' order by id limit 1;
insert into public.bookmarks (user_id, event_id)
select '00000000-0000-4000-8000-000000000201', id
from public.events where publication_state = 'published' order by id limit 1;
insert into public.follows (user_id, topic_id)
values ('00000000-0000-4000-8000-000000000201', '00000000-0000-4000-8000-000000000102');

do $$
declare
  affected_rows integer;
begin
  begin
    insert into public.bookmarks (user_id, event_id)
    select '00000000-0000-4000-8000-000000000202', id
    from public.events where publication_state = 'published' order by id desc limit 1;
    raise exception 'cross-user bookmark insert unexpectedly succeeded';
  exception
    when insufficient_privilege then null;
  end;

  update public.profiles set display_name = 'Cross-user update must be hidden'
  where id = '00000000-0000-4000-8000-000000000202';
  get diagnostics affected_rows = row_count;
  if affected_rows <> 0 then
    raise exception 'cross-user profile update unexpectedly succeeded';
  end if;

  update public.reactions set interested = true
  where user_id = '00000000-0000-4000-8000-000000000202';
  get diagnostics affected_rows = row_count;
  if affected_rows <> 0 then
    raise exception 'cross-user reaction update unexpectedly succeeded';
  end if;

  delete from public.bookmarks
  where user_id = '00000000-0000-4000-8000-000000000202';
  get diagnostics affected_rows = row_count;
  if affected_rows <> 0 then
    raise exception 'cross-user bookmark delete unexpectedly succeeded';
  end if;

  delete from public.follows
  where user_id = '00000000-0000-4000-8000-000000000202';
  get diagnostics affected_rows = row_count;
  if affected_rows <> 0 then
    raise exception 'cross-user follow delete unexpectedly succeeded';
  end if;

  if (select count(*) from public.reactions) <> 1
    or (select count(*) from public.bookmarks) <> 1
    or (select count(*) from public.follows) <> 1 then
    raise exception 'authenticated personal table reads are not isolated';
  end if;
end;
$$;

reset role;

do $$
begin
  if has_table_privilege('service_role', 'public.profiles', 'INSERT')
    or has_table_privilege('service_role', 'public.reactions', 'INSERT')
    or has_table_privilege('service_role', 'public.bookmarks', 'INSERT')
    or has_table_privilege('service_role', 'public.follows', 'INSERT') then
    raise exception 'service_role still has a direct personal-table write privilege';
  end if;
end;
$$;

delete from auth.users where id = '00000000-0000-4000-8000-000000000202';

do $$
begin
  if exists (select 1 from public.profiles where id = '00000000-0000-4000-8000-000000000202')
    or exists (select 1 from public.reactions where user_id = '00000000-0000-4000-8000-000000000202')
    or exists (select 1 from public.bookmarks where user_id = '00000000-0000-4000-8000-000000000202')
    or exists (select 1 from public.follows where user_id = '00000000-0000-4000-8000-000000000202') then
    raise exception 'auth.users deletion did not cascade through personal data';
  end if;
end;
$$;

rollback;
