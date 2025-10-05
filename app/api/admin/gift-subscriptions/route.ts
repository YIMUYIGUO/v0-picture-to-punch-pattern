import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

// 生成随机礼品码
function generateGiftCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let result = ""
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export async function GET() {
  try {
    console.log("[v0] Starting gift subscriptions GET request")

    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ success: false, error: "未授权" }, { status: 401 })
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (!currentUser || !["admin", "super_admin"].includes(currentUser.role)) {
      return NextResponse.json({ success: false, error: "权限不足" }, { status: 403 })
    }

    const gifts = await prisma.giftSubscription.findMany({
      include: {
        creator: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    console.log("[v0] Successfully fetched", gifts.length, "gift subscriptions")

    // 计算统计数据
    const stats = {
      totalGifts: gifts.length,
      activeGifts: gifts.filter((g) => g.status === "active").length,
      redeemedGifts: gifts.filter((g) => g.status === "redeemed").length,
      expiredGifts: gifts.filter((g) => g.status === "expired").length,
      totalValue: gifts.reduce((sum, g) => sum + (g.amount || 0), 0),
    }

    return NextResponse.json({ success: true, data: { gifts, stats } })
  } catch (error) {
    console.error("[v0] Gift subscriptions GET API error:", error)
    return NextResponse.json({ success: false, error: "服务器错误" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Starting gift subscriptions POST request")

    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ success: false, error: "未授权" }, { status: 401 })
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (!currentUser || !["admin", "super_admin"].includes(currentUser.role)) {
      return NextResponse.json({ success: false, error: "权限不足" }, { status: 403 })
    }

    const { plan_type, recipient_email, notes, expires_days } = await request.json()

    if (!plan_type || !["monthly", "yearly"].includes(plan_type)) {
      return NextResponse.json({ success: false, error: "无效的订阅类型" }, { status: 400 })
    }

    // 生成唯一礼品码
    let giftCode = generateGiftCode()
    let attempts = 0
    while (attempts < 10) {
      const existing = await prisma.giftSubscription.findUnique({
        where: { giftCode },
      })

      if (!existing) break
      giftCode = generateGiftCode()
      attempts++
    }

    if (attempts >= 10) {
      return NextResponse.json({ success: false, error: "生成礼品码失败" }, { status: 500 })
    }

    // 计算过期日期
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + (expires_days || 30))

    // 计算礼品价值
    const amount = plan_type === "yearly" ? 99 : 19

    const gift = await prisma.giftSubscription.create({
      data: {
        giftCode,
        planType: plan_type,
        recipientEmail: recipient_email || null,
        notes: notes || null,
        expiresAt,
        createdBy: session.user.id,
        amount,
      },
    })

    await prisma.adminActivityLog.create({
      data: {
        adminId: session.user.id,
        action: "create_gift_subscription",
        targetType: "gift_subscription",
        targetId: gift.id,
        details: { plan_type, recipient_email, amount },
      },
    })

    return NextResponse.json({ success: true, data: gift })
  } catch (error) {
    console.error("[v0] Gift subscriptions POST API error:", error)
    return NextResponse.json({ success: false, error: "服务器错误" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ success: false, error: "未授权" }, { status: 401 })
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (!currentUser || !["admin", "super_admin"].includes(currentUser.role)) {
      return NextResponse.json({ success: false, error: "权限不足" }, { status: 403 })
    }

    const { gift_id, action } = await request.json()

    if (!gift_id || !action) {
      return NextResponse.json({ success: false, error: "缺少必要参数" }, { status: 400 })
    }

    let updateData: any = {}

    switch (action) {
      case "cancel":
        updateData = { status: "cancelled" }
        break
      default:
        return NextResponse.json({ success: false, error: "无效的操作类型" }, { status: 400 })
    }

    await prisma.giftSubscription.update({
      where: { id: gift_id },
      data: updateData,
    })

    await prisma.adminActivityLog.create({
      data: {
        adminId: session.user.id,
        action: `gift_subscription_${action}`,
        targetType: "gift_subscription",
        targetId: gift_id,
        details: { action },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Gift subscriptions PATCH API error:", error)
    return NextResponse.json({ success: false, error: "服务器错误" }, { status: 500 })
  }
}
