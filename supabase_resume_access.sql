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
