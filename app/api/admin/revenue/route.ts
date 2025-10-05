import { NextResponse } from "next/server"
import { getCurrentUser, isAdmin } from "@/lib/db"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, error: "未授权" }, { status: 401 })
    }

    if (!(await isAdmin())) {
      return NextResponse.json({ success: false, error: "权限不足" }, { status: 403 })
    }

    // 获取当前月份的开始和结束时间
    const now = new Date()
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)

    // 获取本月收入数据
    const currentMonthOrders = await prisma.paymentOrder.findMany({
      where: {
        status: "paid",
        createdAt: {
          gte: currentMonthStart,
          lte: currentMonthEnd,
        },
      },
      select: {
        amount: true,
      },
    })

    // 获取上月收入数据
    const lastMonthOrders = await prisma.paymentOrder.findMany({
      where: {
        status: "paid",
        createdAt: {
          gte: lastMonthStart,
          lte: lastMonthEnd,
        },
      },
      select: {
        amount: true,
      },
    })

    // 获取付费用户数量
    const currentPaidUsers = await prisma.subscription.findMany({
      where: {
        status: "active",
        planType: {
          in: ["monthly", "yearly"],
        },
        createdAt: {
          gte: currentMonthStart,
        },
      },
      select: {
        userId: true,
      },
      distinct: ["userId"],
    })

    const lastPaidUsers = await prisma.subscription.findMany({
      where: {
        status: "active",
        planType: {
          in: ["monthly", "yearly"],
        },
        createdAt: {
          gte: lastMonthStart,
          lte: lastMonthEnd,
        },
      },
      select: {
        userId: true,
      },
      distinct: ["userId"],
    })

    // 获取总用户数
    const totalUsers = await prisma.user.count()

    // 计算数据
    const currentRevenue = currentMonthOrders.reduce((sum, order) => sum + Number(order.amount), 0)
    const lastRevenue = lastMonthOrders.reduce((sum, order) => sum + Number(order.amount), 0)
    const currentPaidUserCount = currentPaidUsers.length
    const lastPaidUserCount = lastPaidUsers.length
    const currentOrderCount = currentMonthOrders.length
    const lastOrderCount = lastMonthOrders.length

    // 计算增长率
    const revenueGrowth = lastRevenue > 0 ? ((currentRevenue - lastRevenue) / lastRevenue) * 100 : 0
    const userGrowth =
      lastPaidUserCount > 0 ? ((currentPaidUserCount - lastPaidUserCount) / lastPaidUserCount) * 100 : 0
    const conversionRate = totalUsers ? (currentPaidUserCount / totalUsers) * 100 : 0
    const averageOrder = currentOrderCount > 0 ? currentRevenue / currentOrderCount : 0

    const lastConversionRate = totalUsers ? (lastPaidUserCount / totalUsers) * 100 : 0
    const lastAverageOrder = lastOrderCount > 0 ? lastRevenue / lastOrderCount : 0
    const conversionGrowth =
      lastConversionRate > 0 ? ((conversionRate - lastConversionRate) / lastConversionRate) * 100 : 0
    const orderGrowth = lastAverageOrder > 0 ? ((averageOrder - lastAverageOrder) / lastAverageOrder) * 100 : 0

    const revenueData = {
      monthlyRevenue: currentRevenue,
      paidUsers: currentPaidUserCount,
      conversionRate,
      averageOrder,
      revenueGrowth,
      userGrowth,
      conversionGrowth,
      orderGrowth,
    }

    return NextResponse.json({ success: true, data: revenueData })
  } catch (error) {
    console.error("Revenue analytics API error:", error)
    return NextResponse.json({ success: false, error: "服务器错误" }, { status: 500 })
  }
}
