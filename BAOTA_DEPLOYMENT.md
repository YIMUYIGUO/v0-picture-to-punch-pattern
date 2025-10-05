# 宝塔面板部署指南

## 前置要求

1. **安装 Node.js**（推荐 18.x 或更高版本）
   - 在宝塔面板 → 软件商店 → 搜索 "Node.js" → 安装

2. **安装 MySQL**（推荐 5.7 或 8.0）
   - 在宝塔面板 → 软件商店 → 搜索 "MySQL" → 安装

3. **安装 PM2**（进程管理器）
   \`\`\`bash
   npm install -g pm2
   \`\`\`

## 部署步骤

### 1. 创建数据库

在宝塔面板 → 数据库 → 添加数据库：
- 数据库名：`punch_pattern_db`（或自定义）
- 用户名：`punch_user`（或自定义）
- 密码：设置一个强密码
- 访问权限：本地服务器

### 2. 配置环境变量

编辑 `.env.production` 文件，填入您的配置：

\`\`\`bash
# 数据库配置（必填）
DATABASE_URL="mysql://punch_user:您的密码@localhost:3306/punch_pattern_db"

# NextAuth 配置（必填）
NEXTAUTH_URL="http://您的域名或IP:3000"
NEXTAUTH_SECRET="生成一个随机字符串"  # 运行: openssl rand -base64 32

# 腾讯云 COS 配置（二选一）
COS_SECRET_ID="您的腾讯云SecretId"
COS_SECRET_KEY="您的腾讯云SecretKey"
COS_BUCKET="您的存储桶名称"
COS_REGION="ap-guangzhou"  # 您的地域

# 阿里云 OSS 配置（二选一）
OSS_ACCESS_KEY_ID="您的阿里云AccessKeyId"
OSS_ACCESS_KEY_SECRET="您的阿里云AccessKeySecret"
OSS_BUCKET="您的存储桶名称"
OSS_REGION="oss-cn-hangzhou"  # 您的地域

# 虎皮椒支付配置（可选）
HUPIJIAO_MCHID="您的商户号"
NEXT_PUBLIC_HUPIJIAO_MCHID="您的商户号"
\`\`\`

### 3. 上传代码

使用 FTP 或宝塔文件管理器，将项目上传到：
\`\`\`
/www/wwwroot/punch-pattern-app
\`\`\`

### 4. 运行部署脚本

SSH 连接到服务器，根据情况选择部署方式：

#### 方式 A：全新部署（数据库为空）

\`\`\`bash
cd /www/wwwroot/punch-pattern-app
chmod +x migrate_to_mysql.sh
./migrate_to_mysql.sh
\`\`\`

#### 方式 B：安全迁移（数据库已有数据）⭐ 推荐

\`\`\`bash
cd /www/wwwroot/punch-pattern-app
chmod +x safe_migrate.sh
./safe_migrate.sh
\`\`\`

**safe_migrate.sh 会自动：**
- ✅ 备份现有数据库
- ✅ 迁移现有数据以匹配新 schema
- ✅ 安全推送 Prisma schema
- ✅ 构建并启动应用

### 5. 配置反向代理（可选）

如果要使用域名访问，在宝塔面板 → 网站 → 添加站点：

1. 创建站点，绑定域名
2. 设置反向代理：
   - 目标 URL：`http://127.0.0.1:3000`
   - 发送域名：`$host`
   - 启用缓存：否

### 6. 配置 SSL 证书（推荐）

在宝塔面板 → 网站 → SSL → Let's Encrypt：
- 申请免费证书
- 强制 HTTPS

记得更新 `.env.production` 中的 `NEXTAUTH_URL` 为 `https://您的域名`

## 常用命令

