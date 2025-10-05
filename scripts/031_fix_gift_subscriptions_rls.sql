-- Fix RLS policies for gift_subscriptions table
-- Remove the problematic policy that references auth.users
DROP POLICY IF EXISTS "Users can view their gift subscriptions" ON gift_subscriptions;

-- Create a simpler policy for users to view their own gift subscriptions
-- This avoids the auth.users reference that was causing permission issues
CREATE POLICY "Users can view their gift subscriptions" ON gift_subscriptions
  FOR SELECT USING (
    recipient_user_id = auth.uid()
  );

-- Ensure service role can bypass RLS (this should be default but let's be explicit)
-- Note: Service role key should automatically bypass RLS, but we can add this for clarity
CREATE POLICY "Service role full access" ON gift_subscriptions
  FOR ALL USING (true)
  WITH CHECK (true);

-- Grant necessary permissions to service role
GRANT ALL ON gift_subscriptions TO service_role;
GRANT ALL ON profiles TO service_role;
