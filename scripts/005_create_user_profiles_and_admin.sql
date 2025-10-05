-- Create profiles table for user management
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  role text default 'user' check (role in ('user', 'admin', 'super_admin')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Policies for profiles
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_select_admin"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'super_admin')
    )
  );

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

create policy "profiles_update_admin"
  on public.profiles for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'super_admin')
    )
  );

-- Auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Update shared_patterns to use display_name from profiles
alter table public.shared_patterns add column if not exists user_display_name text;

-- Function to update user_display_name when sharing
create or replace function public.update_shared_pattern_user_name()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Update user_display_name from profiles table
  update public.shared_patterns 
  set user_display_name = (
    select display_name 
    from public.profiles 
    where id = new.user_id
  )
  where id = new.id;
  
  return new;
end;
$$;

drop trigger if exists on_shared_pattern_created on public.shared_patterns;

create trigger on_shared_pattern_created
  after insert on public.shared_patterns
  for each row
  execute function public.update_shared_pattern_user_name();
