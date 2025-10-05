import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
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

    const subscriptions = await prisma.subscription.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { monthlyGenerationsUsed: "desc" },
    })

    // 计算统计数据
    const stats = {
      totalUsers: subscriptions.length,
      freeUsers: subscriptions.filter((s) => s.planType === "free").length,
      proUsers: subscriptions.filter((s) => s.planType === "pro").length,
      enterpriseUsers: subscriptions.filter((s) => s.planType === "enterprise").length,
      totalUsage: subscriptions.reduce((sum, s) => sum + s.monthlyGenerationsUsed, 0),
      averageUsage:
        subscriptions.length > 0
          ? subscriptions.reduce((sum, s) => sum + s.monthlyGenerationsUsed, 0) / subscriptions.length
          : 0,
      highUsageUsers: subscriptions.filter((s) => s.monthlyGenerationsUsed / s.monthlyGenerationsLimit > 0.8).length,
    }

    return NextResponse.json({ success: true, data: { subscriptions, stats } })
  } catch (error) {
    console.error("Admin usage limits API error:", error)
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

    const { userId, action, value } = await request.json()

    if (!userId || !action) {
      return NextResponse.json({ success: false, error: "缺少必要参数" }, { status: 400 })
    }

    let updateData: any = {}

    switch (action) {
      case "reset_usage":
        updateData = { monthlyGenerationsUsed: 0 }
        break
      case "update_limit":
        if (typeof value !== "number" || value < 0) {
          return NextResponse.json({ success: false, error: "无效的限制值" }, { status: 400 })
        }
        updateData = { monthlyGenerationsLimit: value }
        break
      case "extend_period":
        if (typeof value !== "number" || value < 1) {
          return NextResponse.json({ success: false, error: "无效的延期天数" }, { status: 400 })
        }
        const currentDate = new Date()
        const extendedDate = new Date(currentDate.getTime() + value * 24 * 60 * 60 * 1000)
        updateData = { currentPeriodEnd: extendedDate }
        break
      default:
        return NextResponse.json({ success: false, error: "无效的操作类型" }, { status: 400 })
    }

    await prisma.subscription.update({
      where: { userId },
      data: updateData,
    })

    await prisma.adminActivityLog.create({
      data: {
        adminId: session.user.id,
        action: `admin_${action}`,
        targetType: "subscription",
        targetId: userId,
        details: { action, value },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Admin usage limits PATCH API error:", error)
    return NextResponse.json({ success: false, error: "服务器错误" }, { status: 500 })
  }
}
