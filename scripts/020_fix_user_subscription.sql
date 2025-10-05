-- Fix subscription for existing authenticated users
-- This script ensures all authenticated users have a default subscription

-- First, ensure the user has a profile
INSERT INTO public.profiles (id, email, created_at, updated_at)
SELECT 
  id, 
  email, 
  created_at, 
  updated_at
FROM auth.users 
WHERE id = '410f152a-7c3c-4989-a671-7a1472fc42a0'
ON CONFLICT (id) DO NOTHING;

-- Then create a default subscription for this user
INSERT INTO public.subscriptions (
  user_id, 
  plan_type, 
  status, 
  monthly_generations_limit, 
  monthly_generations_used,
  created_at,
  updated_at
)
VALUES (
  '410f152a-7c3c-4989-a671-7a1472fc42a0',
  'free',
  'active',
  10,
  0,
  NOW(),
  NOW()
)
ON CONFLICT (user_id) DO UPDATE SET
  status = 'active',
  monthly_generations_limit = GREATEST(subscriptions.monthly_generations_limit, 10),
  updated_at = NOW();

-- Also fix any other authenticated users who might be missing subscriptions
INSERT INTO public.subscriptions (
  user_id, 
  plan_type, 
  status, 
  monthly_generations_limit, 
  monthly_generations_used,
  created_at,
  updated_at
)
SELECT 
  p.id,
  'free',
  'active',
  10,
  0,
  NOW(),
  NOW()
FROM public.profiles p
LEFT JOIN public.subscriptions s ON p.id = s.user_id
WHERE s.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;
