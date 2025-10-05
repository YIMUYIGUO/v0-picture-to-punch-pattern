-- Function to handle new user registration
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Create profile
  insert into public.profiles (id, email)
  values (
    new.id,
    new.email
  );
  
  -- Create free subscription (first time use)
  insert into public.subscriptions (user_id, plan_type, usage_count, usage_limit)
  values (
    new.id,
    'free',
    0,
    1  -- Free users get 1 use with 1200x1200 limit
  );
  
  return new;
end;
$$;

-- Trigger for new user creation
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
