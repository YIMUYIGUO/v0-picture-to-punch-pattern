import crypto from "crypto"

/**
 * 根据虎皮椒官方文档生成签名hash
 * @param datas 参数对象
 * @param hashkey APPSECRET密钥
 * @returns MD5签名字符串（32位小写）
 */
export function generateXhHash(datas: Record<string, any>, hashkey: string): string {
  // 按参数名ASCII码从小到大排序（字典序）
  const sortedKeys = Object.keys(datas).sort()

  let arg = ""
  for (const key of sortedKeys) {
    const val = datas[key]
    // 如果参数的值为空不参与签名，hash参数也不参与签名
    if (key === "hash" || val === null || val === undefined || val === "") {
      continue
    }

    if (arg) {
      arg += "&"
    }
    arg += `${key}=${val}`
  }

  // 在stringA最后拼接上APPSECRET(秘钥)得到stringSignTemp字符串
  const stringSignTemp = arg + hashkey

  // 对stringSignTemp进行MD5运算，得到hash值（32位小写）
  return crypto.createHash("md5").update(stringSignTemp).digest("hex")
}
