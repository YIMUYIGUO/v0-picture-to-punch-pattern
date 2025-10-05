#!/bin/bash

# 安全部署脚本 - 保留现有 node_modules，温和更新
# 最适合低内存服务器

set -e

echo "=========================================="
echo "  安全部署脚本（温和模式）"
echo "=========================================="

# 加载环境变量
echo "加载环境变量..."
if [ -f .env.production ]; then
    export $(cat .env.production | grep -v '^#' | xargs)
    echo "✓ 环境变量已加载"
else
    echo "✗ 未找到 .env.production 文件"
    exit 1
fi

# 显示当前内存
echo "当前可用内存: $(free -m | awk 'NR==2{printf "%sMB", $7}')"

# 检查 node_modules
if [ -d "node_modules" ]; then
    echo "✓ 检测到现有 node_modules，将保留并增量更新"
else
    echo "⚠ 未检测到 node_modules，将全新安装"
fi

echo "更新依赖（增量模式）..."
npm install

if [ $? -ne 0 ]; then
    echo "✗ 依赖安装失败"
    echo ""
    echo "建议尝试以下方案："
    echo "1. 增加 swap 空间"
    echo "2. 使用本地构建方案: 参考 DEPLOYMENT_GUIDE.md 中的方案1"
    exit 1
fi

echo "✓ 依赖更新完成"

# 生成 Prisma Client
echo "生成 Prisma Client..."
npx prisma generate
echo "✓ Prisma Client 已生成"

# 同步数据库结构
echo "同步数据库结构..."
npx prisma db push --accept-data-loss
echo "✓ 数据库结构已同步"

# 构建应用
echo "构建应用..."
npm run build

if [ $? -ne 0 ]; then
    echo "✗ 构建失败"
    exit 1
fi

echo "✓ 构建完成"

# 重启应用
echo "重启应用..."
pm2 restart punch-pattern-app || pm2 start npm --name "punch-pattern-app" -- start
echo "✓ 应用已重启"

echo "=========================================="
echo "  部署完成！"
echo "=========================================="
echo ""
echo "应用状态: pm2 status"
echo "查看日志: pm2 logs punch-pattern-app"
