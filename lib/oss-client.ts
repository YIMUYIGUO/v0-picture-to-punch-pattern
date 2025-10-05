import { createHmac } from "crypto"

/**
 * 上传文件到阿里云OSS
 * @param file 文件对象
 * @param key 文件在OSS中的路径
 * @returns 文件的公网访问URL
 */
export async function uploadToOSS(file: File | Buffer, key: string): Promise<string> {
  const accessKeyId = process.env.OSS_ACCESS_KEY_ID!
  const accessKeySecret = process.env.OSS_ACCESS_KEY_SECRET!
  const bucket = process.env.OSS_BUCKET!
  const region = process.env.OSS_REGION!

  // 将File转换为Buffer
  const buffer = file instanceof File ? Buffer.from(await file.arrayBuffer()) : file
  const contentType = file instanceof File ? file.type : "application/octet-stream"

  // Create OSS upload URL
  const ossUrl = `https://${bucket}.${region}.aliyuncs.com/${key}`

  // Create date string
  const date = new Date().toUTCString()

  // Create canonical string for signature
  const canonicalString = `PUT\n\n${contentType}\n${date}\n/${bucket}/${key}`

  // Create signature
  const signature = createHmac("sha1", accessKeySecret).update(canonicalString).digest("base64")

  // Create authorization header
  const authorization = `OSS ${accessKeyId}:${signature}`

  console.log("[v0] Uploading to OSS:", ossUrl)

  // Upload to OSS using fetch
  const uploadResponse = await fetch(ossUrl, {
    method: "PUT",
    headers: {
      Authorization: authorization,
      "Content-Type": contentType,
      Date: date,
      "x-oss-object-acl": "public-read",
    },
    body: buffer,
  })

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text()
    console.error("[v0] OSS upload failed:", uploadResponse.status, errorText)
    throw new Error(`OSS upload failed: ${uploadResponse.status} ${errorText}`)
  }

  // 构建公网访问URL
  const url = `https://${bucket}.${region}.aliyuncs.com/${key}`
  console.log("[v0] File uploaded to OSS:", url)

  return url
}

/**
 * 删除OSS中的文件
 * @param key 文件在OSS中的路径
 */
export async function deleteFromOSS(key: string): Promise<void> {
  const accessKeyId = process.env.OSS_ACCESS_KEY_ID!
  const accessKeySecret = process.env.OSS_ACCESS_KEY_SECRET!
  const bucket = process.env.OSS_BUCKET!
  const region = process.env.OSS_REGION!

  const ossUrl = `https://${bucket}.${region}.aliyuncs.com/${key}`

  const date = new Date().toUTCString()
  const canonicalString = `DELETE\n\n\n${date}\n/${bucket}/${key}`
  const signature = createHmac("sha1", accessKeySecret).update(canonicalString).digest("base64")
  const authorization = `OSS ${accessKeyId}:${signature}`

  const deleteResponse = await fetch(ossUrl, {
    method: "DELETE",
    headers: {
      Authorization: authorization,
      Date: date,
    },
  })

  if (!deleteResponse.ok) {
    const errorText = await deleteResponse.text()
    console.error("[v0] OSS delete failed:", deleteResponse.status, errorText)
    throw new Error(`OSS delete failed: ${deleteResponse.status}`)
  }

  console.log("[v0] File deleted from OSS:", key)
}
