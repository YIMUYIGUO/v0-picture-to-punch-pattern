-- Fix admin_activity_log RLS policy to allow INSERT operations
-- The table was missing an INSERT policy, causing 403 errors when admins try to log activities

-- Add INSERT policy for admin_activity_log table
CREATE POLICY "Admins can insert activity log" ON admin_activity_log
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Also add UPDATE and DELETE policies for completeness (though not currently used)
CREATE POLICY "Admins can update activity log" ON admin_activity_log
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Super admins can delete activity log" ON admin_activity_log
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'super_admin'
    )
  );
