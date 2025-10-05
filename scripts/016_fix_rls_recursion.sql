-- Fix infinite recursion in RLS policies for profiles table
-- The issue is that admin policies query the profiles table within profiles table policies

-- First, drop the problematic policies
DROP POLICY IF EXISTS "profiles_select_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_admin" ON public.profiles;
DROP POLICY IF EXISTS "Only admins can view system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Only admins can modify system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Only admins can view activity logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Only admins can insert activity logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Admins can view all patterns" ON public.patterns;
DROP POLICY IF EXISTS "Admins can update all patterns" ON public.patterns;

-- Create a security definer function to check admin role without recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND (raw_user_meta_data ->> 'role')::text IN ('admin', 'super_admin')
  );
$$;

-- Alternative function using a direct query to avoid recursion
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1),
    'user'
  );
$$;

-- Create new non-recursive policies for profiles
CREATE POLICY "profiles_select_admin" ON public.profiles
  FOR SELECT USING (
    auth.uid() = id OR 
    public.get_user_role() IN ('admin', 'super_admin')
  );

CREATE POLICY "profiles_update_admin" ON public.profiles
  FOR UPDATE USING (
    auth.uid() = id OR 
    public.get_user_role() IN ('admin', 'super_admin')
  );

-- Recreate system_settings policies with non-recursive check
CREATE POLICY "Only admins can view system settings" ON public.system_settings
  FOR SELECT USING (public.get_user_role() IN ('admin', 'super_admin'));

CREATE POLICY "Only admins can modify system settings" ON public.system_settings
  FOR ALL USING (public.get_user_role() IN ('admin', 'super_admin'));

-- Recreate activity_logs policies
CREATE POLICY "Only admins can view activity logs" ON public.activity_logs
  FOR SELECT USING (public.get_user_role() IN ('admin', 'super_admin'));

CREATE POLICY "Only admins can insert activity logs" ON public.activity_logs
  FOR INSERT WITH CHECK (public.get_user_role() IN ('admin', 'super_admin'));

-- Recreate patterns policies for admins
CREATE POLICY "Admins can view all patterns" ON public.patterns
  FOR SELECT USING (public.get_user_role() IN ('admin', 'super_admin'));

CREATE POLICY "Admins can update all patterns" ON public.patterns
  FOR UPDATE USING (public.get_user_role() IN ('admin', 'super_admin'));

-- Fix subscriptions table constraint issue
-- Drop the problematic check constraint and recreate it properly
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_payment_method_check;

-- Add the correct constraint for payment_method
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_payment_method_check 
  CHECK (payment_method IN ('stripe', 'alipay', 'wechat', 'manual', 'free'));

-- Update any existing records that might have invalid payment_method values
UPDATE public.subscriptions 
SET payment_method = 'free' 
WHERE payment_method IS NULL OR payment_method NOT IN ('stripe', 'alipay', 'wechat', 'manual', 'free');

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated;
