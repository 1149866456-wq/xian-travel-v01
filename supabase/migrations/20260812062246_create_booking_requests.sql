create extension if not exists pgcrypto;

create table if not exists public.booking_requests (
  id uuid primary key default gen_random_uuid(),
  booking_reference text not null unique,
  travel_date date not null,
  traveler_count smallint not null check (traveler_count between 2 and 4),
  full_name text not null,
  country text not null,
  whatsapp text not null,
  email text not null,
  notes text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  ref_code text,
  booking_status text not null default 'NEW' check (booking_status in ('NEW','CONTACTED','CONFIRMED','CANCELLED')),
  submission_token uuid not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists booking_requests_set_updated_at on public.booking_requests;
create trigger booking_requests_set_updated_at
before update on public.booking_requests
for each row execute function public.set_updated_at();

alter table public.booking_requests enable row level security;
revoke all on table public.booking_requests from anon, authenticated;
grant select, insert, update on table public.booking_requests to service_role;

comment on table public.booking_requests is 'Single source of truth for V0.1 trip booking requests.';
comment on column public.booking_requests.submission_token is 'Idempotency token and unguessable success-page lookup token; never use booking_reference alone to expose PII.';
