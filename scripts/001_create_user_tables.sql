-- Create user profiles table
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create subscriptions table
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_type text not null check (plan_type in ('free', 'monthly', 'yearly')),
  status text not null check (status in ('active', 'expired', 'cancelled')) default 'active',
  usage_count integer not null default 0,
  usage_limit integer not null,
  expires_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create usage logs table
create table if not exists public.usage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  panel_width integer not null,
  panel_height integer not null,
  holes_count integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.usage_logs enable row level security;

-- RLS policies for profiles
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);
create policy "profiles_delete_own" on public.profiles for delete using (auth.uid() = id);

-- RLS policies for subscriptions
create policy "subscriptions_select_own" on public.subscriptions for select using (auth.uid() = user_id);
create policy "subscriptions_insert_own" on public.subscriptions for insert with check (auth.uid() = user_id);
create policy "subscriptions_update_own" on public.subscriptions for update using (auth.uid() = user_id);
create policy "subscriptions_delete_own" on public.subscriptions for delete using (auth.uid() = user_id);

-- RLS policies for usage_logs
create policy "usage_logs_select_own" on public.usage_logs for select using (auth.uid() = user_id);
create policy "usage_logs_insert_own" on public.usage_logs for insert with check (auth.uid() = user_id);
create policy "usage_logs_update_own" on public.usage_logs for update using (auth.uid() = user_id);
create policy "usage_logs_delete_own" on public.usage_logs for delete using (auth.uid() = user_id);
