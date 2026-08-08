-- Versioned identity registry ingestion and the single atomic Git packet import boundary.

create or replace function private.assert_service_role()
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  request_claims text;
  actor_role text;
begin
  request_claims := nullif(current_setting('request.jwt.claims', true), '');
  actor_role := case when request_claims is null then null else request_claims::jsonb ->> 'role' end;
  if coalesce(actor_role, session_user) <> 'service_role' then
    raise exception using errcode = '42501', message = 'service_role required';
  end if;
end;
$$;

create or replace function private.web_slug(value text)
returns text
language sql
immutable
strict
set search_path = ''
as $$
  select trim(both '-' from regexp_replace(lower(value), '[^a-z0-9]+', '-', 'g'));
$$;

create or replace function private.event_uid_for_key(value text)
returns uuid
language plpgsql
stable
strict
set search_path = ''
as $$
declare
  matched_count integer;
  resolved uuid;
begin
  select count(*), min(coalesce(merged_into_event_uid, event_uid)::text)::uuid
    into matched_count, resolved
  from private.event_identity_registry
  where canonical_key = value or aliases ? value;

  if matched_count <> 1 then
    raise exception using
      errcode = 'P0001',
      message = 'event identity is missing or ambiguous',
      detail = value;
  end if;
  return resolved;
end;
$$;

create or replace function private.source_uid_for_url(value text)
returns uuid
language plpgsql
stable
strict
set search_path = ''
as $$
declare
  matched_count integer;
  resolved uuid;
begin
  select count(*), min(coalesce(merged_into_source_uid, source_uid)::text)::uuid
    into matched_count, resolved
  from private.source_identity_registry
  where canonical_url = value or aliases ? value;

  if matched_count <> 1 then
    raise exception using
      errcode = 'P0001',
      message = 'source identity is missing or ambiguous',
      detail = value;
  end if;
  return resolved;
end;
$$;

create or replace function public.apply_identity_registry(
  p_event_registry jsonb,
  p_source_registry jsonb,
  p_source_commit_sha text,
  p_registry_checksum text,
  p_expected_registry_commit_sha text,
  p_expected_registry_checksum text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  item jsonb;
  applied_events integer := 0;
  applied_sources integer := 0;
  registry_state private.identity_registry_state%rowtype;
begin
  perform private.assert_service_role();
  perform pg_advisory_xact_lock(7341220260808);

  if p_source_commit_sha !~ '^[0-9a-f]{40}$'
     or p_registry_checksum !~ '^[0-9a-f]{64}$'
     or (p_expected_registry_commit_sha is null) <> (p_expected_registry_checksum is null)
     or p_expected_registry_commit_sha is not null and p_expected_registry_commit_sha !~ '^[0-9a-f]{40}$'
     or p_expected_registry_checksum is not null and p_expected_registry_checksum !~ '^[0-9a-f]{64}$' then
    raise exception using errcode = '22023', message = 'invalid registry provenance';
  end if;

  select * into registry_state
  from private.identity_registry_state
  where singleton
  for update;
  if found then
    if p_expected_registry_commit_sha is distinct from registry_state.source_commit_sha
       or p_expected_registry_checksum is distinct from registry_state.registry_checksum then
      return jsonb_build_object(
        'status', 'retry_registry_changed',
        'registry_commit_sha', registry_state.source_commit_sha,
        'registry_checksum', registry_state.registry_checksum
      );
    end if;
  elsif p_expected_registry_commit_sha is not null or p_expected_registry_checksum is not null then
    return jsonb_build_object('status', 'retry_registry_changed', 'registry_commit_sha', null, 'registry_checksum', null);
  end if;
  if p_event_registry ->> 'schema_version' <> '1.0'
     or jsonb_typeof(p_event_registry -> 'events') is distinct from 'array'
     or p_source_registry ->> 'schema_version' <> '1.0'
     or jsonb_typeof(p_source_registry -> 'sources') is distinct from 'array' then
    raise exception using errcode = '22023', message = 'unsupported identity registry';
  end if;

  if exists (
    with all_keys as (
      select entry ->> 'event_uid' uid, entry ->> 'canonical_key' key
      from jsonb_array_elements(p_event_registry -> 'events') entry
      union all
      select entry ->> 'event_uid', alias #>> '{}'
      from jsonb_array_elements(p_event_registry -> 'events') entry
      cross join lateral jsonb_array_elements(entry -> 'aliases') alias
    )
    select 1 from all_keys group by key having count(distinct uid) > 1
  ) then
    raise exception using errcode = '23505', message = 'event key collision in registry';
  end if;

  if exists (
    with all_urls as (
      select entry ->> 'source_uid' uid, entry ->> 'canonical_url' url
      from jsonb_array_elements(p_source_registry -> 'sources') entry
      union all
      select entry ->> 'source_uid', alias #>> '{}'
      from jsonb_array_elements(p_source_registry -> 'sources') entry
      cross join lateral jsonb_array_elements(entry -> 'aliases') alias
    )
    select 1 from all_urls group by url having count(distinct uid) > 1
  ) then
    raise exception using errcode = '23505', message = 'source URL collision in registry';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_event_registry -> 'events') entry
    left join lateral (
      select target
      from jsonb_array_elements(p_event_registry -> 'events') target
      where target ->> 'event_uid' = entry ->> 'merged_into_event_uid'
    ) target_match on true
    where nullif(entry ->> 'merged_into_event_uid', '') is not null
      and (target_match.target is null or nullif(target_match.target ->> 'merged_into_event_uid', '') is not null)
  ) then
    raise exception using errcode = '22023', message = 'event merge target is missing or chained';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_source_registry -> 'sources') entry
    left join lateral (
      select target
      from jsonb_array_elements(p_source_registry -> 'sources') target
      where target ->> 'source_uid' = entry ->> 'merged_into_source_uid'
    ) target_match on true
    where nullif(entry ->> 'merged_into_source_uid', '') is not null
      and (target_match.target is null or nullif(target_match.target ->> 'merged_into_source_uid', '') is not null)
  ) then
    raise exception using errcode = '22023', message = 'source merge target is missing or chained';
  end if;

  for item in select value from jsonb_array_elements(p_event_registry -> 'events') loop
    if (item ->> 'event_uid') is null or (item ->> 'canonical_key') is null then
      raise exception using errcode = '22023', message = 'invalid event registry entry';
    end if;
    insert into private.event_identity_registry (
      event_uid, canonical_key, aliases, merged_into_event_uid, reason,
      first_seen_date, source_commit_sha, registry_checksum
    ) values (
      (item ->> 'event_uid')::uuid,
      item ->> 'canonical_key',
      coalesce(item -> 'aliases', '[]'::jsonb),
      nullif(item ->> 'merged_into_event_uid', '')::uuid,
      item ->> 'reason',
      (item ->> 'first_seen_date')::date,
      p_source_commit_sha,
      p_registry_checksum
    )
    on conflict (event_uid) do update set
      canonical_key = excluded.canonical_key,
      aliases = excluded.aliases,
      merged_into_event_uid = excluded.merged_into_event_uid,
      reason = excluded.reason,
      first_seen_date = least(private.event_identity_registry.first_seen_date, excluded.first_seen_date),
      source_commit_sha = excluded.source_commit_sha,
      registry_checksum = excluded.registry_checksum,
      updated_at = now();
    applied_events := applied_events + 1;
  end loop;

  for item in select value from jsonb_array_elements(p_source_registry -> 'sources') loop
    if (item ->> 'source_uid') is null or (item ->> 'canonical_url') !~ '^https?://' then
      raise exception using errcode = '22023', message = 'invalid source registry entry';
    end if;
    insert into private.source_identity_registry (
      source_uid, canonical_url, aliases, provider, external_id,
      merged_into_source_uid, reason, source_commit_sha, registry_checksum
    ) values (
      (item ->> 'source_uid')::uuid,
      item ->> 'canonical_url',
      coalesce(item -> 'aliases', '[]'::jsonb),
      nullif(item ->> 'provider', ''),
      nullif(item ->> 'external_id', ''),
      nullif(item ->> 'merged_into_source_uid', '')::uuid,
      item ->> 'reason',
      p_source_commit_sha,
      p_registry_checksum
    )
    on conflict (source_uid) do update set
      canonical_url = excluded.canonical_url,
      aliases = excluded.aliases,
      provider = excluded.provider,
      external_id = excluded.external_id,
      merged_into_source_uid = excluded.merged_into_source_uid,
      reason = excluded.reason,
      source_commit_sha = excluded.source_commit_sha,
      registry_checksum = excluded.registry_checksum,
      updated_at = now();
    applied_sources := applied_sources + 1;
  end loop;

  -- Registries are complete, append-preserving snapshots. An omitted identity
  -- would make the advertised checksum disagree with rows still usable by the
  -- resolver, so reject the whole transaction instead of accepting stale state.
  if exists (
    select 1 from private.event_identity_registry
    where registry_checksum <> p_registry_checksum
  ) or exists (
    select 1 from private.source_identity_registry
    where registry_checksum <> p_registry_checksum
  ) then
    raise exception using errcode = '22023', message = 'identity registry cannot omit an existing identity';
  end if;

  insert into private.identity_registry_state (
    singleton, registry_checksum, source_commit_sha, applied_at
  ) values (true, p_registry_checksum, p_source_commit_sha, now())
  on conflict (singleton) do update set
    registry_checksum = excluded.registry_checksum,
    source_commit_sha = excluded.source_commit_sha,
    applied_at = excluded.applied_at;

  return jsonb_build_object('status', 'applied', 'events', applied_events, 'sources', applied_sources);
