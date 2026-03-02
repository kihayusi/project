-- ============================================================
-- Emergency Reports table
-- Citizens can submit non-urgent emergency / incident reports
-- ============================================================
create table if not exists public.emergency_reports (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  type        text not null default 'incident',   -- incident | hazard | suspicious_activity | other
  subject     text not null,
  description text not null,
  location    text not null default '',
  latitude    double precision,
  longitude   double precision,
  photo_urls  text[] default '{}',
  status      text not null default 'pending',     -- pending | acknowledged | resolved
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.emergency_reports enable row level security;

create policy "Users can view own emergency reports"
  on public.emergency_reports for select
  using (auth.uid() = user_id);

create policy "Users can insert own emergency reports"
  on public.emergency_reports for insert
  with check (auth.uid() = user_id);

create policy "Admins can view all emergency reports"
  on public.emergency_reports for select
  using (
    exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin')
  );

create policy "Admins can update emergency reports"
  on public.emergency_reports for update
  using (
    exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin')
  );

  -- ============================================================
-- City Alerts table
-- Weather warnings, typhoon alerts, evacuation notices, etc.
-- ============================================================
create table if not exists public.city_alerts (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text not null,
  severity    text not null default 'info',   -- info | warning | critical
  category    text not null default 'general', -- weather | flood | fire | earthquake | evacuation | general
  is_active   boolean not null default true,
  created_by  uuid references auth.users(id) on delete set null,
  starts_at   timestamptz not null default now(),
  expires_at  timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.city_alerts enable row level security;

create policy "Anyone can view active city alerts"
  on public.city_alerts for select
  using (is_active = true);

create policy "Admins can manage city alerts"
  on public.city_alerts for all
  using (
    exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin')
  );

-- ============================================================
-- SOS Reports table
-- Panic button submissions with GPS coordinates
-- ============================================================
create table if not exists public.sos_reports (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  latitude    double precision,
  longitude   double precision,
  message     text default '',
  status      text not null default 'sent',   -- sent | acknowledged | resolved
  created_at  timestamptz not null default now()
);

alter table public.sos_reports enable row level security;

create policy "Users can view own sos reports"
  on public.sos_reports for select
  using (auth.uid() = user_id);

create policy "Users can insert own sos reports"
  on public.sos_reports for insert
  with check (auth.uid() = user_id);

create policy "Admins can view all sos reports"
  on public.sos_reports for select
  using (
    exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin')
  );

create policy "Admins can update sos reports"
  on public.sos_reports for update
  using (
    exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin')
  );

-- Seed a couple of sample city alerts for demo purposes
insert into public.city_alerts (title, description, severity, category, starts_at, expires_at) values
  ('Typhoon Warning Signal #1', 'PAGASA has raised Typhoon Paeng to Signal #1 over Pangasinan. Expect moderate to heavy rainfall in the next 24 hours.', 'warning', 'weather', now(), now() + interval '48 hours'),
  ('Flash Flood Advisory', 'Low-lying areas in Barangays 1-5 are advised to prepare for possible flooding due to continuous rainfall.', 'critical', 'flood', now(), now() + interval '24 hours'),
  ('Fire Prevention Month', 'March is Fire Prevention Month. Check your smoke detectors and review your family evacuation plan.', 'info', 'fire', now(), now() + interval '30 days');
