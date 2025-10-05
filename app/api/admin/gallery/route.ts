import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser, isAdmin } from "@/lib/db"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, error: "未授权" }, { status: 401 })
    }

    if (!(await isAdmin())) {
      return NextResponse.json({ success: false, error: "权限不足" }, { status: 403 })
    }

    const patterns = await prisma.sharedPattern.findMany({
      include: {
        user: {
          select: {
            displayName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json({ success: true, data: patterns })
  } catch (error) {
    console.error("Admin gallery API error:", error)
    return NextResponse.json({ success: false, error: "服务器错误" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, error: "未授权" }, { status: 401 })
    }

    if (!(await isAdmin())) {
      return NextResponse.json({ success: false, error: "权限不足" }, { status: 403 })
    }

    const { patternId, isPublic, reason } = await request.json()

    if (!patternId || typeof isPublic !== "boolean") {
      return NextResponse.json({ success: false, error: "缺少必要参数" }, { status: 400 })
    }

    const updateData: any = {
      isPublic,
      approvalStatus: isPublic ? "approved" : "rejected",
    }

    if (isPublic) {
      updateData.approvedAt = new Date()
    }

    await prisma.sharedPattern.update({
      where: { id: patternId },
      data: updateData,
    })

    // 记录活动日志
    await prisma.adminActivityLog.create({
      data: {
        adminId: user.id,
        action: isPublic ? "approve_pattern" : "reject_pattern",
        targetType: "pattern",
        targetId: patternId,
        details: { reason },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Admin gallery PATCH API error:", error)
    return NextResponse.json({ success: false, error: "服务器错误" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, error: "未授权" }, { status: 401 })
    }

    if (!(await isAdmin())) {
      return NextResponse.json({ success: false, error: "权限不足" }, { status: 403 })
    }

    const { patternId, reason } = await request.json()

    if (!patternId) {
      return NextResponse.json({ success: false, error: "缺少作品ID" }, { status: 400 })
    }

    // 获取作品信息用于日志
    const pattern = await prisma.sharedPattern.findUnique({
      where: { id: patternId },
      select: {
        title: true,
        userId: true,
      },
    })

    // 删除作品（级联删除点赞）
    await prisma.sharedPattern.delete({
      where: { id: patternId },
    })

    // 记录活动日志
    await prisma.adminActivityLog.create({
      data: {
        adminId: user.id,
        action: "delete_pattern",
        targetType: "pattern",
        targetId: patternId,
        details: {
          reason,
          pattern_title: pattern?.title,
          pattern_user_id: pattern?.userId,
        },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Admin gallery DELETE API error:", error)
    return NextResponse.json({ success: false, error: "服务器错误" }, { status: 500 })
  }
}
