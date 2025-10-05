# 铝板打孔图案生成系统

一个基于 Next.js 的专业铝板打孔图案生成和管理系统，支持图片上传、参数调整、图案预览、导出和分享功能。

## 功能特性

- 🖼️ **图片上传与处理**: 支持多种图片格式，自动裁剪和优化
- ⚙️ **参数调整**: 实时调整孔径、间距、分格线等参数
- 👁️ **实时预览**: Canvas 渲染，支持缩放和平移
- 📤 **导出功能**: 支持 DXF、PNG、PDF 等多种格式
- 🔐 **用户认证**: 基于 NextAuth.js 的安全认证系统
- 💳 **订阅管理**: 支持会员订阅和权限管理
- 🎨 **作品广场**: 分享和浏览其他用户的作品
- 👨‍💼 **管理后台**: 用户管理、订阅管理、系统设置

## 技术栈

- **前端框架**: Next.js 14 (App Router)
- **UI 组件**: shadcn/ui + Tailwind CSS
- **数据库**: MySQL 8.0 + Prisma ORM
- **认证**: NextAuth.js
- **存储**: 腾讯云 COS / 阿里云 OSS
- **部署**: PM2 进程管理

## 快速开始

### 环境要求

- Node.js 18+
- MySQL 8.0+
- 腾讯云 COS 或阿里云 OSS 账号

### 1. 克隆代码

\`\`\`bash
git clone <your-repo-url> punch-pattern-app
cd punch-pattern-app
\`\`\`

### 2. 安装依赖

\`\`\`bash
npm install
\`\`\`

### 3. 配置环境变量

复制 `.env.production.example` 并修改配置：

\`\`\`bash
cp .env.production.example .env.local
\`\`\`

编辑 `.env.local`：

\`\`\`bash
# 数据库配置
DATABASE_URL="mysql://username:password@localhost:3306/database_name"

# NextAuth 配置
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# 存储配置（COS 或 OSS 二选一）
COS_SECRET_ID="your-cos-secret-id"
COS_SECRET_KEY="your-cos-secret-key"
COS_BUCKET="your-bucket-name"
COS_REGION="ap-guangzhou"
\`\`\`

### 4. 初始化数据库

\`\`\`bash
# 生成 Prisma Client
npx prisma generate

# 推送数据库 schema
npx prisma db push
\`\`\`

### 5. 启动开发服务器

\`\`\`bash
npm run dev
\`\`\`

访问 http://localhost:3000

## 生产部署

详细的部署文档请查看 [DEPLOYMENT.md](./DEPLOYMENT.md)

### 快
