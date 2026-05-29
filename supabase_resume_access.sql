create table if not exists public.resume_access_requests (
    id uuid primary key default gen_random_uuid(),
    email text not null,
    status text not null default 'otp_sent'
        check (status in ('otp_sent', 'pending', 'approved', 'rejected', 'expired')),
    otp_hash text not null,
    otp_expires_at timestamptz not null,
    approval_token text not null unique,
    requested_document text not null default 'resume',
    requested_at timestamptz,
    decided_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists resume_access_requests_email_idx
    on public.resume_access_requests (lower(email));

create index if not exists resume_access_requests_status_created_idx
    on public.resume_access_requests (status, created_at desc);

create index if not exists resume_access_requests_approval_token_idx
    on public.resume_access_requests (approval_token);

create index if not exists resume_access_requests_delete_otp_idx
    on public.resume_access_requests (email, requested_document, status, created_at desc)
    where requested_document like 'featured_project_delete:%';

alter table public.resume_access_requests enable row level security;

create or replace function public.set_resume_access_requests_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists set_resume_access_requests_updated_at on public.resume_access_requests;
create trigger set_resume_access_requests_updated_at
before update on public.resume_access_requests
for each row
execute function public.set_resume_access_requests_updated_at();

create table if not exists public.portfolio_analytics_events (
    id uuid primary key default gen_random_uuid(),
    event_name text not null,
    visitor_id text,
    session_id text,
    page_path text,
    page_title text,
    referrer text,
    device_type text,
    browser text,
    viewport_width integer,
    viewport_height integer,
    timezone text,
    language text,
    country_code text,
    region text,
    city text,
    ip_hash text,
    user_agent text,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    check (event_name in (
        'page_view',
        'section_view',
        'session_engagement',
        'link_click',
        'outbound_link_click',
        'anchor_link_click',
        'button_click',
        'contact_link_click',
        'project_link_click',
        'document_gate_open',
        'resume_otp_requested',
        'resume_access_pending_approval',
        'resume_access_approved',
        'contact_form_submit_attempt',
        'contact_form_submit_success',
        'contact_form_submit_error',
        'assistant_prompt_click',
        'assistant_question_submitted'
    ))
);

create index if not exists portfolio_analytics_events_created_idx
    on public.portfolio_analytics_events (created_at desc);

create index if not exists portfolio_analytics_events_event_created_idx
    on public.portfolio_analytics_events (event_name, created_at desc);

create index if not exists portfolio_analytics_events_visitor_idx
    on public.portfolio_analytics_events (visitor_id)
    where visitor_id is not null;

create index if not exists portfolio_analytics_events_session_idx
    on public.portfolio_analytics_events (session_id)
    where session_id is not null;

create index if not exists portfolio_analytics_events_page_idx
    on public.portfolio_analytics_events (page_path, created_at desc)
    where page_path is not null;

alter table public.portfolio_analytics_events enable row level security;

drop policy if exists "Owner can read portfolio analytics" on public.portfolio_analytics_events;
create policy "Owner can read portfolio analytics"
on public.portfolio_analytics_events
for select
to authenticated
using ((auth.jwt() ->> 'email') = 'nirmalyaghosh2127@gmail.com');

revoke all on public.portfolio_analytics_events from anon;
revoke all on public.portfolio_analytics_events from authenticated;
grant select on public.portfolio_analytics_events to authenticated;

create or replace view public.portfolio_analytics_daily
with (security_invoker = true) as
select
    date_trunc('day', created_at) as day,
    count(*) filter (where event_name = 'page_view') as page_views,
    count(distinct visitor_id) filter (where event_name = 'page_view') as unique_visitors,
    count(distinct session_id) filter (where event_name = 'page_view') as sessions,
    count(*) filter (where event_name = 'project_link_click') as project_clicks,
    count(*) filter (where event_name = 'contact_link_click') as contact_clicks,
    count(*) filter (where event_name = 'document_gate_open') as document_gate_opens,
    count(*) filter (where event_name = 'resume_otp_requested') as resume_otp_requests,
    count(*) filter (where event_name = 'resume_access_approved') as resume_approvals,
    count(*) filter (where event_name = 'contact_form_submit_success') as contact_messages,
    count(*) filter (where event_name = 'assistant_question_submitted') as assistant_questions,
    avg((metadata->>'durationSeconds')::numeric) filter (where event_name = 'session_engagement') as avg_session_seconds,
    avg((metadata->>'maxScrollDepth')::numeric) filter (where event_name = 'session_engagement') as avg_scroll_depth
from public.portfolio_analytics_events
group by 1
order by 1 desc;

create or replace view public.portfolio_analytics_event_counts
with (security_invoker = true) as
select
    event_name,
    count(*) as total_events,
    count(distinct visitor_id) as unique_visitors,
    max(created_at) as latest_event_at
from public.portfolio_analytics_events
group by event_name
order by total_events desc;

create or replace view public.portfolio_analytics_top_pages
with (security_invoker = true) as
select
    page_path,
    page_title,
    count(*) filter (where event_name = 'page_view') as page_views,
    count(distinct visitor_id) filter (where event_name = 'page_view') as unique_visitors,
    max(created_at) as latest_view_at
from public.portfolio_analytics_events
where page_path is not null
group by page_path, page_title
order by page_views desc;

create or replace view public.portfolio_analytics_referrers
with (security_invoker = true) as
select
    nullif(referrer, '') as referrer,
    count(*) filter (where event_name = 'page_view') as page_views,
    count(distinct visitor_id) filter (where event_name = 'page_view') as unique_visitors,
    max(created_at) as latest_view_at
from public.portfolio_analytics_events
where nullif(referrer, '') is not null
group by nullif(referrer, '')
order by page_views desc;

create or replace view public.portfolio_analytics_devices
with (security_invoker = true) as
select
    device_type,
    browser,
    count(*) filter (where event_name = 'page_view') as page_views,
    count(distinct visitor_id) filter (where event_name = 'page_view') as unique_visitors
from public.portfolio_analytics_events
group by device_type, browser
order by page_views desc;

revoke all on public.portfolio_analytics_daily from anon;
revoke all on public.portfolio_analytics_event_counts from anon;
revoke all on public.portfolio_analytics_top_pages from anon;
revoke all on public.portfolio_analytics_referrers from anon;
revoke all on public.portfolio_analytics_devices from anon;

grant select on public.portfolio_analytics_daily to authenticated;
grant select on public.portfolio_analytics_event_counts to authenticated;
grant select on public.portfolio_analytics_top_pages to authenticated;
grant select on public.portfolio_analytics_referrers to authenticated;
grant select on public.portfolio_analytics_devices to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
    'featured-project-thumbnails',
    'featured-project-thumbnails',
    true,
    4194304,
    array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.featured_projects (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    short_description text not null,
    thumbnail_url text not null,
    thumbnail_path text not null,
    demo_type text not null check (demo_type in ('website', 'video')),
    demo_url text not null,
    github_url text not null,
    display_order integer not null default 100,
    published boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists featured_projects_published_order_idx
    on public.featured_projects (published, display_order, created_at desc);

alter table public.featured_projects
    add column if not exists category text,
    add column if not exists tech_stack text[] not null default '{}'::text[],
    add column if not exists project_status text not null default 'completed'
        check (project_status in ('completed', 'in_progress', 'case_study', 'archived')),
    add column if not exists project_role text,
    add column if not exists problem_solved text,
    add column if not exists highlights jsonb not null default '[]'::jsonb,
    add column if not exists image_alt text,
    add column if not exists demo_label text,
    add column if not exists featured_badge text,
    add column if not exists project_date date,
    add column if not exists slug text,
    add column if not exists is_pinned boolean not null default false;

create unique index if not exists featured_projects_slug_unique_idx
    on public.featured_projects (slug)
    where slug is not null;

create index if not exists featured_projects_pinned_order_idx
    on public.featured_projects (published, is_pinned desc, display_order, created_at desc);

alter table public.featured_projects enable row level security;

create or replace function public.set_featured_projects_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists set_featured_projects_updated_at on public.featured_projects;
create trigger set_featured_projects_updated_at
before update on public.featured_projects
for each row
execute function public.set_featured_projects_updated_at();

drop policy if exists "Owner can read featured projects" on public.featured_projects;
create policy "Owner can read featured projects"
on public.featured_projects
for select
to authenticated
using ((auth.jwt() ->> 'email') = 'nirmalyaghosh2127@gmail.com');

drop policy if exists "Owner can insert featured projects" on public.featured_projects;
create policy "Owner can insert featured projects"
on public.featured_projects
for insert
to authenticated
with check ((auth.jwt() ->> 'email') = 'nirmalyaghosh2127@gmail.com');

drop policy if exists "Owner can update featured projects" on public.featured_projects;
create policy "Owner can update featured projects"
on public.featured_projects
for update
to authenticated
using ((auth.jwt() ->> 'email') = 'nirmalyaghosh2127@gmail.com')
with check ((auth.jwt() ->> 'email') = 'nirmalyaghosh2127@gmail.com');

drop policy if exists "Owner can delete featured projects" on public.featured_projects;
create policy "Owner can delete featured projects"
on public.featured_projects
for delete
to authenticated
using ((auth.jwt() ->> 'email') = 'nirmalyaghosh2127@gmail.com');

revoke all on public.featured_projects from anon;
revoke all on public.featured_projects from authenticated;
grant select, insert, update on public.featured_projects to authenticated;

drop policy if exists "Owner can manage featured project thumbnails" on storage.objects;
create policy "Owner can manage featured project thumbnails"
on storage.objects
for all
to authenticated
using (
    bucket_id = 'featured-project-thumbnails'
    and (auth.jwt() ->> 'email') = 'nirmalyaghosh2127@gmail.com'
)
with check (
    bucket_id = 'featured-project-thumbnails'
    and (auth.jwt() ->> 'email') = 'nirmalyaghosh2127@gmail.com'
);
