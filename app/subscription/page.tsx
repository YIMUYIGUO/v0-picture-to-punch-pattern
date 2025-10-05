import type { Metadata } from "next"
import SubscriptionPageClient from "@/components/subscription-page-client"

export const metadata: Metadata = {
  title: "订阅管理 - 选择适合您的订阅计划 | 铝单板图案孔软件",
  description:
    "管理您的铝单板图案孔软件订阅计划。提供免费版、包月版、包年版多种选择。查看使用额度、到期时间，使用兑换码激活订阅。专业的冲孔设计工具，满足不同用户需求。",
  keywords: "订阅管理,会员计划,兑换码,使用额度,免费体验,包月订阅,包年订阅",
  openGraph: {
    title: "订阅管理 - 选择适合您的订阅计划",
    description: "管理您的订阅计划，查看使用额度，使用兑换码激活订阅",
    type: "website",
    locale: "zh_CN",
    url: "https://your-domain.com/subscription",
  },
  twitter: {
    card: "summary",
    title: "订阅管理 - 选择适合您的订阅计划",
    description: "管理您的订阅计划，查看使用额度",
  },
  alternates: {
    canonical: "https://your-domain.com/subscription",
  },
  robots: {
    index: false, // 订阅页面不需要被搜索引擎索引
    follow: true,
  },
}

export default function SubscriptionPage() {
  return <SubscriptionPageClient />
}
