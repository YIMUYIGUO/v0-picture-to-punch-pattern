import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST() {
  try {
    const now = new Date()

    // 查找所有过期的活跃订阅
    const expiredSubscriptions = await prisma.subscription.findMany({
      where: {
        status: "active",
        currentPeriodEnd: {
          lt: now,
        },
      },
    })

    if (expiredSubscriptions.length === 0) {
      return NextResponse.json({ success: true, message: "没有过期的订阅", updated: 0 })
    }

    // 批量更新过期订阅状态
    const result = await prisma.subscription.updateMany({
      where: {
        id: {
          in: expiredSubscriptions.map((sub) => sub.id),
        },
      },
      data: {
        status: "expired",
      },
    })

    console.log(`[v0] Updated ${result.count} expired subscriptions`)

    return NextResponse.json({
      success: true,
      message: `已更新 ${result.count} 个过期订阅`,
      updated: result.count,
    })
  } catch (error) {
    console.error("[v0] Subscription expiry check error:", error)
    return NextResponse.json({ success: false, error: "服务异常" }, { status: 500 })
  }
}
