import type { Metadata } from "next"
import PunchHoleApp from "@/components/punch-hole-app"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "铝单板图案孔软件 - 一键铝板冲孔设计工具 | 在线铝板排孔软件",
  description:
    "专业的在线铝单板图案孔软件，支持一键铝板冲孔设计，智能铝板排孔软件。提供密度映射、轮廓提取、像素化等多种冲孔模式,精确控制孔径孔距，支持DXF导出。免费体验，无需下载安装。",
  keywords:
    "铝单板图案孔软件,一键铝板冲孔,铝板排孔软件,冲孔设计,铝板加工,DXF导出,CAD设计,金属加工,在线设计工具,图案设计",
  openGraph: {
    title: "铝单板图案孔软件 - 一键铝板冲孔设计工具",
    description: "专业的在线铝单板图案孔软件，支持一键铝板冲孔设计，智能铝板排孔软件",
    type: "website",
    locale: "zh_CN",
  },
  twitter: {
    card: "summary_large_image",
    title: "铝单板图案孔软件 - 一键铝板冲孔设计工具",
    description: "专业的在线铝单板图案孔软件，支持一键铝板冲孔设计",
  },
  alternates: {
    canonical: "/",
  },
}

export default function HomePage() {
  return <PunchHoleApp />
}
