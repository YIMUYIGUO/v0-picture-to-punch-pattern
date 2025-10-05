-- 创建定期检查订阅过期状态的函数
CREATE OR REPLACE FUNCTION check_and_update_expired_subscriptions()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    -- 更新所有过期的活跃订阅
    UPDATE public.subscriptions 
    SET status = 'expired'
    WHERE status = 'active' 
    AND current_period_end IS NOT NULL 
    AND current_period_end < NOW();
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    
    -- 记录日志
    INSERT INTO public.system_logs (event_type, message, created_at)
    VALUES ('subscription_expiry_check', 
            'Updated ' || updated_count || ' expired subscriptions', 
            NOW());
    
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- 创建系统日志表（如果不存在）
CREATE TABLE IF NOT EXISTS public.system_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type TEXT NOT NULL,
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_system_logs_event_type ON public.system_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON public.system_logs(created_at);

-- 启用行级安全
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

-- 只允许管理员查看系统日志
CREATE POLICY "Only admins can view system logs" ON public.system_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
