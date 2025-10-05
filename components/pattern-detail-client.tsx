"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Heart, Eye, ArrowLeft, Download, Copy, Check } from "lucide-react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import { zhCN } from "date-fns/locale"
import { toast } from "sonner"
import { useSession } from "next-auth/react"

interface SharedPattern {
  id: string
  title: string
  description: string
  imageUrl: string
  originalImageUrl: string
  panelWidth: number
  panelHeight: number
  holeDiameter: number
  holeSpacing: number
  conversionMode: string
  patternData: any
  likesCount: number
  viewsCount: number
  createdAt: string
  userId: string
  userDisplayName: string
}

export default function PatternDetailClient() {
  const [pattern, setPattern] = useState<SharedPattern | null>(null)
  const [loading, setLoading] = useState(true)
  const [isLiked, setIsLiked] = useState(false)
  const [copied, setCopied] = useState(false)

  const params = useParams()
  const router = useRouter()
  const patternId = params.id as string
  const { data: session } = useSession()

  useEffect(() => {
    if (patternId) {
      fetchPattern()
      incrementViews()
    }
  }, [patternId])

  useEffect(() => {
    if (session?.user && pattern) {
      checkIfLiked()
    }
  }, [session, pattern])

  const fetchPattern = async () => {
    try {
      const response = await fetch(`/api/gallery/${patternId}`)
      if (!response.ok) throw new Error("Failed to fetch pattern")

      const data = await response.json()
      setPattern(data)
    } catch (error) {
      console.error("获取作品详情失败:", error)
      router.push("/gallery")
    } finally {
      setLoading(false)
    }
  }

  const incrementViews = async () => {
    try {
      await fetch(`/api/gallery/${patternId}/view`, {
        method: "POST",
      })
    } catch (error) {
      console.error("更新浏览次数失败:", error)
    }
  }

  const checkIfLiked = async () => {
    if (!session?.user || !pattern) return

    try {
      const response = await fetch(`/api/gallery/${patternId}/like`)
      const data = await response.json()
      setIsLiked(data.isLiked)
    } catch (error) {
      setIsLiked(false)
    }
  }

  const handleLike = async () => {
    if (!session?.user) {
      toast.error("请先登录")
      return
    }

    if (!pattern) return

    try {
      const response = await fetch(`/api/gallery/${patternId}/like`, {
        method: "POST",
      })

      if (!response.ok) throw new Error("Failed to like pattern")

      const data = await response.json()
      setIsLiked(data.isLiked)
      setPattern((prev) =>
        prev ? { ...prev, likesCount: data.isLiked ? prev.likesCount + 1 : prev.likesCount - 1 } : null,
      )
      toast.success(data.isLiked ? "点赞成功" : "已取消点赞")
    } catch (error) {
      console.error("点赞失败:", error)
      toast.error("操作失败，请重试")
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      toast.success("链接已复制到剪贴板")
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error("复制失败")
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
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-6">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/4 mb-6" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="aspect-video bg-muted rounded-lg" />
              <div className="space-y-4">
                <div className="h-6 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-1/2" />
                <div className="h-20 bg-muted rounded" />
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (!pattern) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-6">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold mb-4">作品不存在</h1>
            <Link href="/gallery">
              <Button>返回广场</Button>
            </Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <Link href="/gallery">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回广场
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <Card>
              <CardContent className="p-0">
                <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                  {pattern.imageUrl ? (
                    <img
                      src={pattern.imageUrl || "/placeholder.svg"}
                      alt={pattern.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      冲孔图案预览
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {pattern.originalImageUrl && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">原始图片</CardTitle>
                </CardHeader>
                <CardContent className="p-0 px-6 pb-6">
                  <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                    <img
                      src={pattern.originalImageUrl || "/placeholder.svg"}
                      alt="原始图片"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-2xl mb-2">{pattern.title}</CardTitle>
                    <CardDescription className="text-base">{pattern.description || "暂无描述"}</CardDescription>
                  </div>
                </div>

                <div className="flex items-center space-x-4 text-sm text-muted-foreground pt-4">
                  <div className="flex items-center space-x-1">
                    <Eye className="w-4 h-4" />
                    <span>{pattern.viewsCount} 浏览</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Heart className="w-4 h-4" />
                    <span>{pattern.likesCount} 点赞</span>
                  </div>
                  <span>
                    {formatDistanceToNow(new Date(pattern.createdAt), {
                      addSuffix: true,
                      locale: zhCN,
                    })}
                  </span>
                </div>
              </CardHeader>

              <CardContent>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="secondary">
                    {pattern.panelWidth} × {pattern.panelHeight} mm
                  </Badge>
                  <Badge variant="outline">孔径 {pattern.holeDiameter}mm</Badge>
                  <Badge variant="outline">孔距 {pattern.holeSpacing}mm</Badge>
                  <Badge variant="outline">{getConversionModeLabel(pattern.conversionMode)}</Badge>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button variant={isLiked ? "default" : "outline"} onClick={handleLike} disabled={!session?.user}>
                    <Heart className={`w-4 h-4 mr-2 ${isLiked ? "fill-current" : ""}`} />
                    {isLiked ? "已点赞" : "点赞"}
                  </Button>

                  <Button variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    下载图案
                  </Button>

                  <Button variant="outline" onClick={copyToClipboard}>
                    {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                    {copied ? "已复制" : "分享链接"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">技术参数</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">面板宽度</div>
                    <div className="font-medium">{pattern.panelWidth} mm</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">面板高度</div>
                    <div className="font-medium">{pattern.panelHeight} mm</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">孔径</div>
                    <div className="font-medium">{pattern.holeDiameter} mm</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">孔距</div>
                    <div className="font-medium">{pattern.holeSpacing} mm</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">转换模式</div>
                    <div className="font-medium">{getConversionModeLabel(pattern.conversionMode)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">创建者</div>
                    <div className="font-medium">{pattern.userDisplayName || "匿名用户"}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
