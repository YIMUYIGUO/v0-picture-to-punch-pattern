#!/bin/bash

# 宝塔服务器部署脚本
# 适用于直接在服务器上部署，不需要本地构建

set -e

echo "=========================================="
echo "  宝塔服务器部署脚本"
echo "=========================================="

# 1. 检查环境
echo ""
echo "步骤 1/6: 检查环境..."
if [ ! -f ".env.production" ]; then
    echo "❌ 错误: .env.production 文件不存在"
    echo "请先创建 .env.production 文件并配置环境变量"
    exit 1
fi

# 加载环境变量
set -a
source .env.production
set +a
echo "✓ 环境变量已加载"

# 2. 安装依赖（温和模式）
echo ""
echo "步骤 2/6: 安装依赖..."
echo "使用温和的 npm install，保留现有 node_modules"

if [ -d "node_modules" ]; then
    echo "检测到现有 node_modules，将进行增量更新"
else
    echo "首次安装，这可能需要几分钟..."
fi

npm install

echo "✓ 依赖安装完成"

# 3. 生成 Prisma 客户端
echo ""
echo "步骤 3/6: 生成 Prisma 客户端..."
npx prisma generate
echo "✓ Prisma 客户端已生成"

# 4. 同步数据库
echo ""
echo "步骤 4/6: 同步数据库结构..."
echo "这将更新数据库表结构以匹配 Prisma schema"

npx prisma db push

echo "✓ 数据库结构已同步"

# 5. 构建应用
echo ""
echo "步骤 5/6: 构建应用..."
npm run build
echo "✓ 应用构建完成"

# 6. 启动/重启应用
echo ""
echo "步骤 6/6: 启动应用..."

# 检查 PM2 是否已安装
if ! command -v pm2 &> /dev/null; then
    echo "⚠️  PM2 未安装，正在安装..."
    npm install -g pm2
fi

# 检查应用是否已在运行
if pm2 list | grep -q "punch-pattern-app"; then
    echo "重启现有应用..."
    pm2 restart punch-pattern-app
else
    echo "首次启动应用..."
    pm2 start npm --name "punch-pattern-app" -- start
    pm2 save
fi

echo ""
echo "=========================================="
echo "  ✓ 部署完成！"
echo "=========================================="
echo ""
echo "应用信息："
echo "  - 名称: punch-pattern-app"
echo "  - 端口: 3000"
echo "  - 状态: 运行中"
echo ""
echo "常用命令："
echo "  查看状态: pm2 status"
echo "  查看日志: pm2 logs punch-pattern-app"
echo "  重启应用: pm2 restart punch-pattern-app"
echo "  停止应用: pm2 stop punch-pattern-app"
echo ""
echo "访问地址: http://您的服务器IP:3000"
echo ""