end;
$$;

create or replace function public.import_daily_packet(
  p_packet_path text,
  p_payload jsonb,
  p_source_commit_sha text,
  p_expected_cursor_sha text,
  p_source_revision bigint,
  p_raw_checksum text,
  p_identity_registry_checksum text,
  p_projection_input_checksum text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  cursor_row private.sync_cursors%rowtype;
  previous_projection_checksum text;
  briefing_uuid uuid;
  packet_date date;
  news_item jsonb;
  source_item jsonb;
  idea_item jsonb;
  resource_item jsonb;
  community_item jsonb;
  event_uuid uuid;
  source_uuid uuid;
  analysis_uuid uuid;
  opportunity_uuid uuid;
  resource_uuid uuid;
  topic_uuid uuid;
  analysis_version integer;
  news_order integer := 0;
  source_order integer;
  idea_order integer := 0;
  resource_order integer := 0;
  signal_order integer := 0;
  topic_value text;
  stable_value text;
  parsed_language public.analysis_language;
  old_event_ids uuid[] := '{}'::uuid[];
  affected_event_ids uuid[] := '{}'::uuid[];
  old_opportunity_ids uuid[] := '{}'::uuid[];
  affected_opportunity_ids uuid[] := '{}'::uuid[];
  old_resource_ids uuid[] := '{}'::uuid[];
  affected_resource_ids uuid[] := '{}'::uuid[];
  build_candidate jsonb;
  candidate_for_idea boolean;
begin
  perform private.assert_service_role();
  perform pg_advisory_xact_lock(7341220260808);

  if not exists (
    select 1 from private.identity_registry_state
    where singleton and registry_checksum = p_identity_registry_checksum
  ) then
    raise exception using errcode = '40001', message = 'identity registry changed; retry with the current registry';
  end if;

  if p_packet_path !~ '^data/daily/[0-9]{4}/[0-9]{4}-[0-9]{2}-[0-9]{2}\.json$'
     or p_source_commit_sha !~ '^[0-9a-f]{40}$'
     or p_raw_checksum !~ '^[0-9a-f]{64}$'
     or p_identity_registry_checksum !~ '^[0-9a-f]{64}$'
     or p_projection_input_checksum !~ '^[0-9a-f]{64}$'
     or p_source_revision is not null and p_source_revision < 0 then
    raise exception using errcode = '22023', message = 'invalid import provenance';
  end if;
  if p_payload ->> 'schema_version' <> '1.0'
     or (p_payload ->> 'status') not in ('complete', 'partial')
     or jsonb_typeof(p_payload -> 'news') is distinct from 'array'
     or jsonb_array_length(p_payload -> 'news') not between 3 and 5
     or jsonb_typeof(p_payload -> 'business_ideas') is distinct from 'array'
     or jsonb_array_length(p_payload -> 'business_ideas') > 3
     or jsonb_typeof(p_payload -> 'tools') is distinct from 'array'
     or jsonb_array_length(p_payload -> 'tools') > 4
     or jsonb_typeof(p_payload -> 'community') is distinct from 'array'
     or jsonb_array_length(p_payload -> 'community') > 5
     or jsonb_typeof(p_payload -> 'worth_reading') is distinct from 'array' then
    raise exception using errcode = '22023', message = 'unsupported or malformed daily packet';
  end if;
  if jsonb_array_length(p_payload -> 'worth_reading') <> 4
     or exists (
       select 1 from jsonb_array_elements(p_payload -> 'news') news
       where jsonb_typeof(news -> 'sources') is distinct from 'array'
          or jsonb_array_length(news -> 'sources') < 1
          or not exists (
            select 1 from jsonb_array_elements(news -> 'sources') source
            where source ->> 'url' = news ->> 'original_url'
          )
     ) then
    raise exception using errcode = '22023', message = 'daily packet source contract is invalid';
  end if;

  packet_date := (p_payload ->> 'date_kst')::date;
  if p_packet_path <> format('data/daily/%s/%s.json', extract(year from packet_date)::integer, packet_date) then
    raise exception using errcode = '22023', message = 'packet path/date mismatch';
  end if;

  select * into cursor_row
  from private.sync_cursors
  where packet_path = p_packet_path
  for update;

  if found then
    if p_expected_cursor_sha is distinct from cursor_row.authoritative_commit_sha then
      return jsonb_build_object('status', 'retry_cursor_changed', 'cursor_sha', cursor_row.authoritative_commit_sha);
    end if;
  elsif p_expected_cursor_sha is not null then
    return jsonb_build_object('status', 'retry_cursor_changed', 'cursor_sha', null);
  end if;

  -- Identity resolution must be complete and unambiguous before any projection row changes.
  perform private.event_uid_for_key(value ->> 'event_key')
  from jsonb_array_elements(p_payload -> 'news');
  perform private.source_uid_for_url(source_value ->> 'url')
  from jsonb_array_elements(p_payload -> 'news') news_value
  cross join lateral jsonb_array_elements(news_value -> 'sources') source_value;

  select projection_input_checksum into previous_projection_checksum
  from public.daily_briefings where date_kst = packet_date;

  if previous_projection_checksum = p_projection_input_checksum then
    update public.daily_briefings set
      source_commit_sha = p_source_commit_sha,
      source_revision = p_source_revision,
      imported_at = now()
    where date_kst = packet_date;

    insert into private.sync_cursors (
      packet_path, authoritative_commit_sha, authoritative_revision,
      authoritative_checksum, authoritative_projection_checksum
    ) values (
      p_packet_path, p_source_commit_sha, p_source_revision,
      p_raw_checksum, p_projection_input_checksum
    )
    on conflict (packet_path) do update set
      authoritative_commit_sha = excluded.authoritative_commit_sha,
      authoritative_revision = excluded.authoritative_revision,
      authoritative_checksum = excluded.authoritative_checksum,
      authoritative_projection_checksum = excluded.authoritative_projection_checksum,
      updated_at = now();

    insert into private.sync_run_items (
      packet_path, date_kst, checksum, identity_registry_checksum,
      projection_input_checksum, status, input_counts
    ) values (
      p_packet_path, packet_date, p_raw_checksum, p_identity_registry_checksum,
      p_projection_input_checksum, 'skipped',
      jsonb_build_object('news', jsonb_array_length(p_payload -> 'news'))
    );
    return jsonb_build_object('status', 'content_unchanged_revision_advanced', 'date_kst', packet_date);
  end if;

  insert into public.daily_briefings (
    date_kst, generated_at, status, publication_state, todays_insight, warnings,
    schema_version, source_data_path, source_report_path, source_commit_sha,
    source_revision, source_checksum, identity_registry_checksum, projection_input_checksum
  ) values (
    packet_date,
    (p_payload ->> 'generated_at')::timestamptz,
    (p_payload ->> 'status')::public.briefing_status,
    'published',
    p_payload ->> 'todays_insight',
    coalesce(p_payload -> 'warnings', '[]'::jsonb),
    p_payload ->> 'schema_version',
    p_packet_path,
    format('reports/%s/%s.md', extract(year from packet_date)::integer, packet_date),
    p_source_commit_sha,
    p_source_revision,
    p_raw_checksum,
    p_identity_registry_checksum,
    p_projection_input_checksum
  )
  on conflict (date_kst) do update set
    generated_at = excluded.generated_at,
    status = excluded.status,
    publication_state = excluded.publication_state,
    todays_insight = excluded.todays_insight,
    warnings = excluded.warnings,
    schema_version = excluded.schema_version,
    source_data_path = excluded.source_data_path,
    source_report_path = excluded.source_report_path,
    source_commit_sha = excluded.source_commit_sha,
    source_revision = excluded.source_revision,
    source_checksum = excluded.source_checksum,
    identity_registry_checksum = excluded.identity_registry_checksum,
    projection_input_checksum = excluded.projection_input_checksum,
    imported_at = now()
  returning id into briefing_uuid;

  select coalesce(array_agg(event_id), '{}'::uuid[]) into old_event_ids
  from public.daily_briefing_events where briefing_id = briefing_uuid;
  select coalesce(array_agg(opportunity_id), '{}'::uuid[]) into old_opportunity_ids
  from public.daily_briefing_opportunities where briefing_id = briefing_uuid;
  select coalesce(array_agg(resource_id), '{}'::uuid[]) into old_resource_ids
  from public.daily_briefing_resources where briefing_id = briefing_uuid;

  delete from public.event_source_occurrences where briefing_id = briefing_uuid;
  delete from public.daily_briefing_events where briefing_id = briefing_uuid;
  delete from public.daily_briefing_opportunities where briefing_id = briefing_uuid;
  delete from public.daily_briefing_resources where briefing_id = briefing_uuid;
  delete from public.trend_signals where briefing_id = briefing_uuid;

  for news_item in select value from jsonb_array_elements(p_payload -> 'news') loop
    event_uuid := private.event_uid_for_key(news_item ->> 'event_key');
    affected_event_ids := array_append(affected_event_ids, event_uuid);
    parsed_language := case when concat(news_item ->> 'title', news_item ->> 'one_line_summary') ~ '[가-힣]'
      then 'ko'::public.analysis_language else 'en'::public.analysis_language end;

    insert into public.events (
      id, canonical_event_key, slug, title_original, title_ko, one_line_summary_ko,
      importance, publication_state, first_seen_date, last_seen_date,
      current_source_commit_sha, current_source_revision, source_schema_version,
      merged_into_event_id
    )
    select
      event_uuid,
      registry.canonical_key,
      private.web_slug(registry.canonical_key),
      news_item ->> 'title',
      case when parsed_language = 'ko' then news_item ->> 'title' end,
      case when (news_item ->> 'one_line_summary') ~ '[가-힣]' then news_item ->> 'one_line_summary' end,
      (news_item ->> 'importance')::public.event_importance,
      'published', packet_date, packet_date,
      p_source_commit_sha, p_source_revision, p_payload ->> 'schema_version',
      registry.merged_into_event_uid
    from private.event_identity_registry registry
    where registry.event_uid = event_uuid
    on conflict (id) do update set
      canonical_event_key = excluded.canonical_event_key,
      title_original = case when excluded.last_seen_date >= public.events.last_seen_date then excluded.title_original else public.events.title_original end,
      title_ko = case when excluded.last_seen_date >= public.events.last_seen_date then excluded.title_ko else public.events.title_ko end,
      one_line_summary_ko = case when excluded.last_seen_date >= public.events.last_seen_date then excluded.one_line_summary_ko else public.events.one_line_summary_ko end,
      importance = case when excluded.last_seen_date >= public.events.last_seen_date then excluded.importance else public.events.importance end,
      publication_state = 'published',
      first_seen_date = least(public.events.first_seen_date, excluded.first_seen_date),
      last_seen_date = greatest(public.events.last_seen_date, excluded.last_seen_date),
      current_source_commit_sha = case when excluded.last_seen_date >= public.events.last_seen_date then excluded.current_source_commit_sha else public.events.current_source_commit_sha end,
      current_source_revision = case when excluded.last_seen_date >= public.events.last_seen_date then excluded.current_source_revision else public.events.current_source_revision end,
      source_schema_version = case when excluded.last_seen_date >= public.events.last_seen_date then excluded.source_schema_version else public.events.source_schema_version end,
      merged_into_event_id = excluded.merged_into_event_id;

    insert into public.event_keys (event_key, event_id, status, first_seen_date, last_seen_date, source_commit_sha, reason)
    select key_value, event_uuid,
      case when key_value = registry.canonical_key then 'canonical'::public.event_key_status else 'alias'::public.event_key_status end,
      registry.first_seen_date, packet_date, p_source_commit_sha, registry.reason
    from private.event_identity_registry registry
    cross join lateral (
      select registry.canonical_key key_value
      union all select alias #>> '{}' from jsonb_array_elements(registry.aliases) alias
    ) keys
    where registry.event_uid = event_uuid
    on conflict (event_key) do update set
      status = excluded.status,
      last_seen_date = greatest(public.event_keys.last_seen_date, excluded.last_seen_date),
      source_commit_sha = excluded.source_commit_sha,
      reason = excluded.reason
    where public.event_keys.event_id = excluded.event_id;

    if exists (
      select 1 from public.event_keys
      where event_key = news_item ->> 'event_key' and event_id <> event_uuid
    ) then
      raise exception using errcode = '23505', message = 'event key is already assigned to another Event';
    end if;
    insert into public.event_keys (
      event_key, event_id, status, first_seen_date, last_seen_date, source_commit_sha, reason
    ) values (
      news_item ->> 'event_key', event_uuid,
      case when news_item ->> 'event_key' = (select canonical_event_key from public.events where id = event_uuid)
        then 'canonical'::public.event_key_status else 'alias'::public.event_key_status end,
      packet_date, packet_date, p_source_commit_sha, 'Observed in canonical daily archive.'
    )
    on conflict (event_key) do update set
      last_seen_date = greatest(public.event_keys.last_seen_date, excluded.last_seen_date),
      source_commit_sha = excluded.source_commit_sha
    where public.event_keys.event_id = excluded.event_id;

    update public.event_analysis set is_current = false
    where event_id = event_uuid and language = parsed_language and is_current;
    select coalesce(max(version), 0) + 1 into analysis_version
    from public.event_analysis
    where event_id = event_uuid and briefing_id = briefing_uuid and language = parsed_language;

    insert into public.event_analysis (
      event_id, version, language, briefing_id, analysis_date, summary_raw,
      parse_status, fact, interpretation, signal, speculation, why_it_matters,
      outlook, business_opportunity, impact, industry_mood, is_current,
      generated_at, source_commit_sha, source_revision
    ) values (
      event_uuid, analysis_version, parsed_language, briefing_uuid, packet_date,
      news_item ->> 'summary',
      case
        when news_item ->> 'summary' ~* 'FACT:' and news_item ->> 'summary' ~* 'INTERPRETATION:'
          and news_item ->> 'summary' ~* 'SIGNAL:' and news_item ->> 'summary' ~* 'SPECULATION:' then 'parsed'
        when news_item ->> 'summary' ~* '(FACT|INTERPRETATION|SIGNAL|SPECULATION):' then 'partial'
        else 'unparsed'
      end::public.analysis_parse_status,
      nullif(substring(news_item ->> 'summary' from '(?is)FACT:\s*(.*?)(?=INTERPRETATION:|SIGNAL:|SPECULATION:|$)'), ''),
      nullif(substring(news_item ->> 'summary' from '(?is)INTERPRETATION:\s*(.*?)(?=SIGNAL:|SPECULATION:|$)'), ''),
      nullif(substring(news_item ->> 'summary' from '(?is)SIGNAL:\s*(.*?)(?=SPECULATION:|$)'), ''),
      nullif(substring(news_item ->> 'summary' from '(?is)SPECULATION:\s*(.*)$'), ''),
      news_item ->> 'why_it_matters', news_item ->> 'outlook',
      nullif(news_item ->> 'business_opportunity', ''), news_item ->> 'impact',
      coalesce(news_item -> 'industry_mood', '{}'::jsonb), true,
      (p_payload ->> 'generated_at')::timestamptz, p_source_commit_sha, p_source_revision
    ) returning id into analysis_uuid;

    insert into public.daily_briefing_events (
      briefing_id, event_id, display_order, analysis_id, title_original, title_ko,
      one_line_summary_ko, importance, source_commit_sha, source_revision
    ) values (
      briefing_uuid, event_uuid, news_order, analysis_uuid, news_item ->> 'title',
      case when parsed_language = 'ko' then news_item ->> 'title' end,
      case when (news_item ->> 'one_line_summary') ~ '[가-힣]' then news_item ->> 'one_line_summary' end,
      (news_item ->> 'importance')::public.event_importance,
      p_source_commit_sha, p_source_revision
    );

    source_order := 0;
    for source_item in select value from jsonb_array_elements(news_item -> 'sources') loop
      source_uuid := private.source_uid_for_url(source_item ->> 'url');
      insert into public.sources (
        id, source_type, authority, taxonomy_mapping_status, taxonomy_rule_version, title, publisher,
        published_at, published_date_text, provider, external_id, thumbnail_url, metadata
      )
      select source_uuid,
        coalesce(nullif(source_item ->> 'source_type', ''), 'other')::public.source_type,
        coalesce(nullif(source_item ->> 'authority', ''), 'unknown')::public.source_authority,
        coalesce(nullif(source_item ->> 'taxonomy_mapping_status', ''), 'unknown')::public.taxonomy_mapping_status,
        nullif(source_item ->> 'taxonomy_rule_version', ''),
        source_item ->> 'title', source_item ->> 'publisher',
        nullif(source_item ->> 'published_at_iso', '')::timestamptz,
        source_item ->> 'published_at',
        coalesce(nullif(source_item ->> 'provider', ''), provider),
        coalesce(nullif(source_item ->> 'external_id', ''), external_id),
        nullif(source_item ->> 'thumbnail_url', ''),
        jsonb_build_object('legacy_tier', source_item ->> 'tier')
      from private.source_identity_registry where source_uid = source_uuid
      on conflict (id) do update set
        source_type = case when excluded.taxonomy_mapping_status <> 'unknown' then excluded.source_type else public.sources.source_type end,
        authority = case when excluded.taxonomy_mapping_status <> 'unknown' then excluded.authority else public.sources.authority end,
        taxonomy_mapping_status = case when excluded.taxonomy_mapping_status <> 'unknown' then excluded.taxonomy_mapping_status else public.sources.taxonomy_mapping_status end,
        taxonomy_rule_version = case when excluded.taxonomy_mapping_status <> 'unknown' then excluded.taxonomy_rule_version else public.sources.taxonomy_rule_version end,
        title = excluded.title, publisher = excluded.publisher,
        published_at = coalesce(excluded.published_at, public.sources.published_at),
        published_date_text = excluded.published_date_text,
        provider = coalesce(excluded.provider, public.sources.provider),
        external_id = coalesce(excluded.external_id, public.sources.external_id),
        thumbnail_url = coalesce(excluded.thumbnail_url, public.sources.thumbnail_url),
        metadata = public.sources.metadata || excluded.metadata;

      update public.source_urls set is_current_canonical = false, url_kind = 'alternate'
      where source_id = source_uuid and is_current_canonical
        and normalized_url <> (
          select canonical_url from private.source_identity_registry where source_uid = source_uuid
        );
      if exists (
        select 1 from public.source_urls su
        join private.source_identity_registry registry on registry.source_uid = source_uuid
        where su.normalized_url = registry.canonical_url and su.source_id <> source_uuid
      ) then
        raise exception using errcode = '23505', message = 'canonical source URL collision';
      end if;
      insert into public.source_urls (
        source_id, raw_url, normalized_url, url_kind, is_current_canonical,
        first_seen_at, last_seen_at, source_commit_sha
      )
      select source_uuid, registry.canonical_url, registry.canonical_url,
        'canonical', true, (p_payload ->> 'generated_at')::timestamptz,
        (p_payload ->> 'generated_at')::timestamptz, p_source_commit_sha
      from private.source_identity_registry registry where registry.source_uid = source_uuid
      on conflict (normalized_url) do update set
        url_kind = 'canonical', is_current_canonical = true,
        last_seen_at = greatest(public.source_urls.last_seen_at, excluded.last_seen_at),
        source_commit_sha = excluded.source_commit_sha;

      if exists (
        select 1 from public.source_urls
        where normalized_url = source_item ->> 'url' and source_id <> source_uuid
      ) then
        raise exception using errcode = '23505', message = 'normalized source URL collision';
      end if;
      insert into public.source_urls (
        source_id, raw_url, normalized_url, url_kind, is_current_canonical,
        first_seen_at, last_seen_at, source_commit_sha
      )
      select source_uuid, coalesce(source_item ->> 'raw_url', source_item ->> 'url'), source_item ->> 'url',
        case when registry.canonical_url = source_item ->> 'url' then 'canonical'::public.source_url_kind else 'alternate'::public.source_url_kind end,
        registry.canonical_url = source_item ->> 'url',
        (p_payload ->> 'generated_at')::timestamptz,
        (p_payload ->> 'generated_at')::timestamptz,
        p_source_commit_sha
      from private.source_identity_registry registry where registry.source_uid = source_uuid
      on conflict (normalized_url) do update set
        raw_url = excluded.raw_url,
        last_seen_at = greatest(public.source_urls.last_seen_at, excluded.last_seen_at),
        source_commit_sha = excluded.source_commit_sha;

      insert into public.event_sources (event_id, source_id, first_seen_date, last_seen_date, source_commit_sha)
      values (event_uuid, source_uuid, packet_date, packet_date, p_source_commit_sha)
      on conflict (event_id, source_id) do update set
        first_seen_date = least(public.event_sources.first_seen_date, excluded.first_seen_date),
        last_seen_date = greatest(public.event_sources.last_seen_date, excluded.last_seen_date),
        source_commit_sha = excluded.source_commit_sha;

      insert into public.event_source_occurrences (
        briefing_id, event_id, source_id, verification_status, is_primary,
        display_order, key_quote, quote_translation, source_commit_sha, source_revision
      ) values (
        briefing_uuid, event_uuid, source_uuid,
        coalesce(nullif(source_item ->> 'verification_status', ''), 'unverified')::public.verification_status,
        source_item ->> 'url' = news_item ->> 'original_url', source_order,
        nullif(news_item ->> 'key_quote', ''), nullif(news_item ->> 'quote_translation', ''),
        p_source_commit_sha, p_source_revision
      );
      source_order := source_order + 1;
    end loop;

    for topic_value in select value #>> '{}' from jsonb_array_elements(news_item -> 'tags') loop
      stable_value := private.web_slug(topic_value);
      if stable_value = '' then
        stable_value := 'topic-' || substring(
          encode(extensions.digest(lower(btrim(topic_value)), 'sha256'), 'hex') from 1 for 16
        );
      end if;
      insert into public.topics (slug, name_ko, publication_state)
      values (stable_value, topic_value, 'published')
      on conflict (slug) do update set publication_state = 'published'
      returning id into topic_uuid;
      insert into public.event_topics (event_id, topic_id, is_primary)
      values (event_uuid, topic_uuid, false)
      on conflict (event_id, topic_id) do nothing;
    end loop;
    news_order := news_order + 1;
  end loop;

  build_candidate := p_payload -> 'build_candidate';
  for idea_item in select value from jsonb_array_elements(p_payload -> 'business_ideas') loop
    stable_value := encode(extensions.digest(
      packet_date::text || ':' || lower(btrim(idea_item ->> 'name')),
      'sha256'
    ), 'hex');
    insert into public.opportunities (
      stable_key, name, customer, problem, competitors, differentiation, mvp_2_weeks,
      difficulty, monetization, falsification, score, stars, potential,
      first_seen_date, last_seen_date, publication_state
    ) values (
      stable_value, idea_item ->> 'name', idea_item ->> 'customer', idea_item ->> 'problem',
      coalesce(idea_item -> 'competitors', '[]'::jsonb), idea_item ->> 'differentiation',
      idea_item ->> 'mvp_2_weeks', idea_item ->> 'difficulty', idea_item ->> 'monetization',
      idea_item ->> 'falsification', (idea_item ->> 'score')::numeric,
      (idea_item ->> 'stars')::smallint, (idea_item ->> 'potential')::public.opportunity_potential,
      packet_date, packet_date, 'published'
    )
    on conflict (stable_key) do update set
      name = excluded.name, customer = excluded.customer, problem = excluded.problem,
      competitors = excluded.competitors, differentiation = excluded.differentiation,
      mvp_2_weeks = excluded.mvp_2_weeks, difficulty = excluded.difficulty,
      monetization = excluded.monetization, falsification = excluded.falsification,
      score = excluded.score, stars = excluded.stars, potential = excluded.potential,
      first_seen_date = least(public.opportunities.first_seen_date, excluded.first_seen_date),
      last_seen_date = greatest(public.opportunities.last_seen_date, excluded.last_seen_date),
      publication_state = 'published'
    returning id into opportunity_uuid;
    affected_opportunity_ids := array_append(affected_opportunity_ids, opportunity_uuid);
    candidate_for_idea := build_candidate is not null
      and build_candidate <> 'null'::jsonb
      and build_candidate ->> 'idea_name' = idea_item ->> 'name';
    insert into public.daily_briefing_opportunities (
      briefing_id, opportunity_id, display_order, candidate_status,
      owner_action_required, candidate_score, name, customer, problem,
      differentiation, mvp_2_weeks, difficulty, monetization, falsification,
      score, stars, potential, source_commit_sha
    ) values (
      briefing_uuid, opportunity_uuid, idea_order,
      case when candidate_for_idea then 'waiting_for_owner' else 'none' end::public.candidate_status,
      candidate_for_idea,
      case when candidate_for_idea then (build_candidate ->> 'score')::numeric end,
      idea_item ->> 'name', idea_item ->> 'customer', idea_item ->> 'problem',
      idea_item ->> 'differentiation', idea_item ->> 'mvp_2_weeks',
      idea_item ->> 'difficulty', idea_item ->> 'monetization', idea_item ->> 'falsification',
      (idea_item ->> 'score')::numeric, (idea_item ->> 'stars')::smallint,
      (idea_item ->> 'potential')::public.opportunity_potential, p_source_commit_sha
    );
    idea_order := idea_order + 1;
  end loop;

  for resource_item in
    select value || jsonb_build_object('_section', 'tools') from jsonb_array_elements(p_payload -> 'tools')
    union all
    select value || jsonb_build_object('_section', 'worth_reading') from jsonb_array_elements(p_payload -> 'worth_reading')
  loop
    insert into public.resources (
      normalized_url, resource_type, title, url, stars, summary, why_relevant,
      metadata, publication_state
    ) values (
      resource_item ->> 'url',
      case
        when resource_item ->> '_section' = 'tools' then 'tool'
        when lower(resource_item ->> 'type') = 'github' then 'open_source'
        when lower(resource_item ->> 'type') = 'paper' then 'paper'
        when lower(resource_item ->> 'type') = 'youtube' then 'youtube'
        when lower(resource_item ->> 'type') = 'blog' then 'blog'
        else 'other'
      end::public.resource_type,
      coalesce(resource_item ->> 'title', resource_item ->> 'name'),
      resource_item ->> 'url',
      nullif(resource_item ->> 'stars', '')::smallint,
      resource_item ->> 'why_trending',
      coalesce(resource_item ->> 'why_read', resource_item ->> 'worth_trying', ''),
      jsonb_strip_nulls(jsonb_build_object('legacy_type', resource_item ->> 'type')),
      'published'
    )
    on conflict (normalized_url) do update set
      resource_type = excluded.resource_type, title = excluded.title, url = excluded.url,
      stars = excluded.stars, summary = excluded.summary, why_relevant = excluded.why_relevant,
      metadata = excluded.metadata, publication_state = 'published'
    returning id into resource_uuid;
    affected_resource_ids := array_append(affected_resource_ids, resource_uuid);
    insert into public.daily_briefing_resources (briefing_id, resource_id, section, display_order)
    values (briefing_uuid, resource_uuid, resource_item ->> '_section', resource_order);
    resource_order := resource_order + 1;
  end loop;

  for community_item in select value from jsonb_array_elements(p_payload -> 'community') loop
    insert into public.trend_signals (
      briefing_id, signal_type, label, summary, mood, source_url, display_order, metadata
    ) values (
      briefing_uuid, 'community', community_item ->> 'platform',
      community_item ->> 'one_line_summary', community_item ->> 'mood',
      community_item ->> 'url', signal_order, '{}'::jsonb
    );
    signal_order := signal_order + 1;
  end loop;

  affected_event_ids := (select coalesce(array_agg(distinct id), '{}'::uuid[])
    from unnest(old_event_ids || affected_event_ids) id);
  update public.event_analysis set is_current = false
  where event_id = any(affected_event_ids);
  update public.event_analysis ea set is_current = true
  where ea.id in (
    select distinct on (dbe.event_id, ea2.language) ea2.id
    from public.daily_briefing_events dbe
    join public.daily_briefings db on db.id = dbe.briefing_id
    join public.event_analysis ea2 on ea2.id = dbe.analysis_id
    where dbe.event_id = any(affected_event_ids)
    order by dbe.event_id, ea2.language, db.date_kst desc, db.source_revision desc nulls last, ea2.version desc
  );

  with bounds as (
    select dbe.event_id, min(db.date_kst) first_seen, max(db.date_kst) last_seen
    from public.daily_briefing_events dbe
    join public.daily_briefings db on db.id = dbe.briefing_id
    where dbe.event_id = any(affected_event_ids)
    group by dbe.event_id
  ), latest as (
    select distinct on (dbe.event_id)
      dbe.event_id, dbe.title_original, dbe.title_ko, dbe.one_line_summary_ko,
      dbe.importance, dbe.source_commit_sha, dbe.source_revision, db.schema_version
    from public.daily_briefing_events dbe
    join public.daily_briefings db on db.id = dbe.briefing_id
    where dbe.event_id = any(affected_event_ids)
    order by dbe.event_id, db.date_kst desc, db.source_revision desc nulls last
  )
  update public.events e set
    title_original = latest.title_original,
    title_ko = latest.title_ko,
    one_line_summary_ko = latest.one_line_summary_ko,
    importance = latest.importance,
    publication_state = 'published',
    first_seen_date = bounds.first_seen,
    last_seen_date = bounds.last_seen,
    current_source_commit_sha = latest.source_commit_sha,
    current_source_revision = latest.source_revision,
    source_schema_version = latest.schema_version
  from bounds join latest using (event_id)
  where e.id = bounds.event_id;
  update public.events e set publication_state = 'archived'
  where e.id = any(affected_event_ids)
    and not exists (select 1 from public.daily_briefing_events dbe where dbe.event_id = e.id);

  delete from public.event_sources es
  where es.event_id = any(affected_event_ids)
    and not exists (
      select 1 from public.event_source_occurrences eso
      where eso.event_id = es.event_id and eso.source_id = es.source_id
    );
  with bounds as (
    select eso.event_id, eso.source_id, min(db.date_kst) first_seen, max(db.date_kst) last_seen
    from public.event_source_occurrences eso
    join public.daily_briefings db on db.id = eso.briefing_id
    where eso.event_id = any(affected_event_ids)
    group by eso.event_id, eso.source_id
  )
  update public.event_sources es set
    first_seen_date = bounds.first_seen,
    last_seen_date = bounds.last_seen
  from bounds
  where es.event_id = bounds.event_id and es.source_id = bounds.source_id;

  affected_opportunity_ids := (select coalesce(array_agg(distinct id), '{}'::uuid[])
    from unnest(old_opportunity_ids || affected_opportunity_ids) id);
  with bounds as (
    select dbo.opportunity_id, min(db.date_kst) first_seen, max(db.date_kst) last_seen
    from public.daily_briefing_opportunities dbo
    join public.daily_briefings db on db.id = dbo.briefing_id
    where dbo.opportunity_id = any(affected_opportunity_ids)
    group by dbo.opportunity_id
  ), latest as (
    select distinct on (dbo.opportunity_id) dbo.*
    from public.daily_briefing_opportunities dbo
    join public.daily_briefings db on db.id = dbo.briefing_id
    where dbo.opportunity_id = any(affected_opportunity_ids)
    order by dbo.opportunity_id, db.date_kst desc
  )
  update public.opportunities o set
    name = latest.name, customer = latest.customer, problem = latest.problem,
    differentiation = latest.differentiation, mvp_2_weeks = latest.mvp_2_weeks,
    difficulty = latest.difficulty, monetization = latest.monetization,
    falsification = latest.falsification, score = latest.score, stars = latest.stars,
    potential = latest.potential, first_seen_date = bounds.first_seen,
    last_seen_date = bounds.last_seen, publication_state = 'published'
  from bounds join latest using (opportunity_id)
  where o.id = bounds.opportunity_id;
  update public.opportunities o set publication_state = 'archived'
  where o.id = any(affected_opportunity_ids)
    and not exists (select 1 from public.daily_briefing_opportunities dbo where dbo.opportunity_id = o.id);

  affected_resource_ids := (select coalesce(array_agg(distinct id), '{}'::uuid[])
    from unnest(old_resource_ids || affected_resource_ids) id);
  update public.resources r set publication_state = case when exists (
    select 1 from public.daily_briefing_resources dbr where dbr.resource_id = r.id
  ) then 'published'::public.publication_state else 'archived'::public.publication_state end
  where r.id = any(affected_resource_ids);

  -- Existing merged Event rows remain addressable for route redirects while all
  -- canonical content and future occurrences resolve to the merge target UUID.
  update public.events e set
    merged_into_event_id = registry.merged_into_event_uid,
    publication_state = 'archived'
  from private.event_identity_registry registry
  join public.events target on target.id = registry.merged_into_event_uid
  where e.id = registry.event_uid
    and registry.merged_into_event_uid is not null;

  update public.events e set
    merged_into_event_id = null,
    publication_state = case when exists (
      select 1 from public.daily_briefing_events dbe where dbe.event_id = e.id
    ) then 'published'::public.publication_state else 'archived'::public.publication_state end
  from private.event_identity_registry registry
  where e.id = registry.event_uid
    and registry.merged_into_event_uid is null
    and e.merged_into_event_id is not null;

  insert into private.sync_cursors (
    packet_path, authoritative_commit_sha, authoritative_revision,
    authoritative_checksum, authoritative_projection_checksum
  ) values (
    p_packet_path, p_source_commit_sha, p_source_revision,
    p_raw_checksum, p_projection_input_checksum
  )
  on conflict (packet_path) do update set
    authoritative_commit_sha = excluded.authoritative_commit_sha,
    authoritative_revision = excluded.authoritative_revision,
    authoritative_checksum = excluded.authoritative_checksum,
    authoritative_projection_checksum = excluded.authoritative_projection_checksum,
    updated_at = now();

  insert into private.sync_run_items (
    packet_path, date_kst, checksum, identity_registry_checksum,
    projection_input_checksum, status, input_counts, output_counts
  ) values (
    p_packet_path, packet_date, p_raw_checksum, p_identity_registry_checksum,
    p_projection_input_checksum, 'succeeded',
    jsonb_build_object(
      'news', jsonb_array_length(p_payload -> 'news'),
      'opportunities', jsonb_array_length(p_payload -> 'business_ideas')
    ),
    jsonb_build_object('briefing_id', briefing_uuid)
  )
  on conflict (packet_path, projection_input_checksum) where status = 'succeeded'
  do nothing;

  return jsonb_build_object(
    'status', 'succeeded', 'briefing_id', briefing_uuid, 'date_kst', packet_date,
    'events', news_order, 'opportunities', idea_order,
    'resources', resource_order, 'signals', signal_order
  );
end;
$$;

create or replace function public.get_sync_cursor(p_packet_path text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  cursor_value private.sync_cursors%rowtype;
begin
  perform private.assert_service_role();
  if p_packet_path !~ '^data/daily/[0-9]{4}/[0-9]{4}-[0-9]{2}-[0-9]{2}\.json$' then
    raise exception using errcode = '22023', message = 'invalid packet path';
  end if;

  select * into cursor_value
  from private.sync_cursors
  where packet_path = p_packet_path;

  if not found then
    return null;
  end if;
  return jsonb_build_object(
    'packet_path', cursor_value.packet_path,
    'authoritative_commit_sha', cursor_value.authoritative_commit_sha,
    'authoritative_revision', cursor_value.authoritative_revision,
    'authoritative_checksum', cursor_value.authoritative_checksum,
    'authoritative_projection_checksum', cursor_value.authoritative_projection_checksum,
    'updated_at', cursor_value.updated_at
  );
end;
$$;

create or replace function public.get_identity_registry_state()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  registry_state private.identity_registry_state%rowtype;
begin
  perform private.assert_service_role();
  select * into registry_state from private.identity_registry_state where singleton;
  if not found then
    return null;
  end if;
  return jsonb_build_object(
    'registry_checksum', registry_state.registry_checksum,
    'source_commit_sha', registry_state.source_commit_sha,
    'applied_at', registry_state.applied_at
  );
end;
$$;

revoke all on function public.apply_identity_registry(jsonb, jsonb, text, text, text, text)
  from public, anon, authenticated;
revoke all on function public.import_daily_packet(text, jsonb, text, text, bigint, text, text, text)
  from public, anon, authenticated;
revoke all on function public.get_sync_cursor(text)
  from public, anon, authenticated;
revoke all on function public.get_identity_registry_state()
  from public, anon, authenticated;
grant execute on function public.apply_identity_registry(jsonb, jsonb, text, text, text, text)
  to service_role;
grant execute on function public.import_daily_packet(text, jsonb, text, text, bigint, text, text, text)
  to service_role;
grant execute on function public.get_sync_cursor(text)
  to service_role;
grant execute on function public.get_identity_registry_state()
  to service_role;

revoke all on function private.assert_service_role() from public, anon, authenticated;
revoke all on function private.web_slug(text) from public, anon, authenticated;
revoke all on function private.event_uid_for_key(text) from public, anon, authenticated;
revoke all on function private.source_uid_for_url(text) from public, anon, authenticated;
