# 铝单板图案孔软件 - 完整部署指南

## 技术架构

- **前端框架**: Next.js 14 (App Router)
- **数据库**: MySQL + Prisma ORM
- **认证**: NextAuth.js
- **文件存储**: 腾讯云 COS / 阿里云 OSS / Vercel Blob
- **支付**: 虎皮椒支付

## 部署方案

### 方案一：本地构建 + 上传（推荐，适合低内存服务器）

**优点**: 不占用服务器内存，构建速度快
**适用**: 服务器内存 < 4GB

#### 步骤：

**1. 本地准备**
\`\`\`bash
# 克隆或下载项目
cd punch-pattern-app

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env.production
# 编辑 .env.production，填入生产环境配置

# 生成 Prisma 客户端
npx prisma generate

# 构建应用
npm run build
\`\`\`

**2. 上传到服务器**

需要上传的文件/文件夹：
- `node_modules/` （整个文件夹）
- `.next/` （构建产物）
- `prisma/` （数据库 schema）
- `public/` （静态资源）
- `package.json`
- `package-lock.json`
- `next.config.mjs`
- `.env.production`

使用 rsync 上传（推荐）：
\`\`\`bash
# 上传 node_modules
rsync -avz --progress node_modules/ root@your-server:/www/wwwroot/punch-pattern-app/node_modules/

# 上传构建产物
rsync -avz --progress .next/ root@your-server:/www/wwwroot/punch-pattern-app/.next/

# 上传其他必要文件
rsync -avz --progress prisma/ public/ package.json package-lock.json next.config.mjs .env.production \
  root@your-server:/www/wwwroot/punch-pattern-app/
\`\`\`

或使用 FTP/SFTP 工具（FileZilla、WinSCP）上传。

**3. 服务器配置**
\`\`\`bash
# SSH 登录服务器
ssh root@your-server

# 进入项目目录
cd /www/wwwroot/punch-pattern-app

# 同步数据库结构
npx prisma db push

# 启动应用（使用 PM2）
pm2 start npm --name "punch-pattern-app" -- start
pm2 save
pm2 startup
\`\`\`

---

### 方案二：服务器直接构建（适合高内存服务器）

**优点**: 流程简单，一键部署
**适用**: 服务器内存 >= 4GB

#### 步骤：

**1. 上传代码到服务器**
\`\`\`bash
# 使用 Git
git clone your-repo-url /www/wwwroot/punch-pattern-app
cd /www/wwwroot/punch-pattern-app

# 或使用 FTP 上传源代码
\`\`\`

**2. 配置环境变量**
\`\`\`bash
cp .env.example .env.production
nano .env.production  # 编辑配置
\`\`\`

**3. 运行部署脚本**
\`\`\`bash
chmod +x deploy_production.sh
./deploy_production.sh
\`\`\`

---

## 环境变量配置

### 必需配置

\`\`\`env
# 数据库（MySQL）
DATABASE_URL="mysql://username:password@localhost:3306/database_name"

# NextAuth
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="生成方法: openssl rand -base64 32"

# 文件存储（至少配置一个）
# 腾讯云 COS
COS_SECRET_ID="your-cos-secret-id"
COS_SECRET_KEY="your-cos-secret-key"
COS_BUCKET="your-bucket-name"
COS_REGION="ap-guangzhou"
\`\`\`

### 可选配置

\`\`\`env
# 阿里云 OSS（如果使用）
OSS_ACCESS_KEY_ID="your-oss-access-key-id"
OSS_ACCESS_KEY_SECRET="your-oss-access-key-secret"
OSS_BUCKET="your-oss-bucket"
OSS_REGION="oss-cn-hangzhou"

# 虎皮椒支付（如果使用）
HUPIJIAO_MCHID="your-merchant-id"
NEXT_PUBLIC_HUPIJIAO_MCHID="your-merchant-id"
\`\`\`

---

## 数据库初始化

### 创建数据库
\`\`\`sql
CREATE DATABASE punch_pattern_app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
\`\`\`

### 同步数据库结构
\`\`\`bash
npx prisma db push
\`\`\`

### 创建管理员账户
访问 `/api/admin/setup` 创建初始管理员账户。

---

## 宝塔面板配置

### 1. 创建网站
- 域名: your-domain.com
- 根目录: /www/wwwroot/punch-pattern-app
- PHP 版本: 纯静态

### 2. 配置反向代理
- 目标 URL: http://127.0.0.1:3000
- 发送域名: $host
- 启用缓存: 否

### 3. 配置 SSL 证书
在宝塔面板申请或上传 SSL 证书

### 4. 配置 PM2
\`\`\`bash
# 安装 PM2
npm install -g pm2

# 启动应用
cd /www/wwwroot/punch-pattern-app
pm2 start npm --name "punch-pattern-app" -- start

# 保存配置
pm2 save
pm2 startup
\`\`\`

---

## 故障排查

### 问题 1: npm install 内存不足被杀死

**解决方案**: 使用方案一（本地构建 + 上传）

### 问题 2: 数据库连接失败

**检查**:
\`\`\`bash
# 测试数据库连接
mysql -u username -p -h localhost database_name

# 检查环境变量
cat .env.production | grep DATABASE_URL
\`\`\`

### 问题 3: 应用启动失败

**检查日志**:
\`\`\`bash
pm2 logs punch-pattern-app
\`\`\`

**常见原因**:
- 端口 3000 被占用
- 环境变量配置错误
- Prisma 客户端未生成

### 问题 4: 图片上传失败

**检查**:
- COS/OSS 配置是否正确
- 存储桶权限是否正确
- 网络是否可达

---

## 性能优化

### 1. 启用 Gzip 压缩
在宝塔面板 → 网站设置 → 配置文件中添加：
\`\`\`nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
\`\`\`

### 2. 配置缓存
\`\`\`nginx
location /_next/static {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
\`\`\`

### 3. 数据库优化
\`\`\`sql
-- 添加索引
ALTER TABLE shared_patterns ADD INDEX idx_approval_status (approvalStatus);
ALTER TABLE shared_patterns ADD INDEX idx_is_public (isPublic);
\`\`\`

---

## 安全建议

1. **定期备份数据库**
\`\`\`bash
mysqldump -u username -p database_name > backup_$(date +%Y%m%d).sql
\`\`\`

2. **更新依赖**
\`\`\`bash
npm audit fix
\`\`\`

3. **配置防火墙**
只开放必要端口：80, 443, 22

4. **使用强密码**
- 数据库密码
- NEXTAUTH_SECRET
- 管理员密码

---

## 监控和维护

### 查看应用状态
\`\`\`bash
pm2 status
pm2 logs punch-pattern-app
\`\`\`

### 重启应用
\`\`\`bash
pm2 restart punch-pattern-app
\`\`\`

### 查看资源使用
\`\`\`bash
pm2 monit
\`\`\`

---

## 更新部署

\`\`\`bash
# 拉取最新代码
git pull

# 安装新依赖
npm install

# 生成 Prisma 客户端
npx prisma generate

# 同步数据库
npx prisma db push

# 重新构建
npm run build

# 重启应用
pm2 restart punch-pattern-app
\`\`\`

---

## 技术支持

如遇到问题，请检查：
1. 服务器日志: `pm2 logs punch-pattern-app`
2. 数据库连接: 测试 DATABASE_URL
3. 环境变量: 确保所有必需变量已配置
4. 网络连接: 测试 COS/OSS 可达性

更多问题请参考项目文档或联系技术支持。
