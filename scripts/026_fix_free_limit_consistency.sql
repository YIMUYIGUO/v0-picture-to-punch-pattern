-- 修复免费版下载次数不一致的问题
-- 确保所有地方都显示5次免费下载

-- 更新订阅表的默认限制为5次
ALTER TABLE public.subscriptions 
ALTER COLUMN monthly_generations_limit SET DEFAULT 5;

-- 更新所有现有免费用户的限制为5次
UPDATE public.subscriptions 
SET monthly_generations_limit = 5 
WHERE plan_type = 'free' AND monthly_generations_limit != 5;

-- 确保系统设置中的免费用户限制为5次
UPDATE public.system_settings 
SET setting_value = '5' 
WHERE setting_key = 'free_user_download_limit';

-- 如果系统设置不存在，则插入
INSERT INTO public.system_settings (setting_key, setting_value, description)
VALUES ('free_user_download_limit', '5', '免费用户每月下载次数限制')
ON CONFLICT (setting_key) DO UPDATE SET setting_value = '5';

-- 确保所有免费用户的使用次数不超过新的限制
UPDATE public.subscriptions 
SET monthly_generations_used = LEAST(monthly_generations_used, 5)
WHERE plan_type = 'free' AND monthly_generations_used > 5;
