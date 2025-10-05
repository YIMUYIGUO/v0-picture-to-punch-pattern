import type { Metadata } from "next"
import GalleryPageClient from "@/components/gallery-page-client"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "作品广场 - 精美冲孔图案设计展示 | 铝单板图案孔软件",
  description:
    "浏览和发现精美的铝单板冲孔图案设计作品。查看其他用户创作的冲孔图案，获取设计灵感，分享您的创意作品。支持按热度、时间排序，快速找到心仪的设计。",
  keywords: "冲孔图案,设计作品,图案展示,设计灵感,铝板设计,作品分享,图案库",
  openGraph: {
    title: "作品广场 - 精美冲孔图案设计展示",
    description: "浏览和发现精美的铝单板冲孔图案设计作品，获取设计灵感",
    type: "website",
    locale: "zh_CN",
    url: "https://your-domain.com/gallery",
  },
  twitter: {
    card: "summary_large_image",
    title: "作品广场 - 精美冲孔图案设计展示",
    description: "浏览和发现精美的铝单板冲孔图案设计作品",
  },
  alternates: {
    canonical: "https://your-domain.com/gallery",
  },
}

export default function GalleryPage() {
  return <GalleryPageClient />
}
