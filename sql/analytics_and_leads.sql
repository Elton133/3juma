-- Funnel analytics + lead capture tables for early growth measurement.

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  user_id uuid null references auth.users(id) on delete set null,
  session_id text,
  page_path text,
  properties jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_analytics_events_name_created
  on public.analytics_events(event_name, created_at desc);
create index if not exists idx_analytics_events_user
  on public.analytics_events(user_id, created_at desc);

alter table public.analytics_events enable row level security;

drop policy if exists "Anyone can insert analytics events" on public.analytics_events;
create policy "Anyone can insert analytics events"
  on public.analytics_events for insert
  with check (true);

drop policy if exists "Admins can read analytics events" on public.analytics_events;
create policy "Admins can read analytics events"
  on public.analytics_events for select
  using (exists (select 1 from public.users where auth_id = auth.uid() and role = 'admin'));

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  name text,
  phone text not null,
  trade text,
  area text,
  note text,
  status text not null default 'new',
  created_at timestamptz not null default now()
);

create index if not exists idx_leads_created on public.leads(created_at desc);
create index if not exists idx_leads_status on public.leads(status);

alter table public.leads enable row level security;

drop policy if exists "Anyone can create leads" on public.leads;
create policy "Anyone can create leads"
  on public.leads for insert
  with check (true);

drop policy if exists "Admins can read leads" on public.leads;
create policy "Admins can read leads"
  on public.leads for select
  using (exists (select 1 from public.users where auth_id = auth.uid() and role = 'admin'));

