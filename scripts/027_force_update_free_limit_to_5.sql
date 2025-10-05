-- 强制更新所有免费用户的下载限制为5次
-- 这个脚本会确保所有免费用户的限制都是5次，不是10次

-- 更新所有免费计划的用户订阅限制
UPDATE user_subscriptions 
SET monthly_generations_limit = 5
WHERE plan_type = 'free' AND monthly_generations_limit != 5;

-- 如果用户当前使用次数超过5次，将其调整为5次
UPDATE user_subscriptions 
SET monthly_generations_used = 5
WHERE plan_type = 'free' AND monthly_generations_used > 5;

-- 更新系统设置中的免费用户默认限制
UPDATE system_settings 
SET setting_value = '5'
WHERE setting_key = 'free_user_monthly_limit' AND setting_value != '5';

-- 如果系统设置不存在，则插入
INSERT INTO system_settings (setting_key, setting_value, description)
SELECT 'free_user_monthly_limit', '5', '免费用户每月下载限制'
WHERE NOT EXISTS (
    SELECT 1 FROM system_settings WHERE setting_key = 'free_user_monthly_limit'
);

-- 验证更新结果
SELECT 
    plan_type,
    COUNT(*) as user_count,
    monthly_generations_limit,
    AVG(monthly_generations_used) as avg_used
FROM user_subscriptions 
WHERE plan_type = 'free'
GROUP BY plan_type, monthly_generations_limit;
