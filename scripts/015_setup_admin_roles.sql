-- Setup admin roles and permissions
-- Add role column to profiles if not exists and create admin functions

-- Update profiles table to include role column with proper constraints
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS role text DEFAULT 'user' 
CHECK (role IN ('user', 'admin', 'super_admin'));

-- Create index for role queries
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Add system settings table for admin configuration
CREATE TABLE IF NOT EXISTS system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Insert default system settings
INSERT INTO system_settings (key, value, description) VALUES
  ('free_user_download_limit', '5', 'Maximum downloads per month for free users'),
  ('payment_enabled', 'false', 'Whether payment system is enabled'),
  ('stripe_public_key', '""', 'Stripe public key for payments'),
  ('stripe_secret_key', '""', 'Stripe secret key for payments'),
  ('gallery_moderation', 'true', 'Whether gallery requires moderation')
ON CONFLICT (key) DO NOTHING;

-- Create admin activity log table
CREATE TABLE IF NOT EXISTS admin_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES profiles(id),
  action text NOT NULL,
  target_type text, -- 'user', 'pattern', 'setting'
  target_id uuid,
  details jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- RLS policies for system_settings (only admins can access)
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view system settings" ON system_settings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Super admins can modify system settings" ON system_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'super_admin'
    )
  );

-- RLS policies for admin activity log
ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view activity log" ON admin_activity_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Function to log admin activities
CREATE OR REPLACE FUNCTION log_admin_activity(
  p_action text,
  p_target_type text DEFAULT NULL,
  p_target_id uuid DEFAULT NULL,
  p_details jsonb DEFAULT NULL
) RETURNS void AS $$
BEGIN
  INSERT INTO admin_activity_log (admin_id, action, target_type, target_id, details)
  VALUES (auth.uid(), p_action, p_target_type, p_target_id, p_details);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create first super admin (replace with your email)
-- This will be handled by the create-admin API endpoint
