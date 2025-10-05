# 宝塔服务器快速部署指南

## 一、前置准备（只需做一次）

### 1. 安装必要软件

在宝塔面板操作：

1. **安装 Node.js**
   - 软件商店 → 搜索 "Node.js" → 安装 18.x 或更高版本

2. **安装 MySQL**
   - 软件商店 → 搜索 "MySQL" → 安装 5.7 或 8.0

3. **创建数据库**
   - 数据库 → 添加数据库
   - 数据库名：`punch_pattern_db`
   - 用户名：`punch_user`
   - 密码：设置强密码（记住这个密码）
   - 访问权限：本地服务器

### 2. 配置环境变量

在项目根目录创建 `.env.production` 文件：

\`\`\`bash
# 数据库配置（必填）
DATABASE_URL="mysql://punch_user:您的数据库密码@localhost:3306/punch_pattern_db"

# NextAuth 配置（必填）
NEXTAUTH_URL="http://您的域名或IP:3000"
NEXTAUTH_SECRET="请运行命令生成: openssl rand -base64 32"

# 文件存储配置（COS 和 OSS 二选一）

# 腾讯云 COS
COS_SECRET_ID="您的SecretId"
COS_SECRET_KEY="您的SecretKey"
COS_BUCKET="您的存储桶"
COS_REGION="ap-guangzhou"

# 或者阿里云 OSS
# OSS_ACCESS_KEY_ID="您的AccessKeyId"
# OSS_ACCESS_KEY_SECRET="您的AccessKeySecret"
# OSS_BUCKET="您的存储桶"
# OSS_REGION="oss-cn-hangzhou"

# 支付配置（可选）
HUPIJIAO_MCHID="您的商户号"
NEXT_PUBLIC_HUPIJIAO_MCHID="您的商户号"
\`\`\`

**生成 NEXTAUTH_SECRET：**
\`\`\`bash
openssl rand -base64 32
\`\`\`

## 二、部署应用（每次更新代码后执行）

### 方法一：一键部署（推荐）

SSH 连接到服务器，执行：

\`\`\`bash
cd /www/wwwroot/punch-pattern-app
chmod +x deploy_baota.sh
./deploy_baota.sh
\`\`\`

脚本会自动完成：
- ✅ 安装/更新依赖
- ✅ 生成 Prisma 客户端
- ✅ 同步数据库结构
- ✅ 构建应用
- ✅ 启动/重启应用

### 方法二：手动部署

如果自动脚本失败，可以手动执行：

\`\`\`bash
cd /www/wwwroot/punch-pattern-app

# 1. 安装依赖
npm install

# 2. 生成 Prisma 客户端
npx prisma generate

# 3. 同步数据库
npx prisma db push

# 4. 构建应用
npm run build

# 5. 启动应用
pm2 restart punch-pattern-app
# 如果是首次启动
pm2 start npm --name "punch-pattern-app" -- start
pm2 save
\`\`\`

## 三、配置域名和 HTTPS（可选但推荐）

### 1. 添加网站

在宝塔面板：
- 网站 → 添加站点
- 域名：填写您的域名
- 根目录：随意（不使用）
- PHP 版本：纯静态

### 2. 配置反向代理

在刚创建的网站设置中：
- 反向代理 → 添加反向代理
- 代理名称：`punch-pattern-app`
- 目标 URL：`http://127.0.0.1:3000`
- 发送域名：`$host`
- 启用缓存：否

### 3. 配置 SSL 证书

在网站设置中：
- SSL → Let's Encrypt
- 申请免费证书
- 强制 HTTPS：开启

**重要：** 配置 HTTPS 后，记得更新 `.env.production` 中的 `NEXTAUTH_URL`：
\`\`\`bash
NEXTAUTH_URL="https://您的域名"
\`\`\`

然后重启应用：
\`\`\`bash
pm2 restart punch-pattern-app
\`\`\`

## 四、常用管理命令

\`\`\`bash
# 查看应用状态
pm2 status

# 查看实时日志
pm2 logs punch-pattern-app

# 重启应用
pm2 restart punch-pattern-app

# 停止应用
pm2 stop punch-pattern-app

# 查看数据库（可视化界面）
npx prisma studio
# 访问 http://您的IP:5555
\`\`\`

## 五、故障排查

### 问题 1：npm install 被 killed（内存不足）

**解决方案：** 创建 swap 空间

\`\`\`bash
# 创建 2GB swap
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# 永久启用
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# 验证
free -h
\`\`\`

### 问题 2：数据库连接失败

**检查清单：**
1. MySQL 服务是否运行：`systemctl status mysql`
2. 数据库是否已创建
3. 用户名密码是否正确
4. `.env.production` 中的 `DATABASE_URL` 格式是否正确

**测试连接：**
\`\`\`bash
mysql -u punch_user -p punch_pattern_db
\`\`\`

### 问题 3：端口 3000 被占用

**查看占用进程：**
\`\`\`bash
lsof -i :3000
\`\`\`

**修改端口：**
在 `.env.production` 中添加：
\`\`\`bash
PORT=3001
\`\`\`

### 问题 4：构建失败

**清理并重新构建：**
\`\`\`bash
rm -rf .next
npm run build
\`\`\`

### 问题 5：页面显示 500 错误

**查看详细错误：**
\`\`\`bash
pm2 logs punch-pattern-app --err
\`\`\`

常见原因：
- 环境变量未正确配置
- 数据库连接失败
- Prisma 客户端未生成

## 六、备份和恢复

### 备份数据库

\`\`\`bash
# 手动备份
mysqldump -u punch_user -p punch_pattern_db > backup_$(date +%Y%m%d_%H%M%S).sql

# 在宝塔面板设置定时备份
# 计划任务 → 添加任务 → 备份数据库 → 选择数据库 → 设置周期
\`\`\`

### 恢复数据库

\`\`\`bash
mysql -u punch_user -p punch_pattern_db < backup_20240115_143022.sql
\`\`\`

## 七、性能优化建议

1. **启用 PM2 集群模式**（多核 CPU）
   \`\`\`bash
   pm2 delete punch-pattern-app
   pm2 start npm --name "punch-pattern-app" -i max -- start
   pm2 save
   \`\`\`

2. **配置 Nginx 缓存**
   在宝塔反向代理配置中添加缓存规则

3. **定期清理日志**
   \`\`\`bash
   pm2 flush
   \`\`\`

## 八、安全建议

- ✅ 使用强密码
- ✅ 启用 HTTPS
- ✅ 定期备份数据库
- ✅ 限制数据库访问权限（仅本地）
- ✅ 定期更新依赖包
- ✅ 配置防火墙规则

## 需要帮助？

查看日志获取详细错误信息：
\`\`\`bash
pm2 logs punch-pattern-app --lines 100
