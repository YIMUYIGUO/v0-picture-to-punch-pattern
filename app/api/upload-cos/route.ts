import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createHmac, createHash } from "crypto"

export const dynamic = "force-dynamic"

async function createCOSSignature(
  method: string,
  pathname: string,
  params: string,
  headers: string,
  secretKey: string,
  keyTime: string,
) {
  const httpRequestInfo = `${method.toLowerCase()}\n${pathname}\n${params}\n${headers}\n`
  const sha1Hash = createHash("sha1").update(httpRequestInfo).digest("hex")
  const stringToSign = `sha1\n${keyTime}\n${sha1Hash}\n`
  const signKey = createHmac("sha1", secretKey).update(keyTime).digest("hex")
  const signature = createHmac("sha1", signKey).update(stringToSign).digest("hex")
  return signature
}

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] COS upload API called")

    // 验证认证
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      console.log("[v0] COS upload: Unauthorized")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 解析表单数据
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      console.log("[v0] COS upload: No file provided")
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // 验证文件类型
    if (!file.type.startsWith("image/")) {
      console.log("[v0] COS upload: Invalid file type:", file.type)
      return NextResponse.json({ error: "File must be an image" }, { status: 400 })
    }

    // 验证文件大小 (最大 10MB)
    if (file.size > 10 * 1024 * 1024) {
      console.log("[v0] COS upload: File too large:", file.size)
      return NextResponse.json({ error: "File size must be less than 10MB" }, { status: 400 })
    }

    // 生成唯一文件名
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const fileExtension = file.name.split(".").pop() || "png"
    const fileName = `patterns/${session.user.id}/${timestamp}-${randomString}.${fileExtension}`

    console.log("[v0] COS upload: Generated filename:", fileName)

    // 转换文件为 array buffer
    const arrayBuffer = await file.arrayBuffer()

    const secretId = process.env.COS_SECRET_ID || process.env.OSS_ACCESS_KEY_ID!
    const secretKey = process.env.COS_SECRET_KEY || process.env.OSS_ACCESS_KEY_SECRET!
    const bucket = process.env.COS_BUCKET || process.env.OSS_BUCKET!
    const region = process.env.COS_REGION || process.env.OSS_REGION!

    // 创建 COS 上传 URL
    const cosUrl = `https://${bucket}.cos.${region}.myqcloud.com/${fileName}`

    const now = Math.floor(Date.now() / 1000)
    const expires = now + 3600 // 1 小时
    const keyTime = `${now};${expires}`

    // 创建规范化 headers (按 key 排序)
    const headerList = ["content-length", "content-type", "host"]
    const headers = headerList
      .map((key) => {
        switch (key) {
          case "host":
            return `host=${bucket}.cos.${region}.myqcloud.com`
          case "content-type":
            return `content-type=${encodeURIComponent(file.type)}`
          case "content-length":
            return `content-length=${file.size}`
          default:
            return ""
        }
      })
      .join("&")

    // 创建签名
    const signature = await createCOSSignature("put", `/${fileName}`, "", headers, secretKey, keyTime)

    // 创建授权 header
    const authorization = `q-sign-algorithm=sha1&q-ak=${secretId}&q-sign-time=${keyTime}&q-key-time=${keyTime}&q-header-list=${headerList.join(";")}&q-url-param-list=&q-signature=${signature}`

    console.log("[v0] COS upload: Uploading to:", cosUrl)

    // 使用 fetch 上传到 COS
    const uploadResponse = await fetch(cosUrl, {
      method: "PUT",
      headers: {
        Authorization: authorization,
        "Content-Type": file.type,
        "Content-Length": file.size.toString(),
        Host: `${bucket}.cos.${region}.myqcloud.com`,
      },
      body: arrayBuffer,
    })

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text()
      console.error("[v0] COS upload failed:", uploadResponse.status, errorText)
      throw new Error(`COS upload failed: ${uploadResponse.status} ${errorText}`)
    }

    // 构建公开 URL
    const imageUrl = `https://${bucket}.cos.${region}.myqcloud.com/${fileName}`

    console.log("[v0] Image uploaded to COS successfully:", imageUrl)

    return NextResponse.json({
      success: true,
      url: imageUrl,
      fileName: fileName,
    })
  } catch (error) {
    console.error("[v0] COS upload error:", error)
    return NextResponse.json(
      { error: "Failed to upload to COS", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
