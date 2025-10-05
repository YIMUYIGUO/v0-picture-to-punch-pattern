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

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ success: true, data: users })
  } catch (error) {
    console.error("Admin users API error:", error)
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

    if (!currentUser || currentUser.role !== "super_admin") {
      return NextResponse.json({ success: false, error: "只有超级管理员可以修改用户角色" }, { status: 403 })
    }

    const { userId, role } = await request.json()

    if (!userId || !role) {
      return NextResponse.json({ success: false, error: "缺少必要参数" }, { status: 400 })
    }

    if (!["user", "admin", "super_admin"].includes(role)) {
      return NextResponse.json({ success: false, error: "无效的角色类型" }, { status: 400 })
    }

    await prisma.user.update({
      where: { id: userId },
      data: { role, updatedAt: new Date() },
    })

    await prisma.adminActivityLog.create({
      data: {
        adminId: session.user.id,
        action: "update_user_role",
        targetType: "user",
        targetId: userId,
        details: { new_role: role },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Admin users PATCH API error:", error)
    return NextResponse.json({ success: false, error: "服务器错误" }, { status: 500 })
  }
}
