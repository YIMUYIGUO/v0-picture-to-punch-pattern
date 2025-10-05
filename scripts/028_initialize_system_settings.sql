-- 初始化系统设置表，确保所有必要的设置都存在
-- 如果设置已存在则不会覆盖现有值

INSERT INTO system_settings (key, value, description, created_at, updated_at)
VALUES 
  ('free_user_download_limit', '6', '免费用户每月下载次数限制', NOW(), NOW()),
  ('payment_enabled', 'false', '是否启用支付功能', NOW(), NOW()),
  ('gallery_moderation', 'false', '是否启用作品审核', NOW(), NOW()),
  ('stripe_public_key', '', 'Stripe 可发布密钥', NOW(), NOW()),
  ('stripe_secret_key', '', 'Stripe 秘密密钥', NOW(), NOW()),
  ('alipay_app_id', '', '支付宝应用ID', NOW(), NOW()),
  ('alipay_private_key', '', '支付宝应用私钥', NOW(), NOW()),
  ('alipay_public_key', '', '支付宝公钥', NOW(), NOW()),
  ('hupijiao_mchid', '', '虎皮椒商户号', NOW(), NOW()),
  ('hupijiao_app_secret', '', '虎皮椒应用密钥', NOW(), NOW())
ON CONFLICT (key) DO NOTHING;

-- 确保免费用户下载限制设置为6次（如果管理员之前设置过，则保持原值）
UPDATE system_settings 
SET value = '6', updated_at = NOW()
WHERE key = 'free_user_download_limit' 
AND value = '5';

-- 更新所有现有免费订阅的限制为当前系统设置值
UPDATE subscriptions 
SET monthly_generations_limit = (
  SELECT CAST(value AS INTEGER) 
  FROM system_settings 
  WHERE key = 'free_user_download_limit'
)
WHERE plan_type = 'free' 
AND monthly_generations_limit != (
  SELECT CAST(value AS INTEGER) 
  FROM system_settings 
  WHERE key = 'free_user_download_limit'
);
