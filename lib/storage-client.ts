import { uploadToCOS } from "./cos-client"
import { uploadToOSS } from "./oss-client"

/**
 * 统一的存储上传接口
 * 根据环境变量自动选择使用 COS 或 OSS
 */
export async function uploadToStorage(file: File | Buffer, key: string): Promise<string> {
  // 检查是否配置了 OSS
  const useOSS = process.env.OSS_ACCESS_KEY_ID && process.env.OSS_ACCESS_KEY_SECRET && process.env.OSS_BUCKET

  if (useOSS) {
    console.log("[v0] Using Aliyun OSS for storage")
    return uploadToOSS(file, key)
  } else {
    console.log("[v0] Using Tencent COS for storage")
    return uploadToCOS(file, key)
  }
}

/**
 * 获取当前使用的存储服务类型
 */
export function getStorageType(): "oss" | "cos" {
  const useOSS = process.env.OSS_ACCESS_KEY_ID && process.env.OSS_ACCESS_KEY_SECRET && process.env.OSS_BUCKET
  return useOSS ? "oss" : "cos"
}
