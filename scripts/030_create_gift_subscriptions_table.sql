-- Create gift subscriptions table for managing subscription gifts
CREATE TABLE IF NOT EXISTS gift_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Gift details
  gift_code VARCHAR(20) UNIQUE NOT NULL,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('monthly', 'yearly')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'redeemed', 'expired', 'cancelled')),
  
  -- Gift creator (admin who created the gift)
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Gift recipient
  recipient_email TEXT,
  recipient_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Redemption details
  redeemed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
  
  -- Gift metadata
  notes TEXT,
  amount DECIMAL(10,2) -- For tracking gift value
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_gift_subscriptions_gift_code ON gift_subscriptions(gift_code);
CREATE INDEX IF NOT EXISTS idx_gift_subscriptions_status ON gift_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_gift_subscriptions_created_by ON gift_subscriptions(created_by);
CREATE INDEX IF NOT EXISTS idx_gift_subscriptions_recipient_email ON gift_subscriptions(recipient_email);

-- Add RLS policies
ALTER TABLE gift_subscriptions ENABLE ROW LEVEL SECURITY;

-- Admins can manage all gift subscriptions
CREATE POLICY "Admins can manage gift subscriptions" ON gift_subscriptions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Users can view their own gift subscriptions
CREATE POLICY "Users can view their gift subscriptions" ON gift_subscriptions
  FOR SELECT USING (
    recipient_user_id = auth.uid() OR 
    recipient_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_gift_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_gift_subscriptions_updated_at
  BEFORE UPDATE ON gift_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_gift_subscriptions_updated_at();

-- Add to subscriptions table to track if it's from a gift
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS gift_subscription_id UUID REFERENCES gift_subscriptions(id) ON DELETE SET NULL;
