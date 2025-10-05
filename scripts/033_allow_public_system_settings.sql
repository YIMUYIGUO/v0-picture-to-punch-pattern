-- Allow public read access to specific system settings
-- This fixes the "Failed to fetch" error in the settings API

-- Create a policy to allow public read access to specific settings
CREATE POLICY "Public can view specific system settings" ON public.system_settings
  FOR SELECT 
  USING (
    key IN (
      'free_user_download_limit',
      'payment_enabled',
      'gallery_moderation',
      'max_panel_size_free',
      'max_panel_size_pro',
      'max_panel_size_enterprise'
    )
  );

-- Grant select permission to anon users for system_settings
GRANT SELECT ON public.system_settings TO anon;
GRANT SELECT ON public.system_settings TO authenticated;

-- Verify the policy was created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'system_settings'
ORDER BY policyname;
