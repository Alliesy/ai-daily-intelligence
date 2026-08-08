-- AI Daily Intelligence Web V1 database foundation.
-- Git remains the canonical content archive; these tables are a rebuildable projection.

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create type public.event_importance as enum ('S', 'A', 'B');
create type public.publication_state as enum ('draft', 'published', 'archived', 'needs_review');
create type public.briefing_status as enum ('complete', 'partial');
create type public.analysis_language as enum ('ko', 'en');
create type public.analysis_parse_status as enum ('parsed', 'partial', 'unparsed');
create type public.opportunity_potential as enum ('Low', 'Medium', 'High', 'Very High');
create type public.candidate_status as enum ('none', 'waiting_for_owner', 'approved_for_design', 'rejected');
create type public.source_type as enum (
  'official_blog', 'article', 'youtube', 'x', 'github', 'paper',
  'documentation', 'reddit', 'hackernews', 'other'
);
create type public.source_authority as enum ('official', 'primary', 'independent', 'analysis', 'community', 'unknown');
create type public.verification_status as enum ('verified', 'corroborated', 'unverified', 'disputed');
create type public.taxonomy_mapping_status as enum ('confirmed', 'rule_mapped', 'unknown', 'needs_review');
create type public.source_url_kind as enum ('canonical', 'alternate', 'redirect', 'observed');
create type public.event_key_status as enum ('canonical', 'alias', 'deprecated');
create type public.reaction_sentiment as enum ('like', 'dislike');
create type public.resource_type as enum ('tool', 'open_source', 'paper', 'youtube', 'blog', 'documentation', 'other');
create type public.sync_status as enum ('running', 'succeeded', 'failed', 'skipped');

