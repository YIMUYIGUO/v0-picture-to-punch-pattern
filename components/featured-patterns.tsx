"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Heart, Eye, ArrowRight } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { zhCN } from "date-fns/locale"

interface SharedPattern {
  id: string
  title: string
  description: string
  image_url: string
  original_image_url: string
  panel_width: number
  panel_height: number
  hole_diameter: number
  conversion_mode: string
  likes_count: number
  views_count: number
  created_at: string
}

const MOCK_PATTERNS: SharedPattern[] = [
  {
    id: "demo-1",
    title: "孙悟空冲孔图案",
    description: "经典西游记人物形象，采用密度映射技术，细节丰富",
    image_url: "/placeholder.svg?height=400&width=600",
    original_image_url: "/placeholder.svg?height=400&width=600",
    panel_width: 1200,
    panel_height: 1800,
    hole_diameter: 5,
    conversion_mode: "density",
    likes_count: 128,
    views_count: 1543,
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "demo-2",
    title: "现代几何图案",
    description: "简约现代风格，适合商业空间装饰",
    image_url: "/placeholder.svg?height=400&width=600",
    original_image_url: "/placeholder.svg?height=400&width=600",
    panel_width: 1000,
    panel_height: 1000,
    hole_diameter: 3,
    conversion_mode: "contour",
    likes_count: 95,
    views_count: 876,
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "demo-3",
    title: "自然风景图案",
    description: "山水风景主题，营造宁静氛围",
    image_url: "/placeholder.svg?height=400&width=600",
    original_image_url: "/placeholder.svg?height=400&width=600",
    panel_width: 1500,
    panel_height: 1000,
    hole_diameter: 4,
    conversion_mode: "density",
    likes_count: 156,
    views_count: 2134,
    created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

export function FeaturedPatterns() {
  const [patterns, setPatterns] = useState<SharedPattern[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchFeaturedPatterns()
  }, [])

  const fetchFeaturedPatterns = async () => {
    try {
      console.log("[v0] Featured patterns: Using mock data in preview environment")
      setPatterns(MOCK_PATTERNS)
      setError(null)
      setLoading(false)
      return
    } catch (error) {
      console.error("[v0] Unexpected error fetching featured patterns:", error)
      setError("network_error")
    } finally {
      setLoading(false)
    }
  }

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

  if (loading) {
    return (
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">精选作品</h2>
            <p className="text-muted-foreground">发现社区中的优秀冲孔图案设计</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="w-full h-80 bg-muted rounded-t-lg" />
                <CardHeader>
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (
    error === "preview_mode" ||
    error === "network_error" ||
    error === "database_not_ready" ||
    patterns.length === 0
  ) {
    console.log("[v0] Featured patterns component hidden due to:", error || "no patterns")
    return null
  }

  if (error === "permission_denied") {
    return (
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <p className="text-muted-foreground">精选作品功能需要配置数据库权限</p>
            <p className="text-xs text-muted-foreground mt-2">请运行 scripts/034_fix_shared_patterns_rls.sql</p>
          </div>
        </div>
      </section>
    )
  }

  if (error === "fetch_failed") {
    return (
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <p className="text-muted-foreground">暂时无法加载精选作品</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-12 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2">精选作品</h2>
          <p className="text-muted-foreground">发现社区中的优秀冲孔图案设计</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {patterns.map((pattern) => (
            <Card key={pattern.id} className="group hover:shadow-lg transition-shadow">
              <div className="w-full aspect-video bg-muted rounded-t-lg relative overflow-hidden">
                {pattern.image_url ? (
                  <img
                    src={pattern.image_url || "/placeholder.svg"}
                    alt={pattern.title}
                    width={800}
                    height={450}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      console.error("[v0] Featured pattern image failed to load:", {
                        id: pattern.id,
                        title: pattern.title,
                        image_url: pattern.image_url,
                        original_image_url: pattern.original_image_url,
                      })
                      e.currentTarget.style.display = "none"
                      const fallback = e.currentTarget.nextElementSibling as HTMLElement
                      if (fallback) {
                        fallback.classList.remove("hidden")
                      }
                    }}
                    onLoad={() => {
                      console.log("[v0] Featured pattern image loaded successfully:", pattern.title)
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">暂无预览图</div>
                )}
                <div className="w-full h-full flex items-center justify-center text-muted-foreground hidden">
                  图片加载失败
                </div>
              </div>

              <CardHeader>
                <CardTitle className="text-lg line-clamp-1 group-hover:text-primary transition-colors">
                  {pattern.title}
                </CardTitle>
                <CardDescription className="line-clamp-2">{pattern.description || "暂无描述"}</CardDescription>

                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant="secondary" className="text-xs">
                    {pattern.panel_width} × {pattern.panel_height} mm
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {getConversionModeLabel(pattern.conversion_mode)}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Eye className="w-3 h-3" />
                      <span>{pattern.views_count}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Heart className="w-3 h-3" />
                      <span>{pattern.likes_count}</span>
                    </div>
                  </div>

                  <Link href={`/gallery/${pattern.id}`}>
                    <Button variant="ghost" size="sm" className="text-xs">
                      查看详情
                    </Button>
                  </Link>
                </div>

                <div className="text-xs text-muted-foreground mt-2">
                  {formatDistanceToNow(new Date(pattern.created_at), {
                    addSuffix: true,
                    locale: zhCN,
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Link href="/gallery">
            <Button variant="outline">
              查看更多作品
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
