-- Cbudget shared schema for online Supabase storage.
-- Assumes Supabase Auth is the source of truth for credentials.

create extension if not exists pgcrypto;

-- Profiles / users metadata
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  email text not null default '',
  avatar_color text not null default '#0EA5E9',
  avatar_emoji text not null default '💼',
  is_premium boolean not null default false,
  currency_pref text not null default 'PHP',
  user_type text not null default 'user',
  first_name text not null default '',
  last_name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Offline devices that can later be linked to an online account
create table if not exists public.offline_devices (
  offline_id uuid primary key default gen_random_uuid(),
  device_id text not null unique,
  currency_pref text not null default 'PHP',
  upgraded_to_user_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create type public.owner_type as enum ('online', 'offline');
create type public.transaction_type as enum ('income', 'expense');
create type public.recurring_frequency as enum ('daily', 'weekly', 'monthly');
create type public.budget_period as enum ('daily', 'weekly', 'monthly');
create type public.lesson_audience as enum ('user', 'guest', 'offline');
create type public.subscription_tier as enum ('free', 'premium');
create type public.subscription_status as enum ('active', 'past_due', 'canceled', 'trialing');
create type public.risk_profile as enum ('Conservative', 'Moderate', 'Aggressive');

create table if not exists public.categories (
  category_id uuid primary key default gen_random_uuid(),
  owner_type public.owner_type not null,
  owner_id text not null,
  name text not null,
  type public.transaction_type not null,
  icon text,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.transactions (
  transaction_id uuid primary key default gen_random_uuid(),
  owner_type public.owner_type not null,
  owner_id text not null,
  category_id uuid references public.categories(category_id) on delete set null,
  type public.transaction_type not null,
  amount numeric(14,2) not null,
  description text,
  transaction_date date not null,
  is_recurring boolean not null default false,
  recurring_id uuid,
  synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.recurring_schedules (
  recurring_id uuid primary key default gen_random_uuid(),
  owner_type public.owner_type not null,
  owner_id text not null,
  category_id uuid references public.categories(category_id) on delete set null,
  amount numeric(14,2) not null,
  frequency public.recurring_frequency not null,
  next_run_date date not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.transactions
  add constraint transactions_recurring_fk
  foreign key (recurring_id) references public.recurring_schedules(recurring_id) on delete set null;

create table if not exists public.budgets (
  budget_id uuid primary key default gen_random_uuid(),
  owner_type public.owner_type not null,
  owner_id text not null,
  category_id uuid references public.categories(category_id) on delete set null,
  limit_amount numeric(14,2) not null,
  period public.budget_period not null,
  is_recommended boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.recommendations (
  recommendation_id uuid primary key default gen_random_uuid(),
  owner_type public.owner_type not null,
  owner_id text not null,
  category_id uuid references public.categories(category_id) on delete set null,
  rule_triggered text not null,
  message text not null,
  generated_at timestamptz not null default now(),
  is_dismissed boolean not null default false
);

create table if not exists public.literacy_lessons (
  lesson_id uuid primary key default gen_random_uuid(),
  title text not null,
  content text,
  category text not null,
  target_user_type public.lesson_audience not null,
  order_index integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lesson_progress (
  progress_id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  lesson_id uuid references public.literacy_lessons(lesson_id) on delete cascade,
  is_completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, lesson_id)
);

create table if not exists public.streaks (
  streak_id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade unique,
  current_count integer not null default 0,
  longest_count integer not null default 0,
  last_activity_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.badges (
  badge_id uuid primary key default gen_random_uuid(),
  name text not null unique,
  icon text,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.user_badges (
  user_badge_id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  badge_id uuid references public.badges(badge_id) on delete cascade,
  earned_at timestamptz not null default now(),
  unique (user_id, badge_id)
);

create table if not exists public.saving_challenges (
  challenge_id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  target_amount numeric(14,2) not null,
  current_amount numeric(14,2) not null default 0,
  start_date date not null,
  end_date date not null,
  is_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  subscription_id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade unique,
  tier public.subscription_tier not null default 'free',
  status public.subscription_status not null default 'active',
  start_date date not null default current_date,
  renewal_date date,
  payment_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Offline-specific sync metadata for users who have transitioned to online.
create table if not exists public.sync_state (
  sync_state_id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade unique,
  last_sync_at timestamptz,
  sync_cursor text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Simple RLS scaffolding. Tighten per project rules later if needed.
alter table public.profiles enable row level security;
alter table public.offline_devices enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.recurring_schedules enable row level security;
alter table public.budgets enable row level security;
alter table public.recommendations enable row level security;
alter table public.literacy_lessons enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.streaks enable row level security;
alter table public.badges enable row level security;
alter table public.user_badges enable row level security;
alter table public.saving_challenges enable row level security;
alter table public.subscriptions enable row level security;
alter table public.sync_state enable row level security;

-- Profile policies
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
for select using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
for insert with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "profiles_delete_own" on public.profiles;
create policy "profiles_delete_own" on public.profiles
for delete using (auth.uid() = id);

-- Shared read tables
drop policy if exists "lessons_select_all" on public.literacy_lessons;
create policy "lessons_select_all" on public.literacy_lessons
for select using (true);

drop policy if exists "badges_select_all" on public.badges;
create policy "badges_select_all" on public.badges
for select using (true);

drop policy if exists "offline_devices_select_own" on public.offline_devices;
create policy "offline_devices_select_own" on public.offline_devices
for select using (true);
drop policy if exists "offline_devices_insert" on public.offline_devices;
create policy "offline_devices_insert" on public.offline_devices
for insert with check (true);
drop policy if exists "offline_devices_update" on public.offline_devices;
create policy "offline_devices_update" on public.offline_devices
for update using (true) with check (true);

drop policy if exists "categories_select_own" on public.categories;
create policy "categories_select_own" on public.categories
for select using (owner_type = 'offline' or owner_id = auth.uid()::text);
drop policy if exists "categories_insert_own" on public.categories;
create policy "categories_insert_own" on public.categories
for insert with check (owner_type = 'offline' or owner_id = auth.uid()::text);
drop policy if exists "categories_update_own" on public.categories;
create policy "categories_update_own" on public.categories
for update using (owner_type = 'offline' or owner_id = auth.uid()::text)
with check (owner_type = 'offline' or owner_id = auth.uid()::text);
drop policy if exists "categories_delete_own" on public.categories;
create policy "categories_delete_own" on public.categories
for delete using (owner_type = 'offline' or owner_id = auth.uid()::text);

drop policy if exists "transactions_select_own" on public.transactions;
create policy "transactions_select_own" on public.transactions
for select using (owner_type = 'offline' or owner_id = auth.uid()::text);
drop policy if exists "transactions_insert_own" on public.transactions;
create policy "transactions_insert_own" on public.transactions
for insert with check (owner_type = 'offline' or owner_id = auth.uid()::text);
drop policy if exists "transactions_update_own" on public.transactions;
create policy "transactions_update_own" on public.transactions
for update using (owner_type = 'offline' or owner_id = auth.uid()::text)
with check (owner_type = 'offline' or owner_id = auth.uid()::text);
drop policy if exists "transactions_delete_own" on public.transactions;
create policy "transactions_delete_own" on public.transactions
for delete using (owner_type = 'offline' or owner_id = auth.uid()::text);

drop policy if exists "recurring_schedules_select_own" on public.recurring_schedules;
create policy "recurring_schedules_select_own" on public.recurring_schedules
for select using (owner_type = 'offline' or owner_id = auth.uid()::text);
drop policy if exists "recurring_schedules_insert_own" on public.recurring_schedules;
create policy "recurring_schedules_insert_own" on public.recurring_schedules
for insert with check (owner_type = 'offline' or owner_id = auth.uid()::text);
drop policy if exists "recurring_schedules_update_own" on public.recurring_schedules;
create policy "recurring_schedules_update_own" on public.recurring_schedules
for update using (owner_type = 'offline' or owner_id = auth.uid()::text)
with check (owner_type = 'offline' or owner_id = auth.uid()::text);
drop policy if exists "recurring_schedules_delete_own" on public.recurring_schedules;
create policy "recurring_schedules_delete_own" on public.recurring_schedules
for delete using (owner_type = 'offline' or owner_id = auth.uid()::text);

drop policy if exists "budgets_select_own" on public.budgets;
create policy "budgets_select_own" on public.budgets
for select using (owner_type = 'offline' or owner_id = auth.uid()::text);
drop policy if exists "budgets_insert_own" on public.budgets;
create policy "budgets_insert_own" on public.budgets
for insert with check (owner_type = 'offline' or owner_id = auth.uid()::text);
drop policy if exists "budgets_update_own" on public.budgets;
create policy "budgets_update_own" on public.budgets
for update using (owner_type = 'offline' or owner_id = auth.uid()::text)
with check (owner_type = 'offline' or owner_id = auth.uid()::text);
drop policy if exists "budgets_delete_own" on public.budgets;
create policy "budgets_delete_own" on public.budgets
for delete using (owner_type = 'offline' or owner_id = auth.uid()::text);

drop policy if exists "recommendations_select_own" on public.recommendations;
create policy "recommendations_select_own" on public.recommendations
for select using (owner_type = 'offline' or owner_id = auth.uid()::text);
drop policy if exists "recommendations_insert_own" on public.recommendations;
create policy "recommendations_insert_own" on public.recommendations
for insert with check (owner_type = 'offline' or owner_id = auth.uid()::text);
drop policy if exists "recommendations_update_own" on public.recommendations;
create policy "recommendations_update_own" on public.recommendations
for update using (owner_type = 'offline' or owner_id = auth.uid()::text)
with check (owner_type = 'offline' or owner_id = auth.uid()::text);
drop policy if exists "recommendations_delete_own" on public.recommendations;
create policy "recommendations_delete_own" on public.recommendations
for delete using (owner_type = 'offline' or owner_id = auth.uid()::text);

drop policy if exists "lesson_progress_select_own" on public.lesson_progress;
create policy "lesson_progress_select_own" on public.lesson_progress
for select using (user_id = auth.uid());
drop policy if exists "lesson_progress_insert_own" on public.lesson_progress;
create policy "lesson_progress_insert_own" on public.lesson_progress
for insert with check (user_id = auth.uid());
drop policy if exists "lesson_progress_update_own" on public.lesson_progress;
create policy "lesson_progress_update_own" on public.lesson_progress
for update using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "lesson_progress_delete_own" on public.lesson_progress;
create policy "lesson_progress_delete_own" on public.lesson_progress
for delete using (user_id = auth.uid());

drop policy if exists "streaks_select_own" on public.streaks;
create policy "streaks_select_own" on public.streaks
for select using (user_id = auth.uid());
drop policy if exists "streaks_insert_own" on public.streaks;
create policy "streaks_insert_own" on public.streaks
for insert with check (user_id = auth.uid());
drop policy if exists "streaks_update_own" on public.streaks;
create policy "streaks_update_own" on public.streaks
for update using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "streaks_delete_own" on public.streaks;
create policy "streaks_delete_own" on public.streaks
for delete using (user_id = auth.uid());

drop policy if exists "user_badges_select_own" on public.user_badges;
create policy "user_badges_select_own" on public.user_badges
for select using (user_id = auth.uid());
drop policy if exists "user_badges_insert_own" on public.user_badges;
create policy "user_badges_insert_own" on public.user_badges
for insert with check (user_id = auth.uid());
drop policy if exists "user_badges_update_own" on public.user_badges;
create policy "user_badges_update_own" on public.user_badges
for update using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "user_badges_delete_own" on public.user_badges;
create policy "user_badges_delete_own" on public.user_badges
for delete using (user_id = auth.uid());

drop policy if exists "saving_challenges_select_own" on public.saving_challenges;
create policy "saving_challenges_select_own" on public.saving_challenges
for select using (user_id = auth.uid());
drop policy if exists "saving_challenges_insert_own" on public.saving_challenges;
create policy "saving_challenges_insert_own" on public.saving_challenges
for insert with check (user_id = auth.uid());
drop policy if exists "saving_challenges_update_own" on public.saving_challenges;
create policy "saving_challenges_update_own" on public.saving_challenges
for update using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "saving_challenges_delete_own" on public.saving_challenges;
create policy "saving_challenges_delete_own" on public.saving_challenges
for delete using (user_id = auth.uid());

drop policy if exists "subscriptions_select_own" on public.subscriptions;
create policy "subscriptions_select_own" on public.subscriptions
for select using (user_id = auth.uid());
drop policy if exists "subscriptions_insert_own" on public.subscriptions;
create policy "subscriptions_insert_own" on public.subscriptions
for insert with check (user_id = auth.uid());
drop policy if exists "subscriptions_update_own" on public.subscriptions;
create policy "subscriptions_update_own" on public.subscriptions
for update using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "subscriptions_delete_own" on public.subscriptions;
create policy "subscriptions_delete_own" on public.subscriptions
for delete using (user_id = auth.uid());

drop policy if exists "sync_state_select_own" on public.sync_state;
create policy "sync_state_select_own" on public.sync_state
for select using (user_id = auth.uid());
drop policy if exists "sync_state_insert_own" on public.sync_state;
create policy "sync_state_insert_own" on public.sync_state
for insert with check (user_id = auth.uid());
drop policy if exists "sync_state_update_own" on public.sync_state;
create policy "sync_state_update_own" on public.sync_state
for update using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "sync_state_delete_own" on public.sync_state;
create policy "sync_state_delete_own" on public.sync_state
for delete using (user_id = auth.uid());
