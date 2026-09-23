-- Reader belongs to the Briefing x Event occurrence, never events.current.
alter table public.daily_briefing_events add column reader jsonb;

-- Preserve the established V1.1 transaction, CAS, lock and role checks.
alter function public.import_daily_packet(text, jsonb, text, text, bigint, text, text, text)
  set schema private;
alter function private.import_daily_packet(text, jsonb, text, text, bigint, text, text, text)
  rename to import_daily_packet_v11;
revoke all on function private.import_daily_packet_v11(text, jsonb, text, text, bigint, text, text, text)
  from public, anon, authenticated, service_role;

create function public.import_daily_packet(
  p_packet_path text, p_payload jsonb, p_source_commit_sha text,
  p_expected_cursor_sha text, p_source_revision bigint, p_raw_checksum text,
  p_identity_registry_checksum text, p_projection_input_checksum text
)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  result jsonb;
  item jsonb;
  copy jsonb;
  field text;
  briefing_uuid uuid;
begin
  perform private.assert_service_role();
  for item in select value from jsonb_array_elements(p_payload -> 'news') loop
    if not (item ? 'reader') then continue; end if;
    copy := item -> 'reader';
    if jsonb_typeof(copy) is distinct from 'object' then
      raise exception using errcode = '22023', message = 'invalid Reader snapshot';
    end if;
    if (select count(*) from jsonb_object_keys(copy)) <> 7
       or not (copy ?& array['version','headline','dek','body','takeaway','what_to_watch','action'])
       or copy ->> 'version' is distinct from '1.3' then
      raise exception using errcode = '22023', message = 'invalid Reader contract';
    end if;
    foreach field in array array['headline','dek','body','takeaway','what_to_watch','action'] loop
      if field in ('takeaway','what_to_watch','action') and copy -> field = 'null'::jsonb then continue; end if;
      if jsonb_typeof(copy -> field) is distinct from 'string'
         or (copy ->> field) !~ '[^[:space:]]' then
        raise exception using errcode = '22023', message = 'invalid Reader field';
      end if;
    end loop;
  end loop;

  result := private.import_daily_packet_v11(
    p_packet_path, p_payload, p_source_commit_sha, p_expected_cursor_sha,
    p_source_revision, p_raw_checksum, p_identity_registry_checksum, p_projection_input_checksum
  );
  -- Never write a rejected, stale or no-op payload past the core CAS decision.
  if result ->> 'status' not in ('succeeded', 'content_unchanged_revision_advanced') then return result; end if;
  select id into strict briefing_uuid from public.daily_briefings
    where date_kst = (p_payload ->> 'date_kst')::date;
  update public.daily_briefing_events occurrence set reader = news.item -> 'reader'
    from jsonb_array_elements(p_payload -> 'news') news(item)
    where occurrence.briefing_id = briefing_uuid
      and occurrence.event_id = private.event_uid_for_key(news.item ->> 'event_key');
  return result;
end;
$$;
revoke all on function public.import_daily_packet(text, jsonb, text, text, bigint, text, text, text)
  from public, anon, authenticated;
grant execute on function public.import_daily_packet(text, jsonb, text, text, bigint, text, text, text)
  to service_role;
