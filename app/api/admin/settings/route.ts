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

    const settings = await prisma.systemSetting.findMany({
      orderBy: { key: "asc" },
    })

    return NextResponse.json({ success: true, data: settings })
  } catch (error) {
    console.error("Admin settings API error:", error)
    return NextResponse.json({ success: false, error: "获取系统设置失败" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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

    const { key, value } = await request.json()

    if (!key || value === undefined) {
      return NextResponse.json({ success: false, error: "缺少必要参数" }, { status: 400 })
    }

    await prisma.systemSetting.upsert({
      where: { key },
      update: { value: String(value), updatedAt: new Date() },
      create: { key, value: String(value) },
    })

    await prisma.adminActivityLog.create({
      data: {
        adminId: session.user.id,
        action: "update_system_setting",
        targetType: "setting",
        targetId: null,
        details: { key, value, setting_key: key },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Admin settings POST API error:", error)
    return NextResponse.json({ success: false, error: "服务器错误" }, { status: 500 })
  }
}
