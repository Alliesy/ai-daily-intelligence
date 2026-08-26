-- V1.1 additive Morning Paper and evidence snapshots.
-- The v1 daily archive remains valid; nullable columns preserve rebuilt legacy dates.

alter table public.daily_briefings
  add column insight_headline text,
  add column insight_summary text,
  add column insight_method text,
  add constraint daily_briefings_insight_snapshot_check check (
    (insight_headline is null and insight_summary is null and insight_method is null)
    or (
      nullif(btrim(insight_headline), '') is not null
      and nullif(btrim(insight_summary), '') is not null
      and insight_method = 'cross_event_signal_v1'
    )
  );

alter table public.daily_briefing_events
  add column insight_evidence_order integer check (insight_evidence_order is null or insight_evidence_order >= 0),
  add column top_event_order integer check (top_event_order is null or top_event_order between 0 and 2);

create unique index daily_briefing_events_insight_evidence_order_uidx
  on public.daily_briefing_events (briefing_id, insight_evidence_order)
  where insight_evidence_order is not null;
create unique index daily_briefing_events_top_event_order_uidx
  on public.daily_briefing_events (briefing_id, top_event_order)
  where top_event_order is not null;

alter table public.event_source_occurrences
  add column source_type_snapshot public.source_type,
  add column authority_snapshot public.source_authority,
  add column evidence_group text,
  add constraint event_source_occurrences_evidence_group_check check (
    evidence_group is null
    or evidence_group ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
  );

create index event_source_occurrences_evidence_group_idx
  on public.event_source_occurrences (briefing_id, evidence_group)
  where evidence_group is not null;

