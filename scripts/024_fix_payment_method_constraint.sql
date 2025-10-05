-- 修复payment_method约束问题，允许NULL值用于免费订阅
-- 更新现有的约束，允许payment_method为NULL
ALTER TABLE public.subscriptions 
DROP CONSTRAINT IF EXISTS subscriptions_payment_method_check;

-- 重新创建约束，允许NULL值或指定的支付方式
ALTER TABLE public.subscriptions 
ADD CONSTRAINT subscriptions_payment_method_check 
CHECK (payment_method IS NULL OR payment_method IN ('alipay', 'hupijiao'));

-- 清理现有的无效数据
UPDATE public.subscriptions 
SET payment_method = NULL, payment_id = NULL, amount = NULL
WHERE plan_type = 'free';

-- 确保免费用户的订阅数据正确
UPDATE public.subscriptions 
SET 
  monthly_generations_limit = 5,
  payment_method = NULL,
  payment_id = NULL,
  amount = NULL
WHERE plan_type = 'free';
