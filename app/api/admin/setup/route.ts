import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export const dynamic = "force-dynamic"

export async function POST() {
  try {
    console.log("[v0] Admin setup: Starting")

    // 检查管理员是否已存在
    const existingUser = await prisma.users.findUnique({
      where: { email: "admin@example.com" },
    })

    if (existingUser) {
      // 如果用户已存在，更新密码和角色
      const hashedPassword = await bcrypt.hash("123456", 10)

      await prisma.users.update({
        where: { id: existingUser.id },
        data: {
          password: hashedPassword,
          role: "super_admin",
          displayName: "System Administrator",
        },
      })

      console.log("[v0] Admin setup: Updated existing admin user")
      return NextResponse.json({
        success: true,
        message: "Admin password updated successfully",
        userId: existingUser.id,
      })
    } else {
      // 创建新的管理员用户
      const hashedPassword = await bcrypt.hash("123456", 10)

      const newUser = await prisma.users.create({
        data: {
          email: "admin@example.com",
          password: hashedPassword,
          displayName: "System Administrator",
          role: "super_admin",
        },
      })

      // 创建免费订阅
      await prisma.subscriptions.create({
        data: {
          userId: newUser.id,
          planType: "free",
          status: "active",
          monthlyGenerationsLimit: 10,
          monthlyGenerationsUsed: 0,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      })

      console.log("[v0] Admin setup: Created new admin user")
      return NextResponse.json({
        success: true,
        message: "Admin user created successfully",
        userId: newUser.id,
      })
    }
  } catch (error) {
    console.error("[v0] Error in admin setup:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
