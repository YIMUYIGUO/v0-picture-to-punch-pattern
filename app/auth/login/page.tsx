import type { Metadata } from "next"
import LoginPageClient from "@/components/login-page-client"

export const metadata: Metadata = {
  title: "登录 - 铝单板图案孔软件",
  description: "登录您的铝单板图案孔软件账户，开始创作精美的冲孔图案设计。",
  robots: {
    index: false, // 登录页面不需要被搜索引擎索引
    follow: true,
  },
}

export default function LoginPage() {
  return <LoginPageClient />
}
