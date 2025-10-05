-- Create missing subscriptions for users who don't have them
-- This script ensures all authenticated users have a default subscription

-- First, ensure all authenticated users have profiles
INSERT INTO public.profiles (id, email, role)
SELECT 
    au.id,
    au.email,
    'user'
FROM auth.users au
WHERE au.id NOT IN (SELECT id FROM public.profiles WHERE id IS NOT NULL)
ON CONFLICT (id) DO NOTHING;

-- Then, create default subscriptions for users without them
INSERT INTO public.subscriptions (user_id, plan_type, status, monthly_generations_limit, monthly_generations_used)
SELECT 
    p.id,
    'free',
    'active',
    10,
    0
FROM public.profiles p
WHERE p.id NOT IN (SELECT user_id FROM public.subscriptions WHERE user_id IS NOT NULL)
ON CONFLICT (user_id) DO NOTHING;

-- Update any existing subscriptions to use the new field names if they're using old ones
-- This handles migration from old schema to new schema
UPDATE public.subscriptions 
SET 
    monthly_generations_limit = COALESCE(monthly_generations_limit, usage_limit, 10),
    monthly_generations_used = COALESCE(monthly_generations_used, usage_count, 0)
WHERE monthly_generations_limit IS NULL OR monthly_generations_used IS NULL;
