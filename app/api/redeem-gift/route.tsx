import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] 兑换码API被调用")
    const { giftCode } = await request.json()
    console.log("[v0] 收到兑换码:", giftCode)

    if (!giftCode || typeof giftCode !== "string") {
      console.log("[v0] 兑换码无效")
      return NextResponse.json({ success: false, error: "请输入有效的兑换码" }, { status: 400 })
    }

    const session = await getServerSession(authOptions)
    console.log("[v0] 用户验证结果:", { user: session?.user?.email })

    if (!session?.user?.email) {
      console.log("[v0] 用户未登录")
      return NextResponse.json({ success: false, error: "请先登录" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ success: false, error: "用户不存在" }, { status: 404 })
    }

    console.log("[v0] 查找礼品订阅:", giftCode.toUpperCase())
    const giftSubscription = await prisma.giftSubscription.findUnique({
      where: { giftCode: giftCode.toUpperCase() },
    })

    console.log("[v0] 礼品订阅查询结果:", giftSubscription)

    if (!giftSubscription) {
      console.log("[v0] 兑换码不存在")
      return NextResponse.json({ success: false, error: "兑换码无效或不存在" }, { status: 404 })
    }

    // 检查礼品状态
    console.log("[v0] 礼品状态:", giftSubscription.status)
    if (giftSubscription.status !== "active") {
      const statusMessages = {
        redeemed: "此兑换码已被使用",
        expired: "此兑换码已过期",
        cancelled: "此兑换码已被取消",
      }
      console.log("[v0] 礼品状态不可用:", giftSubscription.status)
      return NextResponse.json(
        {
          success: false,
          error: statusMessages[giftSubscription.status as keyof typeof statusMessages] || "兑换码不可用",
        },
        { status: 400 },
      )
    }

    // 检查是否过期
    if (giftSubscription.expiresAt && new Date() > new Date(giftSubscription.expiresAt)) {
      console.log("[v0] 礼品已过期")
      await prisma.giftSubscription.update({
        where: { id: giftSubscription.id },
        data: { status: "expired" },
      })
      return NextResponse.json({ success: false, error: "此兑换码已过期" }, { status: 400 })
    }

    console.log("[v0] 检查用户现有订阅")
    const existingSubscription = await prisma.subscription.findFirst({
      where: {
        userId: user.id,
        status: "active",
      },
    })

    console.log("[v0] 现有订阅:", existingSubscription)

    if (existingSubscription) {
      // 如果用户有非礼品的付费订阅，不允许兑换
      if (existingSubscription.planType !== "free" && !existingSubscription.giftSubscriptionId) {
        console.log("[v0] 用户已有付费订阅（非礼品），不能兑换")
        return NextResponse.json({ success: false, error: "您已有付费订阅，无法兑换礼品码" }, { status: 400 })
      }

      // 检查订阅级别升级规则
      const currentPlan = existingSubscription.planType
      const newPlan = giftSubscription.planType

      console.log("[v0] 检查升级规则:", { currentPlan, newPlan })

      // 定义计划级别
      const planLevels = {
        free: 0,
        monthly: 1,
        yearly: 2,
      }

      const currentLevel = planLevels[currentPlan as keyof typeof planLevels] || 0
      const newLevel = planLevels[newPlan as keyof typeof planLevels] || 0

      // 如果新计划级别不高于当前计划，不允许兑换
      if (newLevel <= currentLevel && currentPlan !== "free") {
        const planNames = {
          monthly: "包月版",
          yearly: "包年版",
        }

        console.log("[v0] 不允许同级别或降级兑换")
        return NextResponse.json(
          {
            success: false,
            error: `您当前已是${planNames[currentPlan as keyof typeof planNames]}，无法兑换${planNames[newPlan as keyof typeof planNames]}。只能使用包年版兑换码升级到包年版。`,
            code: "SAME_LEVEL_UPGRADE",
          },
          { status: 400 },
        )
      }
    }

    // 计算订阅期限
    const now = new Date()
    const periodEnd = new Date(now)
    if (giftSubscription.planType === "monthly") {
      periodEnd.setMonth(periodEnd.getMonth() + 1)
    } else if (giftSubscription.planType === "yearly") {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1)
    }

    // 获取计划限制
    const limits = {
      monthly: 50,
      yearly: 1000,
    }

    console.log("[v0] 准备创建/更新订阅:", {
      plan_type: giftSubscription.planType,
      limit: limits[giftSubscription.planType as keyof typeof limits],
      hasExisting: !!existingSubscription,
    })

    let newSubscription

    if (existingSubscription) {
      console.log("[v0] 更新现有订阅")
      newSubscription = await prisma.subscription.update({
        where: { id: existingSubscription.id },
        data: {
          planType: giftSubscription.planType,
          monthlyGenerationsLimit: limits[giftSubscription.planType as keyof typeof limits],
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          amount: giftSubscription.amount || 0,
          giftSubscriptionId: giftSubscription.id,
          updatedAt: now,
        },
      })

      console.log("[v0] 订阅更新结果:", newSubscription)
    } else {
      console.log("[v0] 创建新订阅")
      newSubscription = await prisma.subscription.create({
        data: {
          userId: user.id,
          planType: giftSubscription.planType,
          status: "active",
          monthlyGenerationsLimit: limits[giftSubscription.planType as keyof typeof limits],
          monthlyGenerationsUsed: 0,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          amount: giftSubscription.amount || 0,
          giftSubscriptionId: giftSubscription.id,
        },
      })

      console.log("[v0] 订阅创建结果:", newSubscription)
    }

    console.log("[v0] 更新礼品订阅状态")
    await prisma.giftSubscription.update({
      where: { id: giftSubscription.id },
      data: {
        status: "redeemed",
        recipientUserId: user.id,
        recipientEmail: user.email,
        redeemedAt: now,
      },
    })

    try {
      console.log("[v0] 记录管理员活动")
      await prisma.adminActivityLog.create({
        data: {
          action: "gift_redeemed",
          targetType: "user",
          targetId: user.id,
          details: {
            gift_code: giftCode,
            redeemed_by: user.email,
            plan_type: giftSubscription.planType,
            created_by: giftSubscription.createdBy,
          },
        },
      })
    } catch (logError) {
      console.error("[v0] 记录管理员活动失败:", logError)
    }

    console.log("[v0] 兑换成功")
    return NextResponse.json({
      success: true,
      message: "兑换成功！",
      data: {
        subscription: newSubscription,
        planType: giftSubscription.planType,
        planName: giftSubscription.planType === "monthly" ? "包月版" : "包年版",
      },
    })
  } catch (error) {
    console.error("[v0] 兑换礼品码错误:", error)
    return NextResponse.json({ success: false, error: "服务异常，请稍后重试" }, { status: 500 })
  }
}