create table public.daily_briefings (
  id uuid primary key default extensions.gen_random_uuid(),
  date_kst date not null unique,
  generated_at timestamptz not null,
  status public.briefing_status not null,
  publication_state public.publication_state not null default 'draft',
  todays_insight text not null,
  warnings jsonb not null default '[]'::jsonb check (jsonb_typeof(warnings) = 'array'),
  schema_version text not null,
  source_data_path text not null,
  source_report_path text,
  source_commit_sha text not null check (source_commit_sha ~ '^[0-9a-f]{40}$'),
  source_revision bigint check (source_revision is null or source_revision >= 0),
  source_checksum text not null check (source_checksum ~ '^[0-9a-f]{64}$'),
  identity_registry_checksum text not null check (identity_registry_checksum ~ '^[0-9a-f]{64}$'),
  projection_input_checksum text not null check (projection_input_checksum ~ '^[0-9a-f]{64}$'),
  imported_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.sources (
  id uuid primary key,
  source_type public.source_type not null default 'other',
  authority public.source_authority not null default 'unknown',
  taxonomy_mapping_status public.taxonomy_mapping_status not null default 'unknown',
  taxonomy_rule_version text,
  title text not null,
  publisher text not null,
  author text,
  published_at timestamptz,
  published_date_text text,
  external_id text,
  provider text,
  thumbnail_url text,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index sources_provider_external_id_uidx
  on public.sources (provider, external_id)
  where provider is not null and external_id is not null;

create table public.events (
  id uuid primary key,
  canonical_event_key text not null unique check (length(btrim(canonical_event_key)) > 0),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title_original text not null,
  title_ko text,
  one_line_summary_ko text,
  importance public.event_importance not null,
  hero_image_url text,
  hero_image_source_id uuid,
  hero_image_attribution text,
  hero_image_alt_ko text,
  publication_state public.publication_state not null default 'draft',
  first_seen_date date not null,
  last_seen_date date not null,
  current_source_commit_sha text not null check (current_source_commit_sha ~ '^[0-9a-f]{40}$'),
  current_source_revision bigint check (current_source_revision is null or current_source_revision >= 0),
  source_schema_version text not null,
  merged_into_event_id uuid references public.events(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (first_seen_date <= last_seen_date),
  check (merged_into_event_id is null or merged_into_event_id <> id),
  check (
    hero_image_url is null
    or (hero_image_source_id is not null and nullif(btrim(hero_image_attribution), '') is not null)
  )
);

alter table public.events
  add constraint events_hero_image_source_fk
  foreign key (hero_image_source_id) references public.sources(id) on delete set null;

create table public.event_keys (
  event_key text primary key check (length(btrim(event_key)) > 0),
  event_id uuid not null references public.events(id) on delete restrict,
  status public.event_key_status not null,
  first_seen_date date not null,
  last_seen_date date not null,
  source_commit_sha text not null check (source_commit_sha ~ '^[0-9a-f]{40}$'),
  reason text,
  check (first_seen_date <= last_seen_date)
);

create table public.event_analysis (
  id uuid primary key default extensions.gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete restrict,
  version integer not null check (version > 0),
  language public.analysis_language not null default 'ko',
  briefing_id uuid not null references public.daily_briefings(id) on delete cascade,
  analysis_date date not null,
  summary_raw text not null,
  parse_status public.analysis_parse_status not null,
  fact text,
  interpretation text,
  signal text,
  speculation text,
  why_it_matters text not null,
  outlook text not null,
  business_opportunity text,
  impact text not null,
  industry_mood jsonb not null default '{}'::jsonb check (jsonb_typeof(industry_mood) = 'object'),
  ai_score numeric(3,2) check (ai_score is null or ai_score between 0 and 5),
  score_breakdown jsonb,
  score_method_version text,
  is_current boolean not null default false,
  generated_at timestamptz not null,
  source_commit_sha text not null check (source_commit_sha ~ '^[0-9a-f]{40}$'),
  source_revision bigint check (source_revision is null or source_revision >= 0),
  unique (event_id, briefing_id, version, language),
  unique (id, event_id, briefing_id),
  check (ai_score is null or nullif(btrim(score_method_version), '') is not null)
);

create unique index event_analysis_current_uidx
  on public.event_analysis (event_id, language) where is_current;

create table public.source_urls (
  id uuid primary key default extensions.gen_random_uuid(),
  source_id uuid not null references public.sources(id) on delete restrict,
  raw_url text not null check (raw_url ~ '^https?://'),
  normalized_url text not null unique check (normalized_url ~ '^https?://'),
  url_kind public.source_url_kind not null,
  is_current_canonical boolean not null default false,
  first_seen_at timestamptz not null,
  last_seen_at timestamptz not null,
  source_commit_sha text not null check (source_commit_sha ~ '^[0-9a-f]{40}$'),
  redirect_chain jsonb,
  check (first_seen_at <= last_seen_at),
  check (redirect_chain is null or jsonb_typeof(redirect_chain) = 'array')
);

create unique index source_urls_current_canonical_uidx
  on public.source_urls (source_id) where is_current_canonical;

create table public.topics (
  id uuid primary key default extensions.gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name_ko text not null,
  description text,
  publication_state public.publication_state not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.entities (
  id uuid primary key default extensions.gen_random_uuid(),
  entity_type text not null,
  canonical_name text not null,
  display_name_ko text,
  aliases jsonb not null default '[]'::jsonb check (jsonb_typeof(aliases) = 'array'),
  publication_state public.publication_state not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (entity_type, canonical_name)
);

create table public.daily_briefing_events (
  briefing_id uuid not null references public.daily_briefings(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete restrict,
  display_order integer not null check (display_order >= 0),
  analysis_id uuid not null,
  section text not null default 'top_news',
  title_original text not null,
  title_ko text,
  one_line_summary_ko text,
  importance public.event_importance not null,
  hero_image_source_id uuid references public.sources(id) on delete set null,
  hero_image_url text,
  hero_image_attribution text,
  source_commit_sha text not null check (source_commit_sha ~ '^[0-9a-f]{40}$'),
  source_revision bigint check (source_revision is null or source_revision >= 0),
  primary key (briefing_id, event_id),
  unique (briefing_id, display_order),
  check (
    hero_image_url is null
    or (hero_image_source_id is not null and nullif(btrim(hero_image_attribution), '') is not null)
  ),
  constraint daily_briefing_events_analysis_membership_fk
    foreign key (analysis_id, event_id, briefing_id)
    references public.event_analysis(id, event_id, briefing_id) on delete restrict
);

create table public.event_sources (
  event_id uuid not null references public.events(id) on delete restrict,
  source_id uuid not null references public.sources(id) on delete restrict,
  first_seen_date date not null,
  last_seen_date date not null,
  source_commit_sha text not null check (source_commit_sha ~ '^[0-9a-f]{40}$'),
  primary key (event_id, source_id),
  check (first_seen_date <= last_seen_date)
);

create table public.event_source_occurrences (
  briefing_id uuid not null,
  event_id uuid not null,
  source_id uuid not null,
  verification_status public.verification_status not null default 'unverified',
  is_primary boolean not null default false,
  display_order integer not null check (display_order >= 0),
  key_quote text,
  quote_translation text,
  source_commit_sha text not null check (source_commit_sha ~ '^[0-9a-f]{40}$'),
  source_revision bigint check (source_revision is null or source_revision >= 0),
  primary key (briefing_id, event_id, source_id),
  foreign key (briefing_id, event_id)
    references public.daily_briefing_events(briefing_id, event_id) on delete cascade,
  foreign key (event_id, source_id)
    references public.event_sources(event_id, source_id) on delete restrict
);

create unique index event_source_occurrences_primary_uidx
  on public.event_source_occurrences (briefing_id, event_id) where is_primary;

create table public.event_topics (
  event_id uuid not null references public.events(id) on delete restrict,
  topic_id uuid not null references public.topics(id) on delete restrict,
  relevance_score numeric check (relevance_score is null or relevance_score between 0 and 1),
  is_primary boolean not null default false,
  primary key (event_id, topic_id)
);

create table public.event_entities (
  event_id uuid not null references public.events(id) on delete restrict,
  entity_id uuid not null references public.entities(id) on delete restrict,
  role text,
  primary key (event_id, entity_id)
);

create table public.opportunities (
  id uuid primary key default extensions.gen_random_uuid(),
  stable_key text not null unique,
  name text not null,
  customer text not null,
  problem text not null,
  competitors jsonb not null default '[]'::jsonb check (jsonb_typeof(competitors) = 'array'),
  differentiation text not null,
  mvp_2_weeks text not null,
  difficulty text not null,
  monetization text not null,
  falsification text not null,
  score numeric(3,2) not null check (score between 0 and 5),
  stars smallint not null check (stars between 1 and 5),
  potential public.opportunity_potential not null,
  first_seen_date date not null,
  last_seen_date date not null,
  publication_state public.publication_state not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (first_seen_date <= last_seen_date)
);

create table public.daily_briefing_opportunities (
  briefing_id uuid not null references public.daily_briefings(id) on delete cascade,
  opportunity_id uuid not null references public.opportunities(id) on delete restrict,
  display_order integer not null check (display_order >= 0),
  candidate_status public.candidate_status not null default 'none',
  owner_action_required boolean not null default false,
  candidate_score numeric(3,2) check (candidate_score is null or candidate_score between 0 and 5),
  name text not null,
  customer text not null,
  problem text not null,
  differentiation text not null,
  mvp_2_weeks text not null,
  difficulty text not null,
  monetization text not null,
  falsification text not null,
  score numeric(3,2) not null check (score between 0 and 5),
  stars smallint not null check (stars between 1 and 5),
  potential public.opportunity_potential not null,
  source_commit_sha text not null check (source_commit_sha ~ '^[0-9a-f]{40}$'),
  primary key (briefing_id, opportunity_id),
  unique (briefing_id, display_order),
  check (
    (candidate_status = 'waiting_for_owner' and owner_action_required)
    or (candidate_status <> 'waiting_for_owner')
  ),
  check (
    (candidate_status = 'none' and not owner_action_required and candidate_score is null)
    or candidate_status <> 'none'
  )
);

create table public.opportunity_events (
  opportunity_id uuid not null references public.opportunities(id) on delete restrict,
  event_id uuid not null references public.events(id) on delete restrict,
  evidence_role text,
  primary key (opportunity_id, event_id)
);

create table public.resources (
  id uuid primary key default extensions.gen_random_uuid(),
  normalized_url text not null unique check (normalized_url ~ '^https?://'),
  resource_type public.resource_type not null,
  title text not null,
  url text not null check (url ~ '^https?://'),
  stars smallint check (stars is null or stars between 1 and 5),
  summary text,
  why_relevant text not null,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  publication_state public.publication_state not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.daily_briefing_resources (
  briefing_id uuid not null references public.daily_briefings(id) on delete cascade,
  resource_id uuid not null references public.resources(id) on delete restrict,
  section text not null,
  display_order integer not null check (display_order >= 0),
  primary key (briefing_id, resource_id, section),
  unique (briefing_id, section, display_order)
);

create table public.trend_signals (
  id uuid primary key default extensions.gen_random_uuid(),
  briefing_id uuid not null references public.daily_briefings(id) on delete cascade,
  signal_type text not null,
  label text not null,
  summary text not null,
  mood text,
  strength numeric check (strength is null or strength between 0 and 1),
  source_url text check (source_url is null or source_url ~ '^https?://'),
  display_order integer not null check (display_order >= 0),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  unique (briefing_id, signal_type, display_order)
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  locale text not null default 'ko-KR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.reactions (
  user_id uuid not null references public.profiles(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete restrict,
  sentiment public.reaction_sentiment,
  interested boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, event_id),
  check (sentiment is not null or interested)
);

create table public.bookmarks (
  user_id uuid not null references public.profiles(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (user_id, event_id)
);

create table public.follows (
  user_id uuid not null references public.profiles(id) on delete cascade,
  topic_id uuid not null references public.topics(id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (user_id, topic_id)
);

create table private.event_identity_registry (
  event_uid uuid primary key,
  canonical_key text not null unique,
  aliases jsonb not null default '[]'::jsonb check (jsonb_typeof(aliases) = 'array'),
  merged_into_event_uid uuid,
  reason text not null,
  first_seen_date date not null,
  source_commit_sha text not null check (source_commit_sha ~ '^[0-9a-f]{40}$'),
  registry_checksum text not null check (registry_checksum ~ '^[0-9a-f]{64}$'),
  updated_at timestamptz not null default now(),
  check (merged_into_event_uid is null or merged_into_event_uid <> event_uid)
);

create table private.source_identity_registry (
  source_uid uuid primary key,
  canonical_url text not null unique check (canonical_url ~ '^https?://'),
  aliases jsonb not null default '[]'::jsonb check (jsonb_typeof(aliases) = 'array'),
  provider text,
  external_id text,
  merged_into_source_uid uuid,
  reason text not null,
  source_commit_sha text not null check (source_commit_sha ~ '^[0-9a-f]{40}$'),
  registry_checksum text not null check (registry_checksum ~ '^[0-9a-f]{64}$'),
  updated_at timestamptz not null default now(),
  check (merged_into_source_uid is null or merged_into_source_uid <> source_uid)
);

create unique index source_identity_registry_provider_external_uidx
  on private.source_identity_registry (provider, external_id)
  where provider is not null and external_id is not null;

create table private.identity_registry_state (
  singleton boolean primary key default true check (singleton),
  registry_checksum text not null check (registry_checksum ~ '^[0-9a-f]{64}$'),
  source_commit_sha text not null check (source_commit_sha ~ '^[0-9a-f]{40}$'),
  applied_at timestamptz not null default now()
);

create table private.sync_runs (
  id uuid primary key default extensions.gen_random_uuid(),
  source_commit_sha text not null check (source_commit_sha ~ '^[0-9a-f]{40}$'),
  source_revision bigint check (source_revision is null or source_revision >= 0),
  trigger_type text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status public.sync_status not null default 'running',
  input_packet_count integer not null default 0 check (input_packet_count >= 0),
  output_counts jsonb not null default '{}'::jsonb,
  warning_count integer not null default 0 check (warning_count >= 0),
  error_code text,
  error_summary text
);

create table private.sync_run_items (
  id uuid primary key default extensions.gen_random_uuid(),
  sync_run_id uuid references private.sync_runs(id) on delete cascade,
  packet_path text not null,
  date_kst date,
  checksum text not null check (checksum ~ '^[0-9a-f]{64}$'),
  identity_registry_checksum text not null check (identity_registry_checksum ~ '^[0-9a-f]{64}$'),
  projection_input_checksum text not null check (projection_input_checksum ~ '^[0-9a-f]{64}$'),
  status public.sync_status not null,
  input_counts jsonb not null default '{}'::jsonb,
  output_counts jsonb not null default '{}'::jsonb,
  error_summary text,
  created_at timestamptz not null default now()
);

create unique index sync_run_items_succeeded_input_uidx
  on private.sync_run_items (packet_path, projection_input_checksum)
  where status = 'succeeded';

create table private.sync_cursors (
  packet_path text primary key,
  authoritative_commit_sha text not null check (authoritative_commit_sha ~ '^[0-9a-f]{40}$'),
  authoritative_revision bigint check (authoritative_revision is null or authoritative_revision >= 0),
  authoritative_checksum text not null check (authoritative_checksum ~ '^[0-9a-f]{64}$'),
  authoritative_projection_checksum text not null check (authoritative_projection_checksum ~ '^[0-9a-f]{64}$'),
  updated_at timestamptz not null default now()
);

create index daily_briefings_date_idx on public.daily_briefings (date_kst desc);
create index events_publication_last_seen_idx on public.events (publication_state, last_seen_date desc);
create index event_keys_event_status_idx on public.event_keys (event_id, status);
create index event_analysis_lookup_idx on public.event_analysis (event_id, language, is_current);
create index sources_taxonomy_idx on public.sources (source_type, authority);
create index source_urls_source_idx on public.source_urls (source_id);
create index daily_briefing_events_event_idx on public.daily_briefing_events (event_id, briefing_id);
create index event_sources_source_idx on public.event_sources (source_id, event_id);
create index event_source_occurrences_source_idx on public.event_source_occurrences (source_id, briefing_id);
create index event_topics_topic_idx on public.event_topics (topic_id, event_id);
create index event_entities_entity_idx on public.event_entities (entity_id, event_id);
create index opportunities_publication_last_seen_idx on public.opportunities (publication_state, last_seen_date desc);
create index daily_briefing_opportunities_opportunity_idx on public.daily_briefing_opportunities (opportunity_id, briefing_id);
create index opportunity_events_event_idx on public.opportunity_events (event_id, opportunity_id);
create index daily_briefing_resources_resource_idx on public.daily_briefing_resources (resource_id, briefing_id);
create index trend_signals_briefing_order_idx on public.trend_signals (briefing_id, display_order);
create index reactions_user_updated_idx on public.reactions (user_id, updated_at desc);
create index bookmarks_user_created_idx on public.bookmarks (user_id, created_at desc);
create index follows_user_created_idx on public.follows (user_id, created_at desc);

create or replace function private.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'daily_briefings', 'sources', 'events', 'topics', 'entities',
    'opportunities', 'resources', 'profiles', 'reactions'
  ] loop
    execute format(
      'create trigger %I before update on public.%I for each row execute function private.set_updated_at()',
      table_name || '_set_updated_at', table_name
    );
  end loop;
end;
$$;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'avatar_url', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke all on function private.handle_new_user() from public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

alter table public.daily_briefings enable row level security;
alter table public.events enable row level security;
alter table public.event_keys enable row level security;
alter table public.event_analysis enable row level security;
alter table public.sources enable row level security;
alter table public.source_urls enable row level security;
alter table public.event_sources enable row level security;
alter table public.event_source_occurrences enable row level security;
alter table public.topics enable row level security;
alter table public.event_topics enable row level security;
alter table public.entities enable row level security;
alter table public.event_entities enable row level security;
alter table public.daily_briefing_events enable row level security;
alter table public.opportunities enable row level security;
alter table public.daily_briefing_opportunities enable row level security;
alter table public.opportunity_events enable row level security;
alter table public.resources enable row level security;
alter table public.daily_briefing_resources enable row level security;
alter table public.trend_signals enable row level security;
alter table public.profiles enable row level security;
alter table public.reactions enable row level security;
alter table public.bookmarks enable row level security;
alter table public.follows enable row level security;

revoke all on all tables in schema public from public, anon, authenticated, service_role;
grant usage on schema public to anon, authenticated, service_role;
grant select on public.daily_briefings, public.events, public.event_analysis,
  public.sources, public.source_urls, public.event_sources, public.event_source_occurrences,
  public.topics, public.event_topics, public.entities, public.event_entities,
  public.daily_briefing_events, public.opportunities, public.daily_briefing_opportunities,
  public.opportunity_events, public.resources, public.daily_briefing_resources,
  public.trend_signals to anon, authenticated;
grant select, insert, update on public.profiles, public.reactions to authenticated;
grant delete on public.reactions to authenticated;
grant select, insert, delete on public.bookmarks, public.follows to authenticated;

create policy daily_briefings_public_read on public.daily_briefings for select
  to anon, authenticated using (publication_state = 'published');
create policy events_public_read on public.events for select
  to anon, authenticated using (publication_state = 'published' or merged_into_event_id is not null);
create policy event_analysis_public_read on public.event_analysis for select
  to anon, authenticated using (
    exists (
      select 1 from public.daily_briefing_events dbe
      join public.daily_briefings db on db.id = dbe.briefing_id
      join public.events e on e.id = dbe.event_id
      where dbe.analysis_id = event_analysis.id
        and db.publication_state = 'published'
        and e.publication_state = 'published'
    )
  );
create policy daily_briefing_events_public_read on public.daily_briefing_events for select
  to anon, authenticated using (
    exists (select 1 from public.daily_briefings db where db.id = briefing_id and db.publication_state = 'published')
    and exists (select 1 from public.events e where e.id = event_id and e.publication_state = 'published')
  );
create policy sources_public_read on public.sources for select
  to anon, authenticated using (
    exists (
      select 1 from public.event_source_occurrences eso
      join public.daily_briefings db on db.id = eso.briefing_id
      join public.events e on e.id = eso.event_id
      where eso.source_id = sources.id
        and db.publication_state = 'published'
        and e.publication_state = 'published'
    )
  );
create policy source_urls_public_read on public.source_urls for select
  to anon, authenticated using (
    is_current_canonical and exists (
      select 1 from public.event_source_occurrences eso
      join public.daily_briefings db on db.id = eso.briefing_id
      join public.events e on e.id = eso.event_id
      where eso.source_id = source_urls.source_id
        and db.publication_state = 'published'
        and e.publication_state = 'published'
    )
  );
create policy event_sources_public_read on public.event_sources for select
  to anon, authenticated using (
    exists (
      select 1 from public.event_source_occurrences eso
      join public.daily_briefings db on db.id = eso.briefing_id
      join public.events e on e.id = eso.event_id
      where eso.event_id = event_sources.event_id and eso.source_id = event_sources.source_id
        and db.publication_state = 'published' and e.publication_state = 'published'
    )
  );
create policy event_source_occurrences_public_read on public.event_source_occurrences for select
  to anon, authenticated using (
    exists (select 1 from public.daily_briefings db where db.id = briefing_id and db.publication_state = 'published')
    and exists (select 1 from public.events e where e.id = event_id and e.publication_state = 'published')
  );
create policy topics_public_read on public.topics for select
  to anon, authenticated using (publication_state = 'published');
create policy event_topics_public_read on public.event_topics for select
  to anon, authenticated using (
    exists (select 1 from public.events e where e.id = event_id and e.publication_state = 'published')
    and exists (select 1 from public.topics t where t.id = topic_id and t.publication_state = 'published')
  );
create or replace function private.entity_is_published(target_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((
    select publication_state = 'published'
    from public.entities where id = target_id
  ), false);
$$;
create or replace function private.entity_has_published_event(target_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.event_entities ee
    join public.events e on e.id = ee.event_id
    where ee.entity_id = target_id and e.publication_state = 'published'
  );
$$;
revoke all on function private.entity_is_published(uuid) from public;
revoke all on function private.entity_has_published_event(uuid) from public;
grant execute on function private.entity_is_published(uuid) to anon, authenticated;
grant execute on function private.entity_has_published_event(uuid) to anon, authenticated;
create policy entities_public_read on public.entities for select
  to anon, authenticated using (
    publication_state = 'published'
    and private.entity_has_published_event(id)
  );
create policy event_entities_public_read on public.event_entities for select
  to anon, authenticated using (
    exists (select 1 from public.events e where e.id = event_id and e.publication_state = 'published')
    and private.entity_is_published(entity_id)
  );
create policy opportunities_public_read on public.opportunities for select
  to anon, authenticated using (publication_state = 'published');
create policy daily_briefing_opportunities_public_read on public.daily_briefing_opportunities for select
  to anon, authenticated using (
    exists (select 1 from public.daily_briefings db where db.id = briefing_id and db.publication_state = 'published')
    and exists (select 1 from public.opportunities o where o.id = opportunity_id and o.publication_state = 'published')
  );
create policy opportunity_events_public_read on public.opportunity_events for select
  to anon, authenticated using (
    exists (select 1 from public.opportunities o where o.id = opportunity_id and o.publication_state = 'published')
    and exists (select 1 from public.events e where e.id = event_id and e.publication_state = 'published')
  );
create policy resources_public_read on public.resources for select
  to anon, authenticated using (publication_state = 'published');
create policy daily_briefing_resources_public_read on public.daily_briefing_resources for select
  to anon, authenticated using (
    exists (select 1 from public.daily_briefings db where db.id = briefing_id and db.publication_state = 'published')
    and exists (select 1 from public.resources r where r.id = resource_id and r.publication_state = 'published')
  );
create policy trend_signals_public_read on public.trend_signals for select
  to anon, authenticated using (
    exists (select 1 from public.daily_briefings db where db.id = briefing_id and db.publication_state = 'published')
  );

create policy profiles_own_read on public.profiles for select to authenticated
  using ((select auth.uid()) = id);
create policy profiles_own_insert on public.profiles for insert to authenticated
  with check ((select auth.uid()) = id);
create policy profiles_own_update on public.profiles for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy reactions_own_read on public.reactions for select to authenticated
  using ((select auth.uid()) = user_id);
create policy reactions_own_insert on public.reactions for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy reactions_own_update on public.reactions for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy reactions_own_delete on public.reactions for delete to authenticated
  using ((select auth.uid()) = user_id);
create policy bookmarks_own_read on public.bookmarks for select to authenticated
  using ((select auth.uid()) = user_id);
create policy bookmarks_own_insert on public.bookmarks for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy bookmarks_own_delete on public.bookmarks for delete to authenticated
  using ((select auth.uid()) = user_id);
create policy follows_own_read on public.follows for select to authenticated
  using ((select auth.uid()) = user_id);
create policy follows_own_insert on public.follows for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy follows_own_delete on public.follows for delete to authenticated
  using ((select auth.uid()) = user_id);

alter default privileges in schema public revoke all on tables from public, anon, authenticated, service_role;
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;
alter default privileges in schema private revoke all on tables from public, anon, authenticated;
alter default privileges in schema private revoke execute on functions from public, anon, authenticated;
