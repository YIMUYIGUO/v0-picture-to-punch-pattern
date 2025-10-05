-- Remove payment system tables and related data
-- This script cleans up all payment-related database objects

-- Drop payment orders table
DROP TABLE IF EXISTS public.payment_orders CASCADE;

-- Remove payment-related settings
DELETE FROM public.admin_settings 
WHERE key IN (
  'payment_enabled',
  'stripe_public_key', 
  'stripe_secret_key',
  'hupijiao_mchid',
  'hupijiao_app_secret'
);

-- Update subscriptions table to remove payment method constraint
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_payment_method_check;

-- Add simpler payment method constraint (keeping only essential methods)
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_payment_method_check
CHECK (payment_method IN ('manual', 'free'));

-- Update any existing records to use 'free' payment method
UPDATE public.subscriptions 
SET payment_method = 'free'
WHERE payment_method NOT IN ('manual', 'free');

-- Remove payment-related columns if they exist
ALTER TABLE public.subscriptions DROP COLUMN IF EXISTS payment_id;

COMMENT ON SCRIPT IS 'Cleanup script to remove complex payment system and simplify to manual/free only';