\`\`\`bash
# 查看应用状态
pm2 status

# 查看应用日志
pm2 logs punch-pattern-app

# 重启应用
pm2 restart punch-pattern-app

# 停止应用
pm2 stop punch-pattern-app

# 查看数据库
npx prisma studio
\`\`\`

## 故障排查

### 问题 1：Prisma schema 推送失败（数据库已有数据）

**错误信息**：
\`\`\`
⚠️ We found changes that cannot be executed:
  • Added the required column `xxx` to the `xxx` table without a default value
\`\`\`

**解决方案**：
\`\`\`bash
# 使用安全迁移脚本
chmod +x safe_migrate.sh
./safe_migrate.sh
\`\`\`

这个脚本会：
1. 自动备份数据库到 `backup_YYYYMMDD_HHMMSS.sql`
2. 执行 `scripts/migrate_existing_data.sql` 迁移现有数据
3. 安全推送 Prisma schema

### 问题 2：Prisma 找不到 DATABASE_URL

**原因**：环境变量未正确加载

**解决方案**：
\`\`\`bash
# 手动复制环境变量文件
cp .env.production .env

# 重新运行部署脚本
./migrate_to_mysql.sh
\`\`\`

### 问题 3：数据库连接失败

**检查项**：
1. MySQL 服务是否运行：`systemctl status mysql`
2. 数据库用户名密码是否正确
3. 数据库是否已创建
4. DATABASE_URL 格式是否正确

**测试连接**：
\`\`\`bash
mysql -u punch_user -p punch_pattern_db
\`\`\`

### 问题 4：端口 3000 被占用

**解决方案**：
\`\`\`bash
# 查看占用端口的进程
lsof -i :3000

# 修改端口（编辑 ecosystem.config.js）
PORT=3001 pm2 start ecosystem.config.js
\`\`\`

### 问题 5：构建失败

**解决方案**：
\`\`\`bash
# 清理缓存
rm -rf .next node_modules
npm install
npm run build
\`\`\`

### 问题 6：需要恢复数据库备份

\`\`\`bash
# 查看备份文件
ls -lh backup_*.sql

# 恢复备份（替换为实际的备份文件名）
mysql -u punch_user -p punch_pattern_db < backup_20240115_143022.sql
\`\`\`

## 更新应用

\`\`\`bash
cd /www/wwwroot/punch-pattern-app

# 拉取最新代码（如果使用 Git）
git pull

# 如果数据库 schema 有变化，使用安全迁移
./safe_migrate.sh

# 如果只是代码更新
npm install
npm run build
pm2 restart punch-pattern-app
\`\`\`

## 安全建议

1. ✅ 定期备份数据库
   \`\`\`bash
   # 手动备份
   mysqldump -u punch_user -p punch_pattern_db > backup_$(date +%Y%m%d).sql
   
   # 设置定时备份（宝塔面板 → 计划任务）
   \`\`\`

2. ✅ 使用强密码
3. ✅ 启用 HTTPS
4. ✅ 限制数据库访问权限
5. ✅ 定期更新依赖包
6. ✅ 配置防火墙规则

## 性能优化

1. **启用 PM2 集群模式**：
   \`\`\`bash
   pm2 start ecosystem.config.js -i max
   \`\`\`

2. **配置 Nginx 缓存**（在宝塔反向代理中）

3. **优化数据库索引**：
   \`\`\`bash
   npx prisma studio
   # 检查慢查询并添加索引
   \`\`\`

## 监控和日志

\`\`\`bash
# 实时查看日志
pm2 logs punch-pattern-app --lines 100

# 查看错误日志
pm2 logs punch-pattern-app --err

# 监控资源使用
pm2 monit
\`\`\`

## 数据库管理

\`\`\`bash
# 打开 Prisma Studio（可视化数据库管理）
npx prisma studio

# 查看数据库状态
npx prisma db pull

# 重置数据库（⚠️ 会删除所有数据）
npx prisma db push --force-reset
\`\`\`

## 支持

如遇到问题，请检查：
1. PM2 日志：`pm2 logs punch-pattern-app`
2. 系统日志：`/var/log/nginx/error.log`
3. 数据库日志：`/var/log/mysql/error.log`
4. 应用日志：`.next/server/app-paths-manifest.json`

## 快速命令参考

\`\`\`bash
# 完整部署流程（数据库已有数据）
chmod +x safe_migrate.sh && ./safe_migrate.sh

# 完整部署流程（全新数据库）
chmod +x migrate_to_mysql.sh && ./migrate_to_mysql.sh

# 仅重启应用
pm2 restart punch-pattern-app

# 查看实时日志
pm2 logs punch-pattern-app --lines 50

# 备份数据库
mysqldump -u punch_user -p punch_pattern_db > backup_$(date +%Y%m%d_%H%M%S).sql
