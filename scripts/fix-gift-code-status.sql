-- 修复礼品兑换码状态，将已取消的兑换码改为可用状态
-- Fix gift code status by changing cancelled codes to active

-- 首先查看当前状态
SELECT 
    gift_code, 
    status, 
    plan_type, 
    amount, 
    expires_at,
    created_at
FROM gift_subscriptions 
WHERE gift_code = 'YIZDFSHDGOTZ';

-- 更新礼品码状态为可用
UPDATE gift_subscriptions 
SET 
    status = 'active',
    updated_at = NOW()
WHERE gift_code = 'YIZDFSHDGOTZ' AND status = 'cancelled';

-- 验证更新结果
SELECT 
    gift_code, 
    status, 
    plan_type, 
    amount, 
    expires_at,
    updated_at
FROM gift_subscriptions 
WHERE gift_code = 'YIZDFSHDGOTZ';

-- 显示更新确认信息
SELECT 
    CASE 
        WHEN status = 'active' THEN '✅ 礼品码状态已成功更新为可用'
        ELSE '❌ 礼品码状态更新失败'
    END as result
FROM gift_subscriptions 
WHERE gift_code = 'YIZDFSHDGOTZ';
