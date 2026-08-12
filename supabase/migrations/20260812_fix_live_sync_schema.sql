-- Bring the live Supabase schema in line with the app's sync payloads.
-- Safe to run multiple times.

alter table if exists public.profiles
  add column if not exists avatar_color text not null default '#0EA5E9',
  add column if not exists avatar_emoji text not null default '💼',
  add column if not exists is_premium boolean not null default false,
  add column if not exists currency_pref text not null default 'PHP',
  add column if not exists user_type text not null default 'user',
  add column if not exists first_name text not null default '',
  add column if not exists last_name text not null default '',
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

alter table if exists public.categories
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

alter table if exists public.budgets
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

alter table if exists public.streaks
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

alter table if exists public.subscriptions
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

alter table if exists public.user_badges
  add column if not exists earned_at timestamptz not null default now();

update public.categories
set created_at = coalesce(created_at, now()),
    updated_at = coalesce(updated_at, now());

update public.budgets
set created_at = coalesce(created_at, now()),
    updated_at = coalesce(updated_at, now());

update public.streaks
set created_at = coalesce(created_at, now()),
    updated_at = coalesce(updated_at, now());

update public.subscriptions
set created_at = coalesce(created_at, now()),
    updated_at = coalesce(updated_at, now());

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to anon, authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;

alter default privileges in schema public
  grant select, insert, update, delete on tables to anon, authenticated;

alter default privileges in schema public
  grant usage, select on sequences to anon, authenticated;
