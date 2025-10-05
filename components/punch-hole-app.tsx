"use client"

import { useState, useCallback, useMemo, useEffect, useRef } from "react"
import { useAuth } from "@/hooks/use-auth"
import { ImageUploadSection } from "@/components/image-upload-section"
import { ParameterPanel } from "@/components/parameter-panel"
import { PreviewCanvas, type PreviewCanvasRef } from "@/components/preview-canvas"
import { Header } from "@/components/header"
import { ShareDialog } from "@/components/share-dialog"
import { ExportDialog } from "@/components/export-dialog"
import { FeaturedPatterns } from "@/components/featured-patterns"
import { toast } from "sonner"
import { useSubscription } from "@/hooks/use-subscription"
import { useSystemSettings } from "@/hooks/use-system-settings"
import { AlertTriangle, Share2, Lock, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface PunchHole {
  x: number
  y: number
  diameter: number
  intensity: number
}

export default function PunchHoleApp() {
  const [punchHoles, setPunchHoles] = useState<PunchHole[]>([])
  const [panelDimensions, setPanelDimensions] = useState({
    length: 1000,
    width: 600,
    thickness: 3,
  })
  const [holeDiameters, setHoleDiameters] = useState<number[]>([3, 5, 8])
  const [holeSpacing, setHoleSpacing] = useState(5)
  const [conversionMode, setConversionMode] = useState("density")
  const [aluminumColor, setAluminumColor] = useState("#f3f4f6")
  const [holeColor, setHoleColor] = useState("#374151")
  const [gridDivision, setGridDivision] = useState({
    horizontal: 2,
    vertical: 2,
    enabled: false,
    horizontalSpacings: [600],
    verticalSpacings: [1500],
  })
  const [holeShape, setHoleShape] = useState<"circle" | "square" | "hexagon" | "triangle">("circle")
  const [edgeMargin, setEdgeMargin] = useState(0)
  const [isCanvasLocked, setIsCanvasLocked] = useState(false)
  const [isDemoLoaded, setIsDemoLoaded] = useState(false)

  const { user, loading } = useAuth()
  const previewCanvasRef = useRef<PreviewCanvasRef>(null)
  const { subscription, canDownload, incrementUsage } = useSubscription()
  const { getFreeUserLimit, getMaxPanelSize } = useSystemSettings()

  const router = useRouter()

  useEffect(() => {
    const loadDemoImage = () => {
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.onload = () => {
        console.log("[v0] Demo image loaded successfully")
        setBackgroundImage(img)
        setOriginalImageUrl("/placeholder-user.jpg")
        setIsDemoLoaded(true)

        const aspectRatio = img.width / img.height
        const maxSize = 800
        let newWidth, newHeight

        if (aspectRatio > 1) {
          newWidth = maxSize
          newHeight = Math.round(maxSize / aspectRatio)
        } else {
          newHeight = maxSize
          newWidth = Math.round(maxSize * aspectRatio)
        }

        setPanelDimensions((prev) => ({
          ...prev,
          length: newHeight,
          width: newWidth,
        }))
      }
      img.onerror = () => {
        console.error("[v0] Failed to load demo image")
        setIsDemoLoaded(false)
      }
      img.src = "/placeholder-user.jpg"
    }

    loadDemoImage()
  }, [])

  const [backgroundImage, setBackgroundImage] = useState<HTMLImageElement | null>(null)
  const [originalImageUrl, setOriginalImageUrl] = useState<string>("")

  const handleImageProcessed = useCallback(
    async (holes: PunchHole[], imageUrl?: string, imageElement?: HTMLImageElement) => {
      console.log("[v0] Received processed punch holes:", holes.length)

      setPunchHoles(holes)

      if (imageUrl && imageUrl !== originalImageUrl) {
        setOriginalImageUrl(imageUrl)
      }

      if (imageElement && imageElement !== backgroundImage) {
        setBackgroundImage(imageElement)
      }

      if (holes.length > 0) {
        const patternData = {
          panelWidth: panelDimensions.width,
          panelHeight: panelDimensions.length,
          holeDiameter: holeDiameters[0] || 3,
          holeSpacing: holeSpacing,
          conversionMode: conversionMode,
          parameters: {
            holeDiameters,
            holeSpacing,
            conversionMode,
            panelDimensions,
            edgeMargin,
          },
          holes: holes,
        }

        setGeneratedPatternData(patternData)

        if (user) {
          toast.success(`图案生成成功！生成了 ${holes.length} 个冲孔点`)
        } else {
          toast.success(`图案生成成功！生成了 ${holes.length} 个冲孔点 - 登录后可保存和下载`)
        }
      }
    },
    [user, originalImageUrl, backgroundImage, panelDimensions, holeDiameters, holeSpacing, conversionMode, edgeMargin],
  )

  const [generatedPatternData, setGeneratedPatternData] = useState<any>(null)

  const handleParameterChange = useCallback(
    (newDimensions: typeof panelDimensions) => {
      console.log("[v0] Panel dimensions changed:", JSON.stringify(newDimensions))

      if (user && subscription?.plan_type === "free") {
        const maxSize = getMaxPanelSize("free")
        if (newDimensions.length > maxSize || newDimensions.width > maxSize) {
          toast.error(`免费用户面板尺寸限制为${maxSize}×${maxSize}mm，请升级订阅以使用更大尺寸`)
          return
        }
      }

      setPanelDimensions(newDimensions)
    },
    [user, subscription, getMaxPanelSize],
  )

  const handleImageDimensionsDetected = useCallback((dimensions: { length: number; width: number }) => {
    console.log("[v0] Auto-adjusting canvas size to:", dimensions)
    setPanelDimensions((prev) => ({
      ...prev,
      length: dimensions.length,
      width: dimensions.width,
    }))
  }, [])

  const handleHoleDiametersChange = useCallback((diameters: number[]) => {
    console.log("[v0] Hole diameters changed:", diameters)
    setHoleDiameters(diameters)
  }, [])

  const handleHoleSpacingChange = useCallback(
    (spacing: number) => {
      console.log("[v0] Hole spacing changed:", spacing)
      setHoleSpacing(spacing)

      if (punchHoles.length === 0 || !originalImageUrl) {
        setPunchHoles([])
        console.log("[v0] Cleared punch holes to trigger regeneration with new spacing")
      }
    },
    [punchHoles.length, originalImageUrl],
  )

  const handleConversionModeChange = useCallback((mode: string) => {
    console.log("[v0] Conversion mode changed:", mode)
    setConversionMode(mode)
  }, [])

  const handleAluminumColorChange = useCallback((color: string) => {
    console.log("[v0] Aluminum color changed:", color)
    setAluminumColor(color)
  }, [])

  const handleHoleColorChange = useCallback((color: string) => {
    console.log("[v0] Hole color changed:", color)
    setHoleColor(color)
  }, [])

  const handleGridDivisionChange = useCallback(
    (newGridDivision: {
      horizontal: number
      vertical: number
      enabled: boolean
      horizontalSpacings: number[]
      verticalSpacings: number[]
    }) => {
      console.log("[v0] Grid division changed:", newGridDivision)
      setGridDivision(newGridDivision)
    },
    [],
  )

  const handleEdgeMarginChange = useCallback((margin: number) => {
    console.log("[v0] Edge margin changed:", margin)
    setEdgeMargin(margin)
  }, [])

  const handleHoleShapeChange = useCallback((shape: "circle" | "square" | "hexagon" | "triangle") => {
    console.log("[v0] Hole shape changed:", shape)
    setHoleShape(shape)
  }, [])

  const scaledDimensions = useMemo(
    () => ({
      length: Math.round(panelDimensions.length / 2.5),
      width: Math.round(panelDimensions.width / 2.5),
      thickness: panelDimensions.thickness,
    }),
    [panelDimensions.length, panelDimensions.width, panelDimensions.thickness],
  )

  const displaySubscription = subscription || {
    plan_type: "guest",
    monthly_generations_used: 0,
    monthly_generations_limit: getFreeUserLimit(),
    expires_at: null,
  }

  const usageCount = displaySubscription.monthly_generations_used ?? 0
  const usageLimit = displaySubscription.monthly_generations_limit ?? getFreeUserLimit()

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {!user && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
          <div className="container mx-auto px-4 py-6">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">专业铝单板冲孔设计工具</h1>
              <p className="text-lg text-gray-600 mb-4">智能图像转换 • 精确孔位计算 • 专业图纸导出</p>
              <p className="text-sm text-gray-500">💡 提示：您可以调整参数、查看效果，上传图片时需要登录</p>
            </div>
          </div>
        </div>
      )}

      {user && subscription && usageCount >= usageLimit * 0.8 && (
        <div className="bg-orange-50 border-l-4 border-orange-400 p-4 mb-4">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-orange-400 mr-2" />
            <div>
              <p className="text-sm text-orange-700">
                {usageCount >= usageLimit
                  ? `使用次数已用完：${usageCount}/${usageLimit}`
                  : `使用次数即将用完：${usageCount}/${usageLimit}`}
                <Button variant="link" className="ml-2 p-0 h-auto text-orange-700 underline">
                  立即升级
                </Button>
              </p>
            </div>
          </div>
        </div>
      )}

      <main className="container mx-auto px-4 py-6">
        {isDemoLoaded && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <Info className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>✓ 演示图片已加载</strong>
              <p className="mt-1 text-sm">
                您现在可以：
                <span className="ml-2">✓ 调整参数（孔径、间距、形状等）</span>
                <span className="ml-2">✓ 查看实时预览效果</span>
                <span className="ml-2">✓ 生成冲孔图案</span>
                {!user && <span className="ml-2 text-blue-600 font-medium">• 登录后可上传自己的图片</span>}
              </p>
            </AlertDescription>
          </Alert>
        )}

        {!user && !isDemoLoaded && (
          <Alert className="mb-6 border-blue-200 bg-blue-50">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>欢迎体验铝单板冲孔设计工具</strong>
              <p className="mt-1 text-sm">
                您可以先使用演示图片体验所有功能，包括参数调整、实时预览等。
                <span className="font-medium text-blue-600 ml-1">上传自己的图片时需要登录。</span>
              </p>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <ImageUploadSection
              onImageProcessed={handleImageProcessed}
              onImageDimensionsDetected={handleImageDimensionsDetected}
              panelDimensions={panelDimensions}
              holeDiameters={holeDiameters}
              holeSpacing={holeSpacing}
              conversionMode={conversionMode}
              edgeMargin={edgeMargin}
              user={user}
            />
            <ParameterPanel
              onParameterChange={handleParameterChange}
              dimensions={panelDimensions}
              onHoleDiametersChange={handleHoleDiametersChange}
              onHoleSpacingChange={handleHoleSpacingChange}
              onConversionModeChange={handleConversionModeChange}
              onAluminumColorChange={handleAluminumColorChange}
              onHoleColorChange={handleHoleColorChange}
              onGridDivisionChange={handleGridDivisionChange}
              onHoleShapeChange={handleHoleShapeChange}
              onEdgeMarginChange={handleEdgeMarginChange}
              edgeMargin={edgeMargin}
              aluminumColor={aluminumColor}
              holeColor={holeColor}
            />
          </div>

          <div className="lg:col-span-2 flex flex-col space-y-4">
            {punchHoles.length > 0 && generatedPatternData && (
              <Card className="border-green-200 bg-green-50 flex-shrink-0">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-green-800">✓ 生成完成</CardTitle>
                  <CardDescription className="text-green-700">
                    成功生成 {punchHoles.length} 个冲孔点，画布尺寸：{panelDimensions.length}×{panelDimensions.width}mm
                    {edgeMargin > 0 && <span className="ml-2">| 边缘留白：{edgeMargin}mm</span>}
                    {gridDivision.enabled && (
                      <span className="ml-2">
                        | 分格：{gridDivision.horizontal}×{gridDivision.vertical}
                      </span>
                    )}
                    {!user && <span className="block mt-1 text-sm font-medium">💡 登录后可导出DXF文件和分享作品</span>}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-wrap gap-2">
                    <ExportDialog
                      punchHoles={punchHoles}
                      panelDimensions={panelDimensions}
                      stats={{
                        totalHoles: punchHoles.length,
                        smallHoles: punchHoles.filter((h) => h.diameter < 3).length,
                        mediumHoles: punchHoles.filter((h) => h.diameter >= 3 && h.diameter < 5).length,
                        largeHoles: punchHoles.filter((h) => h.diameter >= 5).length,
                        materialUsage:
                          Math.round(
                            ((panelDimensions.length * panelDimensions.width -
                              punchHoles.reduce((sum, hole) => sum + Math.PI * (hole.diameter / 2) ** 2, 0)) /
                              (panelDimensions.length * panelDimensions.width)) *
                              1000,
                          ) / 10,
                      }}
                      gridDivision={gridDivision}
                      previewCanvasRef={previewCanvasRef}
                    />
                    <ShareDialog
                      patternData={{
                        imageUrl: "",
                        originalImageUrl: originalImageUrl,
                        panelWidth: generatedPatternData.panelWidth,
                        panelHeight: generatedPatternData.panelHeight,
                        holeDiameter: generatedPatternData.holeDiameter,
                        holeSpacing: generatedPatternData.holeSpacing,
                        conversionMode: generatedPatternData.conversionMode,
                        parameters: generatedPatternData.parameters,
                      }}
                      previewCanvasRef={previewCanvasRef}
                      trigger={
                        <Button variant="outline" size="sm">
                          <Share2 className="h-4 w-4 mr-2" />
                          分享作品
                        </Button>
                      }
                    />
                    {gridDivision.enabled && (
                      <Button
                        variant={isCanvasLocked ? "default" : "outline"}
                        size="sm"
                        onClick={() => setIsCanvasLocked(!isCanvasLocked)}
                      >
                        <Lock className="h-4 w-4 mr-2" />
                        {isCanvasLocked ? "解锁画布" : "锁定画布"}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex-1 min-h-0">
              <PreviewCanvas
                ref={previewCanvasRef}
                punchHoles={punchHoles}
                panelDimensions={panelDimensions}
                backgroundImage={backgroundImage}
                aluminumColor={aluminumColor}
                holeColor={holeColor}
                holeSpacing={holeSpacing}
                gridDivision={gridDivision}
                holeShape={holeShape}
                edgeMargin={edgeMargin}
                isCanvasLocked={isCanvasLocked}
              />
            </div>
          </div>
        </div>
      </main>

      <FeaturedPatterns />
    </div>
  )
}
