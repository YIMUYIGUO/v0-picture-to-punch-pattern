-- ��保面板尺寸限制设置项存在于数据库中
-- 这个脚本将添加或更新面板尺寸限制的系统设置

INSERT INTO system_settings (key, value, description) VALUES
('max_panel_size_free', '1200', '免费用户最大面板尺寸(mm)'),
('max_panel_size_pro', '5000', '专业用户最大面板尺寸(mm)'),
('max_panel_size_enterprise', '99999', '企业用户最大面板尺寸(mm)')
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  description = EXCLUDED.description,
  updated_at = NOW();

-- 验证设置项是否正确插入
SELECT key, value, description FROM system_settings 
WHERE key IN ('max_panel_size_free', 'max_panel_size_pro', 'max_panel_size_enterprise')
ORDER BY key;
