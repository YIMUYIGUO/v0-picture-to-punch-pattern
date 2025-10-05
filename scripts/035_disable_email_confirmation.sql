-- 禁用邮件确认要求
-- 这样用户注册后可以直接登录，不需要确认邮件

-- 方法1: 自动确认所有新注册用户
-- 创建触发器函数
CREATE OR REPLACE FUNCTION public.auto_confirm_user()
RETURNS TRIGGER AS $$
BEGIN
    -- 自动设置邮件确认时间
    IF NEW.email_confirmed_at IS NULL THEN
        NEW.email_confirmed_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建触发器
DROP TRIGGER IF EXISTS auto_confirm_user_trigger ON auth.users;
CREATE TRIGGER auto_confirm_user_trigger
    BEFORE INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_confirm_user();

-- 方法2: 确认所有现有未确认的用户
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;

-- 验证
SELECT 
    email,
    email_confirmed_at,
    CASE WHEN email_confirmed_at IS NOT NULL THEN '已确认' ELSE '未确认' END as status
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;
