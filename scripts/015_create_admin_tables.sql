-- Create system_settings table for storing configuration
CREATE TABLE IF NOT EXISTS public.system_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create activity_logs table for tracking admin actions
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    target_type TEXT,
    target_id TEXT,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create patterns table for gallery management (if not exists)
CREATE TABLE IF NOT EXISTS public.patterns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    pattern_data JSONB,
    is_public BOOLEAN DEFAULT FALSE,
    likes_count INTEGER DEFAULT 0,
    views_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON public.system_settings(key);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_patterns_user_id ON public.patterns(user_id);
CREATE INDEX IF NOT EXISTS idx_patterns_is_public ON public.patterns(is_public);
CREATE INDEX IF NOT EXISTS idx_patterns_created_at ON public.patterns(created_at);

-- Enable Row Level Security
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patterns ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for system_settings (admin only)
CREATE POLICY "Only admins can view system settings" ON public.system_settings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Only admins can modify system settings" ON public.system_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- Create RLS policies for activity_logs (admin only)
CREATE POLICY "Only admins can view activity logs" ON public.activity_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Only admins can insert activity logs" ON public.activity_logs
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- Create RLS policies for patterns
CREATE POLICY "Users can view their own patterns" ON public.patterns
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view public patterns" ON public.patterns
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can insert their own patterns" ON public.patterns
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own patterns" ON public.patterns
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own patterns" ON public.patterns
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all patterns" ON public.patterns
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Admins can update all patterns" ON public.patterns
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_system_settings_updated_at 
    BEFORE UPDATE ON public.system_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patterns_updated_at 
    BEFORE UPDATE ON public.patterns 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default system settings
INSERT INTO public.system_settings (key, value, description) VALUES
    ('free_user_download_limit', '5', '免费用户每月下载次数限制'),
    ('payment_enabled', 'false', '是否启用支付功能'),
    ('stripe_public_key', '', 'Stripe 公钥'),
    ('stripe_secret_key', '', 'Stripe 私钥'),
    ('gallery_moderation', 'true', '是否启用作品审核')
ON CONFLICT (key) DO NOTHING;
