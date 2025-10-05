import { prisma } from "./prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "./auth"

// 获取当前用户
export async function getCurrentUser() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return null
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
    include: {
      subscriptions: {
        where: { status: "active" },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  })

  return user
}

// 检查用户是否是管理员
export async function isAdmin() {
  const user = await getCurrentUser()
  return user?.role === "admin"
}

// 获取系统设置
export async function getSystemSetting(key: string, defaultValue: any = null) {
  const setting = await prisma.systemSetting.findUnique({
    where: { key },
  })

  return setting?.value ?? defaultValue
}

// 更新系统设置
export async function updateSystemSetting(key: string, value: any, description?: string) {
  return await prisma.systemSetting.upsert({
    where: { key },
    update: { value, description, updatedAt: new Date() },
    create: { key, value, description },
  })
}

// 获取用户统计信息
export async function getUserStats() {
  const [totalUsers, activeSubscriptions, totalRevenue] = await Promise.all([
    prisma.user.count(),
    prisma.subscription.count({
      where: { status: "active" },
    }),
    prisma.subscription.aggregate({
      _sum: { amount: true },
      where: { status: "active" },
    }),
  ])

  return {
    totalUsers,
    activeSubscriptions,
    totalRevenue: totalRevenue._sum.amount || 0,
  }
}
