#!/bin/bash

set -e

echo "=========================================="
echo "  铝单板图案孔软件 - 生产环境部署脚本"
echo "=========================================="

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查是否在项目目录
if [ ! -f "package.json" ]; then
    echo -e "${RED}错误: 请在项目根目录运行此脚本${NC}"
    exit 1
fi

# 加载环境变量
if [ -f ".env.production" ]; then
    echo -e "${GREEN}✓ 加载环境变量${NC}"
    export $(cat .env.production | grep -v '^#' | xargs)
else
    echo -e "${RED}错误: .env.production 文件不存在${NC}"
    exit 1
fi

# 检查必需的环境变量
echo "检查环境变量..."
REQUIRED_VARS=("DATABASE_URL" "NEXTAUTH_SECRET" "NEXTAUTH_URL")
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo -e "${RED}错误: 缺少必需的环境变量 $var${NC}"
        exit 1
    fi
done
echo -e "${GREEN}✓ 环境变量检查通过${NC}"

# 步骤 1: 安装依赖（如果 node_modules 不存在）
if [ ! -d "node_modules" ]; then
    echo "安装依赖..."
    npm install --production=false
    echo -e "${GREEN}✓ 依赖安装完成${NC}"
else
    echo -e "${YELLOW}跳过依赖安装（node_modules 已存在）${NC}"
fi

# 步骤 2: 生成 Prisma 客户端
echo "生成 Prisma 客户端..."
npx prisma generate
echo -e "${GREEN}✓ Prisma 客户端生成完成${NC}"

# 步骤 3: 同步数据库结构
echo "同步数据库结构..."
npx prisma db push --accept-data-loss
echo -e "${GREEN}✓ 数据库结构同步完成${NC}"

# 步骤 4: 构建应用
echo "构建应用..."
npm run build
echo -e "${GREEN}✓ 应用构建完成${NC}"

# 步骤 5: 重启应用（如果使用 PM2）
if command -v pm2 &> /dev/null; then
    echo "重启 PM2 应用..."
    pm2 restart punch-pattern-app || pm2 start npm --name "punch-pattern-app" -- start
    echo -e "${GREEN}✓ 应用已重启${NC}"
else
    echo -e "${YELLOW}提示: 未检测到 PM2，请手动重启应用${NC}"
fi

echo ""
echo -e "${GREEN}=========================================="
echo "  部署完成！"
echo "==========================================${NC}"
echo ""
echo "下一步："
echo "1. 访问您的网站验证部署"
echo "2. 检查日志: pm2 logs punch-pattern-app"
echo "3. 如有问题，查看 DEPLOYMENT.md"
