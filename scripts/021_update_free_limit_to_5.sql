-- 统一免费版下载次数为5次
-- 将所有免费用户的月度下载限制从10次改为5次

-- 更新现有免费用户的限制
UPDATE public.subscriptions 
SET monthly_generations_limit = 5
WHERE plan_type = 'free' AND monthly_generations_limit = 10;

-- 更新表的默认值
ALTER TABLE public.subscriptions 
ALTER COLUMN monthly_generations_limit SET DEFAULT 5;

-- 为任何没有订阅的用户创建5次限制的免费订阅
INSERT INTO public.subscriptions (user_id, plan_type, monthly_generations_limit, monthly_generations_used)
SELECT 
    p.id,
    'free',
    5,
    0
FROM public.profiles p
LEFT JOIN public.subscriptions s ON p.id = s.user_id
WHERE s.user_id IS NULL
ON CONFLICT (user_id) DO UPDATE SET
    monthly_generations_limit = CASE 
        WHEN subscriptions.plan_type = 'free' THEN 5
        ELSE subscriptions.monthly_generations_limit
    END;

-- 确保所有免费用户的使用次数不超过新的限制
UPDATE public.subscriptions 
SET monthly_generations_used = LEAST(monthly_generations_used, 5)
WHERE plan_type = 'free' AND monthly_generations_limit = 5;