alter table public.daily_briefing_opportunities
  add column problem_evidence jsonb
    check (problem_evidence is null or jsonb_typeof(problem_evidence) = 'array'),
  add column realism_gates jsonb
    check (realism_gates is null or jsonb_typeof(realism_gates) = 'object'),
  add column today_eligible boolean,
  add column eligibility_method text,
  add constraint daily_briefing_opportunities_eligibility_check check (
    not today_eligible
    or (
      jsonb_array_length(problem_evidence) > 0
      and eligibility_method = 'opportunity_gate_v1'
      and realism_gates @> '{
        "customer":{"status":"pass"},
        "pain":{"status":"pass"},
        "existing_solution":{"status":"pass"},
        "technology_change":{"status":"pass"},
        "buildability":{"status":"pass"},
        "mvp":{"status":"pass"},
        "customer_access":{"status":"pass"},
        "replacement_risk":{"status":"pass"},
        "dependency":{"status":"pass"}
      }'::jsonb
      and nullif(btrim(realism_gates #>> '{customer,evidence}'), '') is not null
      and nullif(btrim(realism_gates #>> '{pain,evidence}'), '') is not null
      and nullif(btrim(realism_gates #>> '{existing_solution,evidence}'), '') is not null
      and nullif(btrim(realism_gates #>> '{technology_change,evidence}'), '') is not null
      and nullif(btrim(realism_gates #>> '{buildability,evidence}'), '') is not null
      and nullif(btrim(realism_gates #>> '{mvp,evidence}'), '') is not null
      and nullif(btrim(realism_gates #>> '{customer_access,evidence}'), '') is not null
      and nullif(btrim(realism_gates #>> '{replacement_risk,evidence}'), '') is not null
      and nullif(btrim(realism_gates #>> '{dependency,evidence}'), '') is not null
    )
  );

create unique index daily_briefing_opportunities_one_today_eligible_uidx
  on public.daily_briefing_opportunities (briefing_id)
  where today_eligible;

-- Preserve the public RPC signature while isolating the established v1 core.
alter function public.import_daily_packet(text, jsonb, text, text, bigint, text, text, text)
  set schema private;
alter function private.import_daily_packet(text, jsonb, text, text, bigint, text, text, text)
  rename to import_daily_packet_core;

revoke all on function private.import_daily_packet_core(text, jsonb, text, text, bigint, text, text, text)
  from public, anon, authenticated, service_role;

create function public.import_daily_packet(
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
  core_result jsonb;
  briefing_uuid uuid;
  packet_date date;
  morning_paper jsonb := p_payload -> 'morning_paper';
  eligible_count integer;
begin
  perform private.assert_service_role();

  if morning_paper is not null then
    if jsonb_typeof(morning_paper) <> 'object'
       or morning_paper ->> 'insight_method' <> 'cross_event_signal_v1'
       or nullif(btrim(morning_paper ->> 'insight_headline'), '') is null
       or nullif(btrim(morning_paper ->> 'insight_summary'), '') is null
       or jsonb_typeof(morning_paper -> 'evidence_event_keys') is distinct from 'array'
       or jsonb_typeof(morning_paper -> 'top_event_keys') is distinct from 'array'
       or jsonb_array_length(morning_paper -> 'evidence_event_keys') = 0
       or jsonb_array_length(morning_paper -> 'top_event_keys') > 3
       or (
         select count(*) <> count(distinct value)
         from jsonb_array_elements_text(morning_paper -> 'evidence_event_keys')
       )
       or (
         select count(*) <> count(distinct value)
         from jsonb_array_elements_text(morning_paper -> 'top_event_keys')
       )
       or exists (
         select 1
         from jsonb_array_elements_text(
           (morning_paper -> 'evidence_event_keys') || (morning_paper -> 'top_event_keys')
         ) requested(event_key)
         where not exists (
           select 1 from jsonb_array_elements(p_payload -> 'news') news
           where news ->> 'event_key' = requested.event_key
         )
       ) then
      raise exception using errcode = '22023', message = 'invalid Morning Paper snapshot';
    end if;
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_payload -> 'news') news
    cross join lateral jsonb_array_elements(news -> 'sources') source
    where (source ? 'source_type') <> (source ? 'authority')
       or (source ? 'source_type' and source ->> 'source_type' not in (
         'official_blog', 'article', 'youtube', 'x', 'github', 'paper',
         'documentation', 'reddit', 'hackernews', 'other'
       ))
       or (source ? 'authority' and source ->> 'authority' not in (
         'official', 'primary', 'independent', 'analysis', 'community', 'unknown'
       ))
       or (source ? 'verification_status' and source ->> 'verification_status' not in (
         'verified', 'corroborated', 'unverified', 'disputed'
       ))
  ) then
    raise exception using errcode = '22023', message = 'invalid explicit Source taxonomy';
  end if;

  select count(*) into eligible_count
  from jsonb_array_elements(p_payload -> 'business_ideas') idea
  where idea -> 'today_eligible' = 'true'::jsonb;
  if eligible_count > 1 then
    raise exception using errcode = '22023', message = 'at most one Opportunity may be eligible for Today';
  end if;
  if exists (
    select 1
    from jsonb_array_elements(p_payload -> 'business_ideas') idea
    where idea -> 'today_eligible' = 'true'::jsonb
      and (
        idea ->> 'eligibility_method' <> 'opportunity_gate_v1'
        or jsonb_typeof(idea -> 'problem_evidence') is distinct from 'array'
        or jsonb_array_length(idea -> 'problem_evidence') = 0
        or jsonb_typeof(idea -> 'realism_gates') is distinct from 'object'
        or exists (
          select 1
          from unnest(array[
            'customer', 'pain', 'existing_solution', 'technology_change', 'buildability',
            'mvp', 'customer_access', 'replacement_risk', 'dependency'
          ]) gate_key
          where idea #>> array['realism_gates', gate_key, 'status'] <> 'pass'
             or nullif(btrim(idea #>> array['realism_gates', gate_key, 'evidence']), '') is null
        )
      )
  ) then
    raise exception using errcode = '22023', message = 'Today Opportunity failed the realism gate contract';
  end if;

  core_result := private.import_daily_packet_core(
    p_packet_path, p_payload, p_source_commit_sha, p_expected_cursor_sha,
    p_source_revision, p_raw_checksum, p_identity_registry_checksum,
    p_projection_input_checksum
  );

  if core_result ->> 'status' not in ('succeeded', 'content_unchanged_revision_advanced') then
    return core_result;
  end if;

  packet_date := (p_payload ->> 'date_kst')::date;
  select id into strict briefing_uuid
  from public.daily_briefings
  where date_kst = packet_date;

  update public.daily_briefings set
    insight_headline = case when morning_paper is null then null else morning_paper ->> 'insight_headline' end,
    insight_summary = case when morning_paper is null then null else morning_paper ->> 'insight_summary' end,
    insight_method = case when morning_paper is null then null else morning_paper ->> 'insight_method' end
  where id = briefing_uuid;

  update public.daily_briefing_events set
    insight_evidence_order = null,
    top_event_order = null
  where briefing_id = briefing_uuid;

  if morning_paper is not null then
    update public.daily_briefing_events occurrence set
      insight_evidence_order = (requested.ordinality - 1)::integer
    from jsonb_array_elements_text(morning_paper -> 'evidence_event_keys')
      with ordinality requested(event_key, ordinality)
    where occurrence.briefing_id = briefing_uuid
      and occurrence.event_id = private.event_uid_for_key(requested.event_key);

    update public.daily_briefing_events occurrence set
      top_event_order = (requested.ordinality - 1)::integer
    from jsonb_array_elements_text(morning_paper -> 'top_event_keys')
      with ordinality requested(event_key, ordinality)
    where occurrence.briefing_id = briefing_uuid
      and occurrence.event_id = private.event_uid_for_key(requested.event_key);
  end if;

  update public.event_source_occurrences occurrence set
    source_type_snapshot = (source.item ->> 'source_type')::public.source_type,
    authority_snapshot = (source.item ->> 'authority')::public.source_authority,
    evidence_group = nullif(source.item ->> 'evidence_group', '')
  from jsonb_array_elements(p_payload -> 'news') news(item)
  cross join lateral jsonb_array_elements(news.item -> 'sources') source(item)
  where occurrence.briefing_id = briefing_uuid
    and occurrence.event_id = private.event_uid_for_key(news.item ->> 'event_key')
    and occurrence.source_id = private.source_uid_for_url(source.item ->> 'url');

  update public.daily_briefing_opportunities snapshot set
    problem_evidence = idea.item -> 'problem_evidence',
    realism_gates = idea.item -> 'realism_gates',
    today_eligible = (idea.item ->> 'today_eligible')::boolean,
    eligibility_method = nullif(idea.item ->> 'eligibility_method', '')
  from jsonb_array_elements(p_payload -> 'business_ideas') idea(item)
  join public.opportunities opportunity on opportunity.stable_key = encode(extensions.digest(
    packet_date::text || ':' || lower(btrim(idea.item ->> 'name')), 'sha256'
  ), 'hex')
  where snapshot.briefing_id = briefing_uuid
    and snapshot.opportunity_id = opportunity.id;

  return core_result;
end;
$$;

revoke all on function public.import_daily_packet(text, jsonb, text, text, bigint, text, text, text)
  from public, anon, authenticated;
grant execute on function public.import_daily_packet(text, jsonb, text, text, bigint, text, text, text)
  to service_role;
