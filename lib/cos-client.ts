import { createHmac, createHash } from "crypto"

/**
 * 创建 COS 签名
 */
async function createCOSSignature(
  method: string,
  pathname: string,
  params: string,
  headers: string,
  secretKey: string,
  keyTime: string,
): Promise<string> {
  // Step 1: Create HttpRequestInfo
  const httpRequestInfo = `${method.toLowerCase()}\n${pathname}\n${params}\n${headers}\n`

  // Step 2: Create StringToSign
  const sha1Hash = createHash("sha1").update(httpRequestInfo).digest("hex")
  const stringToSign = `sha1\n${keyTime}\n${sha1Hash}\n`

  // Step 3: Create SignKey
  const signKey = createHmac("sha1", secretKey).update(keyTime).digest("hex")

  // Step 4: Create Signature
  const signature = createHmac("sha1", signKey).update(stringToSign).digest("hex")

  return signature
}

/**
 * 上传文件到腾讯云COS
 * @param file 文件对象
 * @param key 文件在COS中的路径
 * @returns 文件的公网访问URL
 */
export async function uploadToCOS(file: File | Buffer, key: string): Promise<string> {
  const secretId = process.env.COS_SECRET_ID || process.env.OSS_ACCESS_KEY_ID!
  const secretKey = process.env.COS_SECRET_KEY || process.env.OSS_ACCESS_KEY_SECRET!
  const bucket = process.env.COS_BUCKET || process.env.OSS_BUCKET!
  const region = process.env.COS_REGION || process.env.OSS_REGION!

  // 将File转换为Buffer
  const buffer = file instanceof File ? Buffer.from(await file.arrayBuffer()) : file
  const contentType = file instanceof File ? file.type : "application/octet-stream"
  const contentLength = buffer.length

  // Create COS upload URL
  const cosUrl = `https://${bucket}.cos.${region}.myqcloud.com/${key}`

  const now = Math.floor(Date.now() / 1000)
  const expires = now + 3600 // 1 hour
  const keyTime = `${now};${expires}`

  // Create canonical headers (sorted by key)
  const headerList = ["content-length", "content-type", "host"]
  const headers = headerList
    .map((headerKey) => {
      switch (headerKey) {
        case "host":
          return `host=${bucket}.cos.${region}.myqcloud.com`
        case "content-type":
          return `content-type=${encodeURIComponent(contentType)}`
        case "content-length":
          return `content-length=${contentLength}`
        default:
          return ""
      }
    })
    .join("&")

  // Create signature
  const signature = await createCOSSignature("put", `/${key}`, "", headers, secretKey, keyTime)

  // Create authorization header
  const authorization = `q-sign-algorithm=sha1&q-ak=${secretId}&q-sign-time=${keyTime}&q-key-time=${keyTime}&q-header-list=${headerList.join(";")}&q-url-param-list=&q-signature=${signature}`

  console.log("[v0] Uploading to COS:", cosUrl)

  // Upload to COS using fetch
  const uploadResponse = await fetch(cosUrl, {
    method: "PUT",
    headers: {
      Authorization: authorization,
      "Content-Type": contentType,
      "Content-Length": contentLength.toString(),
      Host: `${bucket}.cos.${region}.myqcloud.com`,
    },
    body: buffer,
  })

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text()
    console.error("[v0] COS upload failed:", uploadResponse.status, errorText)
    throw new Error(`COS upload failed: ${uploadResponse.status} ${errorText}`)
  }

  // 构建公网访问URL
  const url = `https://${bucket}.cos.${region}.myqcloud.com/${key}`
  console.log("[v0] File uploaded to COS:", url)

  return url
}

/**
 * 删除COS中的文件
 * @param key 文件在COS中的路径
 */
export async function deleteFromCOS(key: string): Promise<void> {
  const secretId = process.env.COS_SECRET_ID || process.env.OSS_ACCESS_KEY_ID!
  const secretKey = process.env.COS_SECRET_KEY || process.env.OSS_ACCESS_KEY_SECRET!
  const bucket = process.env.COS_BUCKET || process.env.OSS_BUCKET!
  const region = process.env.COS_REGION || process.env.OSS_REGION!

  const cosUrl = `https://${bucket}.cos.${region}.myqcloud.com/${key}`

  const now = Math.floor(Date.now() / 1000)
  const expires = now + 3600
  const keyTime = `${now};${expires}`

  const headerList = ["host"]
  const headers = `host=${bucket}.cos.${region}.myqcloud.com`

  const signature = await createCOSSignature("delete", `/${key}`, "", headers, secretKey, keyTime)

  const authorization = `q-sign-algorithm=sha1&q-ak=${secretId}&q-sign-time=${keyTime}&q-key-time=${keyTime}&q-header-list=${headerList.join(";")}&q-url-param-list=&q-signature=${signature}`

  const deleteResponse = await fetch(cosUrl, {
    method: "DELETE",
    headers: {
      Authorization: authorization,
      Host: `${bucket}.cos.${region}.myqcloud.com`,
    },
  })

  if (!deleteResponse.ok) {
    const errorText = await deleteResponse.text()
    console.error("[v0] COS delete failed:", deleteResponse.status, errorText)
    throw new Error(`COS delete failed: ${deleteResponse.status}`)
  }

  console.log("[v0] File deleted from COS:", key)
}
