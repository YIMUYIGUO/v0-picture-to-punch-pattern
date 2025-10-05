import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

// 默认设置常量
const DEFAULT_SETTINGS = {
  free_user_download_limit: "5",
  payment_enabled: "false",
  gallery_moderation: "false",
  max_panel_size_free: "1200",
  max_panel_size_pro: "5000",
  max_panel_size_enterprise: "99999",
}

export async function GET() {
  try {
    console.log("[v0] Settings API: Starting request")

    // 尝试从数据库获取设置
    try {
      const settings = await prisma.systemSettings.findMany({
        where: {
          key: {
            in: [
              "free_user_download_limit",
              "payment_enabled",
              "gallery_moderation",
              "max_panel_size_free",
              "max_panel_size_pro",
              "max_panel_size_enterprise",
            ],
          },
        },
      })

      console.log("[v0] Settings API: Query successful, got", settings.length, "settings")

      // 转换为键值对象
      const settingsObj = settings.reduce(
        (acc, setting) => {
          acc[setting.key] = setting.value
          return acc
        },
        {} as Record<string, string>,
      )

      // 合并默认值和数据库值
      const finalSettings = { ...DEFAULT_SETTINGS, ...settingsObj }

      console.log("[v0] Settings API: Returning settings:", finalSettings)
      return NextResponse.json({ success: true, data: finalSettings })
    } catch (dbError) {
      // 数据库连接错误，返回默认值
      console.log("[v0] Settings API: Database error, using defaults:", dbError)
      return NextResponse.json({ success: true, data: DEFAULT_SETTINGS })
    }
  } catch (error) {
    // 最外层错误处理
    console.log("[v0] Settings API: Unexpected error, using defaults:", error)
    return NextResponse.json({ success: true, data: DEFAULT_SETTINGS })
  }
}
