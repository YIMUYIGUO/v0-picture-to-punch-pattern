-- Remove all payment method constraints and simplify subscription system
-- Only gift code redemption will be supported

-- Drop the payment method constraint that only allowed 'alipay' and 'hupijiao'
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_payment_method_check;

-- Remove payment_method column entirely since we only use gift codes
ALTER TABLE public.subscriptions DROP COLUMN IF EXISTS payment_method;

-- Remove payment_id column if it still exists
ALTER TABLE public.subscriptions DROP COLUMN IF EXISTS payment_id;

-- Update system settings to disable payment
UPDATE public.system_settings 
SET value = 'false' 
WHERE key = 'payment_enabled';

-- Add a comment to document the change
COMMENT ON TABLE public.subscriptions IS 'Subscriptions table - only supports gift code redemption, no payment methods';

-- Show the updated table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'subscriptions' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Confirm payment is disabled
SELECT key, value FROM public.system_settings WHERE key = 'payment_enabled';
