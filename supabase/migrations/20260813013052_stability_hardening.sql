update public.booking_requests
set whatsapp = case
  when regexp_replace(whatsapp, '[^0-9+]', '', 'g') ~ '^\+[1-9][0-9]{7,14}$'
    then regexp_replace(whatsapp, '[^0-9+]', '', 'g')
  when regexp_replace(whatsapp, '[^0-9+]', '', 'g') ~ '^[1-9][0-9]{7,14}$'
    then '+' || regexp_replace(whatsapp, '[^0-9+]', '', 'g')
  else whatsapp
end;

alter table public.booking_requests
  add column is_test boolean not null default false,
  add column trip_id text not null default 'xian-tang-culture-2d1n',
  add column notification_status text not null default 'PENDING',
  add column notification_attempted_at timestamptz,
  add column notification_error_code text;

update public.booking_requests
set notification_status = 'SKIPPED'
where notification_status = 'PENDING';

alter table public.booking_requests
  add constraint booking_requests_full_name_length
    check (char_length(btrim(full_name)) between 1 and 100),
  add constraint booking_requests_full_name_characters
    check (full_name !~ '[[:cntrl:]]'),
  add constraint booking_requests_country_length
    check (char_length(btrim(country)) between 1 and 80),
  add constraint booking_requests_country_characters
    check (country !~ '[[:cntrl:]]'),
  add constraint booking_requests_whatsapp_format
    check (whatsapp ~ '^\+[1-9][0-9]{7,14}$'),
  add constraint booking_requests_email_length
    check (char_length(btrim(email)) between 3 and 254),
  add constraint booking_requests_email_format
    check (email ~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'),
  add constraint booking_requests_notes_length
    check (notes is null or char_length(notes) <= 2000),
  add constraint booking_requests_notes_characters
    check (notes is null or translate(notes, chr(9) || chr(10) || chr(13), '') !~ '[[:cntrl:]]'),
  add constraint booking_requests_utm_source_length
    check (utm_source is null or char_length(utm_source) <= 100),
  add constraint booking_requests_utm_medium_length
    check (utm_medium is null or char_length(utm_medium) <= 100),
  add constraint booking_requests_utm_campaign_length
    check (utm_campaign is null or char_length(utm_campaign) <= 100),
  add constraint booking_requests_ref_code_length
    check (ref_code is null or char_length(ref_code) <= 100),
  add constraint booking_requests_trip_id_length
    check (char_length(trip_id) between 1 and 100),
  add constraint booking_requests_notification_status
    check (notification_status in ('PENDING', 'SENT', 'FAILED', 'SKIPPED')),
  add constraint booking_requests_notification_error_code_length
    check (notification_error_code is null or char_length(notification_error_code) <= 64);

create index booking_requests_real_follow_up_idx
  on public.booking_requests (created_at desc)
  where is_test = false and booking_status in ('NEW', 'CONTACTED');

create index booking_requests_failed_notification_idx
  on public.booking_requests (created_at desc)
  where is_test = false and notification_status = 'FAILED';

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to service_role;

create table private.booking_rate_limits (
  key_hash text not null,
  bucket_start timestamptz not null,
  request_count integer not null check (request_count > 0),
  expires_at timestamptz not null,
  primary key (key_hash, bucket_start),
  constraint booking_rate_limits_key_hash_format
    check (key_hash ~ '^[0-9a-f]{64}$')
);

alter table private.booking_rate_limits enable row level security;
revoke all on table private.booking_rate_limits from public, anon, authenticated;
grant select, insert, update, delete on table private.booking_rate_limits to service_role;

create or replace function public.consume_booking_rate_limit(
  p_key_hash text,
  p_limit integer,
  p_window_seconds integer
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_now timestamptz := clock_timestamp();
  v_bucket_start timestamptz;
  v_count integer;
  v_retry_after integer;
begin
  if p_key_hash !~ '^[0-9a-f]{64}$'
    or p_limit < 1
    or p_limit > 10000
    or p_window_seconds < 10
    or p_window_seconds > 86400 then
    raise exception 'invalid rate limit arguments' using errcode = '22023';
  end if;

  v_bucket_start := to_timestamp(
    floor(extract(epoch from v_now) / p_window_seconds) * p_window_seconds
  );

  insert into private.booking_rate_limits (
    key_hash,
    bucket_start,
    request_count,
    expires_at
  )
  values (
    p_key_hash,
    v_bucket_start,
    1,
    v_bucket_start + make_interval(secs => p_window_seconds)
  )
  on conflict (key_hash, bucket_start)
  do update set
    request_count = private.booking_rate_limits.request_count + 1,
    expires_at = excluded.expires_at
  returning request_count into v_count;

  with expired as (
    select ctid
    from private.booking_rate_limits
    where expires_at < v_now
    limit 100
  )
  delete from private.booking_rate_limits
  where ctid in (select ctid from expired);

  v_retry_after := greatest(
    ceil(extract(epoch from (
      v_bucket_start + make_interval(secs => p_window_seconds) - v_now
    )))::integer,
    1
  );

  return jsonb_build_object(
    'allowed', v_count <= p_limit,
    'remaining', greatest(p_limit - v_count, 0),
    'retry_after_seconds', v_retry_after
  );
end;
$$;

revoke all on function public.consume_booking_rate_limit(text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.consume_booking_rate_limit(text, integer, integer)
  to service_role;

comment on column public.booking_requests.is_test is
  'True only when the server authenticates the browser-acceptance secret. Exclude from CRM, payment, and real notifications.';
comment on column public.booking_requests.trip_id is
  'Stable product identifier for the V0.1 Xi''an Tang Culture trip.';
comment on column public.booking_requests.notification_status is
  'Feishu booking notification state. Legacy rows were marked SKIPPED without retroactive delivery.';
comment on table private.booking_rate_limits is
  'Short-lived HMACed-IP fixed-window counters; raw client IP addresses are never stored.';
comment on function public.consume_booking_rate_limit(text, integer, integer) is
  'Atomically consumes one fixed-window booking allowance. Executable only by service_role.';
