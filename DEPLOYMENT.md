# 生产部署指南

本文档提供完整的生产环境部署指南，适用于宝塔面板、VPS 或云服务器。

## 技术栈

- **前端框架**: Next.js 14 (App Router)
- **数据库**: MySQL 8.0
- **ORM**: Prisma
- **认证**: NextAuth.js
- **存储**: 腾讯云 COS / 阿里云 OSS
- **部署**: PM2 进程管理

## 快速部署（推荐）

如果您的服务器内存较小（2GB 以下），使用安全部署脚本：

\`\`\`bash
cd /www/wwwroot/punch-pattern-app
chmod +x deploy_safe.sh
./deploy_safe.sh
\`\`\`

**此脚本的优势**：
- ✅ 保留现有 node_modules，避免内存溢出
- ✅ 只更新必要的依赖包
- ✅ 自动备份和回滚机制
- ✅ 适合低内存服务器

## 完整部署步骤

### 1. 环境准备

确保服务器已安装：
- **Node.js 18+**: `node -v` 检查版本
- **MySQL 8.0+**: `mysql --version` 检查版本
- **PM2**: `npm install -g pm2`
- **Git**: `git --version` 检查版本

### 2. 创建数据库

\`\`\`bash
# 登录 MySQL
mysql -u root -p

# 创建数据库和用户
CREATE DATABASE punch_pattern_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'punch_user'@'localhost' IDENTIFIED BY 'your_strong_password';
GRANT ALL PRIVILEGES ON punch_pattern_db.* TO 'punch_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
\`\`\`

### 3. 克隆代码

\`\`\`bash
cd /www/wwwroot
git clone <your-repo-url> punch-pattern-app
cd punch-pattern-app
\`\`\`

### 4. 配置环境变量

复制并编辑环境变量文件：

\`\`\`bash
cp .env.production.example .env.production
nano .env.production
\`\`\`

必填配置项：

\`\`\`bash
# 数据库配置
DATABASE_URL="mysql://punch_user:your_strong_password@localhost:3306/punch_pattern_db"

# NextAuth 配置
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="your-secret-key"  # 使用 openssl rand -base64 32 生成

# 应用 URL
NEXT_PUBLIC_APP_URL="https://your-domain.com"

# 存储配置（腾讯云 COS 或阿里云 OSS，二选一）
# 腾讯云 COS
COS_SECRET_ID="your-cos-secret-id"
COS_SECRET_KEY="your-cos-secret-key"
COS_BUCKET="your-bucket-name"
COS_REGION="ap-guangzhou"

# 阿里云 OSS
OSS_ACCESS_KEY_ID="your-oss-access-key-id"
OSS_ACCESS_KEY_SECRET="your-oss-access-key-secret"
OSS_BUCKET="your-bucket-name"
OSS_REGION="oss-cn-hangzhou"

# 支付配置（可选）
HUPIJIAO_MCHID="your-merchant-id"
NEXT_PUBLIC_HUPIJIAO_MCHID="your-merchant-id"
\`\`\`

### 5. 运行部署脚本

\`\`\`bash
chmod +x deploy_safe.sh
./deploy_safe.sh
\`\`\`

脚本会自动完成：
1. 加载环境变量
2. 更新依赖（保留现有 node_modules）
3. 初始化数据库
4. 构建应用
5. 启动 PM2 服务

### 6. 配置 Nginx（宝塔面板自动配置）

如果使用宝塔面板，Nginx 会自动配置。手动配置参考：

\`\`\`nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
\`\`\`

### 7. 创建管理员账户

访问应用并注册账户，然后在数据库中设置为管理员：

\`\`\`bash
mysql -u punch_user -p punch_pattern_db
\`\`\`

\`\`\`sql
UPDATE User SET role = 'admin' WHERE email = 'admin@example.com';
\`\`\`

## 宝塔面板部署

详细的宝塔部署指南请查看 [BAOTA_DEPLOYMENT.md](./BAOTA_DEPLOYMENT.md)

## 常用命令

### PM2 管理

\`\`\`bash
# 查看应用状态
pm2 status

# 查看日志
pm2 logs punch-pattern-app

# 重启应用
pm2 restart punch-pattern-app

# 停止应用
pm2 stop punch-pattern-app
\`\`\`

### 应用更新

\`\`\`bash
# 拉取最新代码
git pull origin main

# 运行安全部署脚本
./deploy_safe.sh
\`\`\`

## 故障排查

### 1. 内存不足导致安装失败

**症状**: npm install 被 Killed

**解决方案**: 使用 `deploy_safe.sh` 脚本，它会保留现有 node_modules

### 2. 数据库连接失败

**症状**: 应用启动失败，日志显示 "Can't reach database server"

**解决方案**:
\`\`\`bash
# 检查 MySQL 服务
systemctl status mysql

# 测试数据库连接
mysql -u punch_user -p punch_pattern_db

# 检查 DATABASE_URL
cat .env.production | grep DATABASE_URL
\`\`\`

### 3. 应用无法启动

**症状**: PM2 显示应用状态为 "errored"

**解决方案**:
\`\`\`bash
# 查看错误日志
pm2 logs punch-pattern-app --err

# 重新构建
npm run build

# 重启应用
pm2 restart punch-pattern-app
\`\`\`

### 4. 端口被占用

**症状**: 应用启动失败，提示端口 3000 已被占用

**解决方案**:
\`\`\`bash
# 查看占用端口的进程
lsof -i :3000

# 杀死占用进程
kill -9 <PID>
\`\`\`

## 性能优化

### 1. 启用 PM2 集群模式

\`\`\`bash
pm2 start ecosystem.config.js -i max
\`\`\`

### 2. 数据库索引优化

\`\`\`sql
CREATE INDEX idx_user_email ON User(email);
CREATE INDEX idx_pattern_user ON Pattern(userId);
CREATE INDEX idx_subscription_user ON Subscription(userId);
\`\`\`

### 3. 定期清理过期数据

\`\`\`sql
DELETE FROM Session WHERE expires < NOW();
\`\`\`

## 备份策略

### 自动备份脚本

创建 `/root/backup_punch_pattern.sh`:

\`\`\`bash
#!/bin/bash
BACKUP_DIR="/root/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="punch_pattern_db"
DB_USER="punch_user"
DB_PASS="your_password"

mkdir -p $BACKUP_DIR
mysqldump -u $DB_USER -p$DB_PASS $DB_NAME | gzip > $BACKUP_DIR/db_$DATE.sql.gz
find $BACKUP_DIR -name "db_*.sql.gz" -mtime +7 -delete
\`\`\`

设置定时任务：

\`\`\`bash
chmod +x /root/backup_punch_pattern.sh
crontab -e

# 每天凌晨 2 点备份
0 2 * * * /root/backup_punch_pattern.sh
\`\`\`

## 安全建议

1. ✅ 使用强密码
2. ✅ 启用 HTTPS
3. ✅ 限制数据库访问
4. ✅ 定期更新依赖
5. ✅ 配置防火墙
6. ✅ 定期备份数据

---

**技术支持**: 如有问题，请查看 [BAOTA_DEPLOYMENT.md](./BAOTA_DEPLOYMENT.md) 或提交 Issue。
