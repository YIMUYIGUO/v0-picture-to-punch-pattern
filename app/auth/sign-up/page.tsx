import type { Metadata } from "next"
import SignUpPageClient from "@/components/sign-up-page-client"

export const metadata: Metadata = {
  title: "注册 - 铝单板图案孔软件",
  description: "注册铝单板图案孔软件账户，开始创作精美的冲孔图案设计。免费体验专业的在线设计工具。",
  robots: {
    index: false,
    follow: true,
  },
}

export default function SignUpPage() {
  return <SignUpPageClient />
}
