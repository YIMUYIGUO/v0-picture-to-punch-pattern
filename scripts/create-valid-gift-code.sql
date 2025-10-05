-- 创建一个有效的礼品兑换码用于测试
-- 首先更新现有的已取消的兑换码为活跃状态
UPDATE gift_subscriptions 
SET 
  status = 'active',
  updated_at = NOW()
WHERE gift_code = 'YIZDFSHDGOTZ' AND status = 'cancelled';

-- 如果上面的更新没有影响任何行，则插入一个新的有效兑换码
INSERT INTO gift_subscriptions (
  id,
  gift_code,
  plan_type,
  status,
  amount,
  expires_at,
  created_at,
  updated_at,
  created_by
)
SELECT 
  gen_random_uuid(),
  'TESTGIFT2024',
  'monthly',
  'active',
  39.9,
  NOW() + INTERVAL '30 days',
  NOW(),
  NOW(),
  (SELECT id FROM profiles LIMIT 1)
WHERE NOT EXISTS (
  SELECT 1 FROM gift_subscriptions WHERE gift_code = 'TESTGIFT2024'
);

-- 验证结果
SELECT 
  gift_code,
  plan_type,
  status,
  amount,
  expires_at,
  created_at
FROM gift_subscriptions 
WHERE gift_code IN ('YIZDFSHDGOTZ', 'TESTGIFT2024')
ORDER BY created_at DESC;
