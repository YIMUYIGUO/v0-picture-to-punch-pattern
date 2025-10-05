"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { Header } from "@/components/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Heart, Eye, Search, Grid, List } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  hole_spacing: number
  conversion_mode: string
  likes_count: number
  views_count: number
  created_at: string
  user_id: string
  user_display_name: string
}

export default function GalleryPageClient() {
  const [patterns, setPatterns] = useState<SharedPattern[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("created_at")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const { user, loading: authLoading } = useAuth()

  useEffect(() => {
    fetchPatterns()
  }, [sortBy])

  const fetchPatterns = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/gallery?sortBy=${sortBy}&limit=50`)
      const result = await response.json()

      if (result.success) {
        setPatterns(result.data || [])
      }
    } catch (error) {
      console.error("获取作品失败:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async (patternId: string) => {
    if (!user) {
      alert("请先登录")
      return
    }

    try {
      const response = await fetch(`/api/gallery/${patternId}/like`, {
        method: "POST",
      })

      if (response.ok) {
        fetchPatterns()
      }
    } catch (error) {
      console.error("点赞失败:", error)
    }
  }

  const filteredPatterns = patterns.filter(
    (pattern) =>
      pattern.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pattern.description.toLowerCase().includes(searchQuery.toLowerCase()),
  )

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

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>加载中...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">作品广场</h1>
          <p className="text-muted-foreground">发现和分享精美的冲孔图案设计</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="搜索作品标题或描述..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex gap-2">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">最新发布</SelectItem>
                <SelectItem value="likes_count">最多点赞</SelectItem>
                <SelectItem value="views_count">最多浏览</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex border rounded-md">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="rounded-r-none"
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="rounded-l-none"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="aspect-video bg-muted rounded-t-lg" />
                <CardHeader>
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : (
          <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
            {filteredPatterns.map((pattern) => (
              <Card key={pattern.id} className={viewMode === "list" ? "flex" : ""}>
                <div className={viewMode === "list" ? "w-48 shrink-0" : ""}>
                  <div className="aspect-video bg-muted rounded-t-lg relative overflow-hidden">
                    {pattern.image_url ? (
                      <img
                        src={pattern.image_url || "/placeholder.svg"}
                        alt={pattern.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.log("[v0] Gallery image failed to load:", pattern.image_url)
                          e.currentTarget.style.display = "none"
                          e.currentTarget.nextElementSibling?.classList.remove("hidden")
                        }}
                        onLoad={() => {
                          console.log("[v0] Gallery image loaded successfully:", pattern.image_url)
                        }}
                      />
                    ) : null}
                    <div
                      className={`w-full h-full flex items-center justify-center text-muted-foreground ${pattern.image_url ? "hidden" : ""}`}
                    >
                      {pattern.image_url ? "图片加载失败" : "暂无预览图"}
                    </div>
                  </div>
                </div>

                <div className="flex-1">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg line-clamp-1">{pattern.title}</CardTitle>
                        <CardDescription className="line-clamp-2">{pattern.description || "暂无描述"}</CardDescription>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge variant="secondary">
                        {pattern.panel_width} × {pattern.panel_height} mm
                      </Badge>
                      <Badge variant="outline">孔径 {pattern.hole_diameter}mm</Badge>
                      <Badge variant="outline">{getConversionModeLabel(pattern.conversion_mode)}</Badge>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Eye className="w-4 h-4" />
                          <span>{pattern.views_count}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Heart className="w-4 h-4" />
                          <span>{pattern.likes_count}</span>
                        </div>
                        <span>
                          {formatDistanceToNow(new Date(pattern.created_at), {
                            addSuffix: true,
                            locale: zhCN,
                          })}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => handleLike(pattern.id)} disabled={!user}>
                          <Heart className="w-4 h-4" />
                        </Button>
                        <Link href={`/gallery/${pattern.id}`}>
                          <Button variant="outline" size="sm">
                            查看详情
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </div>
              </Card>
            ))}
          </div>
        )}

        {!loading && filteredPatterns.length === 0 && (
          <div className="text-center py-12">
            <div className="text-muted-foreground mb-4">{searchQuery ? "没有找到匹配的作品" : "还没有分享的作品"}</div>
            <Link href="/">
              <Button>创建第一个作品</Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
