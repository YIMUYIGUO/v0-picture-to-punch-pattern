import type { Metadata } from "next"
import { prisma } from "@/lib/prisma"
import PatternDetailClient from "@/components/pattern-detail-client"

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  try {
    const pattern = await prisma.sharedPattern.findFirst({
      where: {
        id: params.id,
        isPublic: true,
      },
      select: {
        title: true,
        description: true,
        imageUrl: true,
        conversionMode: true,
        panelWidth: true,
        panelHeight: true,
      },
    })

    if (pattern) {
      const getConversionModeLabel = (mode: string) => {
        switch (mode) {
          case "density":
            return "密度映射"
          case "contour":
            return "轮廓提取"
          case "pixelated":
            return "像素化"
          default:
            return mode
        }
      }

      return {
        title: `${pattern.title} - 冲孔图案作品 | 铝单板图案孔软件`,
        description:
          pattern.description ||
          `查看这个精美的${getConversionModeLabel(pattern.conversionMode)}冲孔图案设计，尺寸：${pattern.panelWidth}×${pattern.panelHeight}mm。获取设计灵感，创作您自己的铝单板冲孔图案。`,
        keywords: `${pattern.title},冲孔图案,${getConversionModeLabel(pattern.conversionMode)},铝板设计,图案设计`,
        openGraph: {
          title: `${pattern.title} - 冲孔图案作品`,
          description: pattern.description || `精美的${getConversionModeLabel(pattern.conversionMode)}冲孔图案设计`,
          type: "article",
          locale: "zh_CN",
          url: `https://your-domain.com/gallery/${params.id}`,
          images: pattern.imageUrl ? [{ url: pattern.imageUrl, alt: pattern.title }] : [],
        },
        twitter: {
          card: "summary_large_image",
          title: `${pattern.title} - 冲孔图案作品`,
          description: pattern.description || `精美的${getConversionModeLabel(pattern.conversionMode)}冲孔图案设计`,
          images: pattern.imageUrl ? [pattern.imageUrl] : [],
        },
        alternates: {
          canonical: `https://your-domain.com/gallery/${params.id}`,
        },
      }
    }
  } catch (error) {
    console.error("Error generating metadata:", error)
  }

  return {
    title: "作品详情 | 铝单板图案孔软件",
    description: "查看冲孔图案设计作品详情",
  }
}

export default function PatternDetailPage() {
  return <PatternDetailClient />
}
