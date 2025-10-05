import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { uploadToOSS } from "@/lib/oss-client"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] OSS upload API called")

    // 验证认证
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      console.log("[v0] OSS upload: Unauthorized")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 解析表单数据
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      console.log("[v0] OSS upload: No file provided")
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // 验证文件类型
    if (!file.type.startsWith("image/")) {
      console.log("[v0] OSS upload: Invalid file type:", file.type)
      return NextResponse.json({ error: "File must be an image" }, { status: 400 })
    }

    // 验证文件大小 (最大 10MB)
    if (file.size > 10 * 1024 * 1024) {
      console.log("[v0] OSS upload: File too large:", file.size)
      return NextResponse.json({ error: "File size must be less than 10MB" }, { status: 400 })
    }

    // 生成唯一文件名
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const fileExtension = file.name.split(".").pop() || "png"
    const fileName = `patterns/${session.user.id}/${timestamp}-${randomString}.${fileExtension}`

    console.log("[v0] OSS upload: Generated filename:", fileName)

    // 上传到阿里云 OSS
    const imageUrl = await uploadToOSS(file, fileName)

    console.log("[v0] Image uploaded to OSS successfully:", imageUrl)

    return NextResponse.json({
      success: true,
      url: imageUrl,
      fileName: fileName,
    })
  } catch (error) {
    console.error("[v0] OSS upload error:", error)
    return NextResponse.json(
      { error: "Failed to upload to OSS", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
