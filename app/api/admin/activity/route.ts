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

    // 获取活动日志及关联的管理员信息
    const activities = await prisma.adminActivityLog.findMany({
      include: {
        admin: {
          select: {
            displayName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 100,
    })

    return NextResponse.json({ success: true, data: activities })
  } catch (error) {
    console.error("Admin activity API error:", error)
    return NextResponse.json({ success: false, error: "服务器错误" }, { status: 500 })
  }
}
