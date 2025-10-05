import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import "./globals.css"

export const metadata: Metadata = {
  metadataBase: new URL("https://your-domain.com"), // 请替换为实际域名
  title: {
    default: "铝单板图案孔软件 - 一键铝板冲孔设计工具 | 铝板排孔软件",
    template: "%s | 铝单板图案孔软件",
  },
  description:
    "专业的铝单板图案孔软件，支持一键铝板冲孔设计，智能铝板排孔软件。提供密度映射、轮廓提取、像素化等多种冲孔模式，精确控制孔径孔距，支持DXF导出。免费体验，无需下载安装。",
  keywords: "铝单板图案孔软件,一键铝板冲孔,铝板排孔软件,冲孔设计,铝板加工,DXF导出,CAD设计,金属加工,在线设计工具",
  authors: [{ name: "铝单板图案孔软件团队" }],
  creator: "铝单板图案孔软件",
  publisher: "铝单板图案孔软件",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  generator: "Next.js",
  applicationName: "铝单板图案孔软件",
  referrer: "origin-when-cross-origin",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "zh_CN",
    url: "https://your-domain.com",
    siteName: "铝单板图案孔软件",
    title: "铝单板图案孔软件 - 一键铝板冲孔设计工具",
    description: "专业的铝单板图案孔软件，支持一键铝板冲孔设计，智能铝板排孔软件",
    images: [
      {
        url: "/og-image.png", // 需要添加一个 Open Graph 图片
        width: 1200,
        height: 630,
        alt: "铝单板图案孔软件",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "铝单板图案孔软件 - 一键铝板冲孔设计工具",
    description: "专业的铝单板图案孔软件，支持一键铝板冲孔设计，智能铝板排孔软件",
    images: ["/og-image.png"],
  },
  verification: {
    // google: "your-google-verification-code", // 添加 Google Search Console 验证码
    // yandex: "your-yandex-verification-code",
    // bing: "your-bing-verification-code",
  },
  alternates: {
    canonical: "https://your-domain.com",
  },
  category: "technology",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
        <Analytics />
      </body>
    </html>
  )
}
