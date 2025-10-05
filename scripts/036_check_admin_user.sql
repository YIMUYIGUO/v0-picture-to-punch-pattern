-- 检查管理员用户是否存在
-- 这个脚本用于验证管理员账户的状态

-- 1. 检查 auth.users 表中的管理员用户
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_user_meta_data
FROM auth.users
WHERE email = 'admin@example.com';

-- 2. 检查 profiles 表中的管理员记录
SELECT 
    id,
    email,
    role,
    subscription_status,
    subscription_end_date,
    created_at,
    updated_at
FROM profiles
WHERE email = 'admin@example.com';

-- 3. 如果需要手动设置用户为管理员（在确认用户存在后）
-- UPDATE profiles 
-- SET role = 'admin', 
--     subscription_status = 'active',
--     subscription_end_date = NOW() + INTERVAL '1 year'
-- WHERE email = 'admin@example.com';
