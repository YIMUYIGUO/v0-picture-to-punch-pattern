import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser, getSystemSetting } from "@/lib/db"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, error: "用户未登录" }, { status: 401 })
    }

    // 获取用户当前订阅
    const subscription = await prisma.subscription.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    })

    if (!subscription) {
      return NextResponse.json({ success: true, data: null })
    }

    // 检查订阅是否过期
    if (subscription.status === "active" && subscription.currentPeriodEnd) {
      const now = new Date()
      const endDate = new Date(subscription.currentPeriodEnd)

      if (now > endDate) {
        // 订阅已过期，更新状态
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: { status: "expired" },
        })
        subscription.status = "expired"
      }
    }

    return NextResponse.json({ success: true, data: subscription })
  } catch (error) {
    console.error("[v0] Subscription API error:", error)
    return NextResponse.json({ success: false, error: "服务异常" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, planType } = await request.json()
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, error: "用户未登录" }, { status: 401 })
    }

    if (action === "cancel") {
      // 取消订阅
      await prisma.subscription.updateMany({
        where: {
          userId: user.id,
          status: "active",
        },
        data: { status: "cancelled" },
      })

      return NextResponse.json({ success: true, message: "订阅已取消" })
    }

    if (action === "create_free") {
      const freeUserLimit = await getSystemSetting("free_user_download_limit", 5)

      // 创建免费订阅
      await prisma.subscription.upsert({
        where: {
          userId: user.id,
        },
        update: {
          planType: "free",
          status: "active",
          monthlyGenerationsLimit: Number(freeUserLimit),
          monthlyGenerationsUsed: 0,
          currentPeriodStart: new Date(),
          currentPeriodEnd: null,
          amount: 0,
        },
        create: {
          userId: user.id,
          planType: "free",
          status: "active",
          monthlyGenerationsLimit: Number(freeUserLimit),
          monthlyGenerationsUsed: 0,
          currentPeriodStart: new Date(),
          currentPeriodEnd: null,
          amount: 0,
        },
      })

      return NextResponse.json({ success: true, message: "免费订阅已激活" })
    }

    return NextResponse.json({ success: false, error: "无效的操作" }, { status: 400 })
  } catch (error) {
    console.error("[v0] Subscription action error:", error)
    return NextResponse.json({ success: false, error: "服务异常" }, { status: 500 })
  }
}
