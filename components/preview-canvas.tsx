"use client"

import { useState, useMemo, forwardRef, useImperativeHandle, useEffect } from "react"
import { Eye, ZoomIn, ZoomOut, RotateCcw, Grid, BarChart3, RefreshCw, Lock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { PunchHoleCanvas } from "./punch-hole-canvas"
import { ExportDialog } from "./export-dialog"
import { usePunchData, type PunchHole, type GridDivisionConfig } from "@/hooks/use-punch-data"

interface PreviewCanvasProps {
  punchHoles?: PunchHole[]
  panelDimensions: {
    length: number
    width: number
    thickness: number
  }
  backgroundImage?: HTMLImageElement | null
  aluminumColor?: string
  holeColor?: string
  holeSpacing?: number
  gridDivision?: GridDivisionConfig
  holeShape?: "circle" | "square" | "hexagon" | "triangle" // 添加holeShape参数
  edgeMargin?: number
  isCanvasLocked?: boolean
}

export interface PreviewCanvasRef {
  getFilteredHoles: () => PunchHole[]
  getGridDivision: () => GridDivisionConfig
  generatePreviewImage: () => Promise<string>
  getMainCanvas: () => HTMLCanvasElement | null
  getGridDivisionLines: () => { verticalLines: number[]; horizontalLines: number[] }
}

export const PreviewCanvas = forwardRef<PreviewCanvasRef, PreviewCanvasProps>(
  (
    {
      punchHoles: externalPunchHoles,
      panelDimensions,
      backgroundImage,
      aluminumColor = "#f3f4f6",
      holeColor = "#374151",
      holeSpacing = 5,
      gridDivision = { horizontal: 2, vertical: 2, enabled: false, spacing: 10 },
      holeShape = "circle", // 添加holeShape默认值
      edgeMargin = 0,
      isCanvasLocked = false,
    },
    ref,
  ) => {
    const [zoom, setZoom] = useState(100)
    const [showGrid, setShowGrid] = useState(true)
    const [mainCanvasRef, setMainCanvasRef] = useState<HTMLCanvasElement | null>(null)

    const {
      holes,
      setHoles,
      panelWidth,
      setPanelWidth,
      panelHeight,
      setPanelHeight,
      gridDivision: currentGridDivision,
      setGridDivision,
      getPunchData,
      getExportCoordinates,
      filteredHoles,
      gridLines,
      margin,
    } = usePunchData(edgeMargin)

    useEffect(() => {
      setPanelWidth(panelDimensions.length)
      setPanelHeight(panelDimensions.width)
      console.log("[v0] Preview Canvas - Panel dimensions updated:", {
        length: panelDimensions.length,
        width: panelDimensions.width,
      })
    }, [panelDimensions, setPanelWidth, setPanelHeight])

    useEffect(() => {
      setGridDivision(gridDivision)
      console.log("[v0] Preview Canvas - Grid division updated:", gridDivision)
    }, [gridDivision, setGridDivision])

    useEffect(() => {
      if (externalPunchHoles && externalPunchHoles.length > 0) {
        setHoles(externalPunchHoles)
        console.log("[v0] Preview Canvas - External holes set:", externalPunchHoles.length)
      } else {
        if (panelDimensions.length > 0 && panelDimensions.width > 0 && holeSpacing > 0) {
          const defaultHoles: PunchHole[] = []

          console.log(`[v0] Preview Canvas - Generating holes with spacing: ${holeSpacing}mm`)

          // 使用实际的孔距参数生成孔洞
          for (let x = holeSpacing; x < panelDimensions.length - holeSpacing; x += holeSpacing) {
            for (let y = holeSpacing; y < panelDimensions.width - holeSpacing; y += holeSpacing) {
              // 应用边距限制
              if (
                x < edgeMargin ||
                x > panelDimensions.length - edgeMargin ||
                y < edgeMargin ||
                y > panelDimensions.width - edgeMargin
              ) {
                continue
              }

              const centerX = panelDimensions.length / 2
              const centerY = panelDimensions.width / 2
              const distanceFromCenter = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2)
              const maxDistance = Math.sqrt(centerX ** 2 + centerY ** 2)
              const intensity = 1 - distanceFromCenter / maxDistance

              if (intensity > 0.2) {
                defaultHoles.push({
                  x: x,
                  y: y,
                  diameter: 2 + intensity * 4,
                })
              }
            }
          }
          setHoles(defaultHoles)
          console.log(
            `[v0] Preview Canvas - Default holes generated with ${holeSpacing}mm spacing:`,
            defaultHoles.length,
          )
        }
      }
    }, [externalPunchHoles, panelDimensions, setHoles, edgeMargin, holeSpacing]) // 添加holeSpacing到依赖数组

    const zoomIn = () => setZoom((prev) => Math.min(prev + 25, 400))
    const zoomOut = () => setZoom((prev) => Math.max(prev - 25, 1))
    const resetZoom = () => setZoom(100)

    const centerPattern = () => {
      if (mainCanvasRef && (mainCanvasRef as any).centerAndFit) {
        ;(mainCanvasRef as any).centerAndFit()
      }
    }

    const calculatedGridLines = useMemo(() => {
      const verticalLines = gridLines.filter((line) => line.type === "vertical").map((line) => line.position)
      const horizontalLines = gridLines.filter((line) => line.type === "horizontal").map((line) => line.position)

      console.log("[v0] Preview Canvas - Grid lines:", {
        verticalLines,
        horizontalLines,
        totalGridLines: gridLines.length,
        filteredHoles: filteredHoles.length,
        originalHoles: holes.length,
      })
      return { verticalLines, horizontalLines }
    }, [gridLines, filteredHoles.length, holes.length])

    useImperativeHandle(
      ref,
      () => ({
        getFilteredHoles: () => {
          console.log(
            `[v0] Export - Using unified data system: ${filteredHoles.length} holes, ${gridLines.length} grid lines`,
          )
          return filteredHoles
        },
        getGridDivision: () => currentGridDivision,
        generatePreviewImage,
        getMainCanvas: () => mainCanvasRef,
        getGridDivisionLines: () => calculatedGridLines,
      }),
      [filteredHoles, currentGridDivision, mainCanvasRef, calculatedGridLines, gridLines.length],
    )

    const generatePreviewImage = (): Promise<string> => {
      return new Promise((resolve, reject) => {
        if (!mainCanvasRef) {
          console.log("[v0] No main canvas ref available for preview generation")
          reject(new Error("No main canvas ref available"))
          return
        }

        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")
        if (!ctx) {
          reject(new Error("Cannot get canvas context"))
          return
        }

        const aspectRatio = mainCanvasRef.height / mainCanvasRef.width
        canvas.width = 400
        canvas.height = Math.round(400 * aspectRatio)

        ctx.drawImage(mainCanvasRef, 0, 0, canvas.width, canvas.height)

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob)
              resolve(url)
            } else {
              reject(new Error("Failed to generate blob"))
            }
          },
          "image/png",
          0.8,
        )
      })
    }

    const stats = useMemo(() => {
      const totalHoles = filteredHoles.length
      const smallHoles = filteredHoles.filter((h) => h.diameter < 3).length
      const mediumHoles = filteredHoles.filter((h) => h.diameter >= 3 && h.diameter < 5).length
      const largeHoles = filteredHoles.filter((h) => h.diameter >= 5).length

      const totalArea = panelWidth * panelHeight
      const holeArea = filteredHoles.reduce((sum, hole) => sum + Math.PI * (hole.diameter / 2) ** 2, 0)
      const materialUsage = ((totalArea - holeArea) / totalArea) * 100

      return {
        totalHoles,
        smallHoles,
        mediumHoles,
        largeHoles,
        materialUsage: Math.round(materialUsage * 10) / 10,
        originalHoles: holes.length,
      }
    }, [filteredHoles, panelWidth, panelHeight, holes.length])

    const displayDimensions = useMemo(() => {
      const displayWidth = panelWidth
      const displayHeight = panelHeight
      console.log(
        `[v0] Display dimensions: panel ${panelWidth}x${panelHeight}mm -> display ${displayWidth}x${displayHeight}px (1:1)`,
      )

      return {
        width: displayWidth,
        height: displayHeight,
        scale: 1, // Always 1:1 scale
      }
    }, [panelWidth, panelHeight])

    return (
      <Card className="h-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Eye className="w-5 h-5" />
              <span>预览与调整</span>
              <Badge variant="outline" className="ml-2">
                {panelWidth}×{panelHeight}mm
              </Badge>
              {edgeMargin > 0 && (
                <Badge variant="outline" className="ml-2 bg-orange-50 text-orange-700 border-orange-200">
                  边缘留白: {edgeMargin}mm
                </Badge>
              )}
              {gridLines.length > 0 && (
                <Badge variant="outline" className="ml-2 bg-blue-50 text-blue-700 border-blue-200">
                  分格线: {gridLines.length} 条 (留白: {edgeMargin > 0 ? edgeMargin : currentGridDivision.spacing || 5}
                  mm)
                </Badge>
              )}
              {isCanvasLocked && (
                <Badge variant="default" className="ml-2">
                  <Lock className="w-3 h-3 mr-1" />
                  已锁定
                </Badge>
              )}
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={zoomOut} disabled={isCanvasLocked}>
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-sm font-mono min-w-[60px] text-center">{zoom}%</span>
              <Button variant="outline" size="sm" onClick={zoomIn} disabled={isCanvasLocked}>
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={resetZoom} disabled={isCanvasLocked}>
                <RotateCcw className="w-4 h-4" />
              </Button>
              <Button variant={showGrid ? "default" : "outline"} size="sm" onClick={() => setShowGrid(!showGrid)}>
                <Grid className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={centerPattern} disabled={isCanvasLocked}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col">
          <Tabs defaultValue="preview" className="w-full flex-1">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="preview">预览</TabsTrigger>
              <TabsTrigger value="compare">对比</TabsTrigger>
              <TabsTrigger value="stats">统计</TabsTrigger>
            </TabsList>

            <TabsContent value="preview" className="space-y-4 flex-1">
              <div className="relative border rounded-lg bg-gray-50 overflow-auto flex-1">
                <PunchHoleCanvas
                  width={displayDimensions.width}
                  height={displayDimensions.height}
                  holes={filteredHoles}
                  zoom={zoom}
                  setZoom={setZoom}
                  showGrid={showGrid}
                  panelDimensions={panelDimensions}
                  backgroundImage={backgroundImage}
                  aluminumColor={aluminumColor}
                  holeColor={holeColor}
                  holeSpacing={holeSpacing}
                  holeShape={holeShape} // 传递holeShape参数
                  gridDivision={currentGridDivision}
                  calculatedGridLines={calculatedGridLines}
                  edgeMargin={edgeMargin}
                  isCanvasLocked={isCanvasLocked}
                  setMainCanvasRef={setMainCanvasRef}
                />
              </div>

              <div className="flex justify-center space-x-2">
                <ExportDialog
                  punchHoles={filteredHoles}
                  panelDimensions={panelDimensions}
                  stats={stats}
                  gridDivision={currentGridDivision}
                  previewCanvasRef={{
                    current: {
                      getFilteredHoles: () => {
                        console.log(`[v0] Export - Returning ${filteredHoles.length} filtered holes (unified data)`)
                        return filteredHoles
                      },
                      getGridDivision: () => currentGridDivision,
                      generatePreviewImage,
                      getGridDivisionLines: () => calculatedGridLines,
                      getMainCanvas: () => mainCanvasRef,
                    },
                  }}
                  getPunchData={getPunchData}
                  getExportCoordinates={getExportCoordinates}
                />
              </div>
            </TabsContent>

            <TabsContent value="compare" className="space-y-4 flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="border rounded-lg p-4 text-center">
                  <h4 className="font-medium mb-2">原始图片</h4>
                  <div className="bg-gray-100 h-48 rounded flex items-center justify-center">
                    {backgroundImage ? (
                      <img
                        src={backgroundImage.src || "/placeholder.svg"}
                        alt="原始图片"
                        className="max-w-full max-h-full object-contain"
                      />
                    ) : (
                      <span className="text-muted-foreground">未上传图片</span>
                    )}
                  </div>
                </div>
                <div className="border rounded-lg p-4 text-center">
                  <h4 className="font-medium mb-2">冲孔效果</h4>
                  <div className="bg-gray-100 h-48 rounded flex items-center justify-center">
                    <PunchHoleCanvas
                      width={Math.min(300, displayDimensions.width * 0.5)}
                      height={Math.min(192, displayDimensions.height * 0.5)}
                      holes={filteredHoles}
                      zoom={50}
                      setZoom={setZoom}
                      showGrid={false}
                      panelDimensions={panelDimensions}
                      backgroundImage={backgroundImage}
                      aluminumColor={aluminumColor}
                      holeColor={holeColor}
                      holeSpacing={holeSpacing}
                      holeShape={holeShape} // 传递holeShape参数
                      gridDivision={currentGridDivision}
                      calculatedGridLines={calculatedGridLines}
                      edgeMargin={edgeMargin}
                      isCanvasLocked={true}
                      setMainCanvasRef={setMainCanvasRef}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="stats" className="space-y-4 flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">总孔数</span>
                    <Badge variant="secondary">{stats.totalHoles}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">小孔 (φ1-3mm)</span>
                    <span className="text-sm text-muted-foreground">{stats.smallHoles}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">中孔 (φ3-5mm)</span>
                    <span className="text-sm text-muted-foreground">{stats.mediumHoles}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">大孔 (φ5mm+)</span>
                    <span className="text-sm text-muted-foreground">{stats.largeHoles}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">板材利用率</span>
                    <Badge variant="outline">{stats.materialUsage}%</Badge>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-accent h-2 rounded-full transition-all duration-300"
                      style={{ width: `${stats.materialUsage}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">基于当前参数的预估值</p>
                </div>
              </div>

              {edgeMargin > 0 && (
                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-3 text-orange-700">边缘留白信息</h4>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                      <div className="text-lg font-bold text-orange-700">{edgeMargin}mm</div>
                      <div className="text-xs text-orange-600">四边留白距离</div>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                      <div className="text-lg font-bold text-orange-700">
                        {Math.round(
                          ((edgeMargin * 2 * (panelWidth + panelHeight)) / (panelWidth * panelHeight)) * 10000,
                        ) / 100}
                        %
                      </div>
                      <div className="text-xs text-orange-600">留白区域占比</div>
                    </div>
                  </div>
                  <p className="text-xs text-orange-600">
                    有效冲孔区域: {panelWidth - edgeMargin * 2}mm × {panelHeight - edgeMargin * 2}mm
                  </p>
                </div>
              )}

              {gridLines.length > 0 && (
                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-3 text-blue-700">分格信息</h4>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="text-lg font-bold text-blue-700">
                        {calculatedGridLines.verticalLines.length + calculatedGridLines.horizontalLines.length}
                      </div>
                      <div className="text-xs text-blue-600">分格线总数</div>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="text-lg font-bold text-blue-700">{stats.originalHoles - stats.totalHoles}</div>
                      <div className="text-xs text-blue-600">避让孔数</div>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="text-lg font-bold text-blue-700">
                        {edgeMargin > 0 ? edgeMargin : currentGridDivision.spacing || 5}mm
                      </div>
                      <div className="text-xs text-blue-600">避让间距 {edgeMargin > 0 && "(与四边留白一致)"}</div>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="text-lg font-bold text-blue-700">
                        {calculatedGridLines.verticalLines.length}V + {calculatedGridLines.horizontalLines.length}H
                      </div>
                      <div className="text-xs text-blue-600">分格线分布</div>
                    </div>
                  </div>
                  <div className="text-xs text-blue-600 space-y-1">
                    {calculatedGridLines.verticalLines.length > 0 && (
                      <p>垂直线位置: {calculatedGridLines.verticalLines.map((pos) => `${pos}mm`).join(", ")}</p>
                    )}
                    {calculatedGridLines.horizontalLines.length > 0 && (
                      <p>水平线位置: {calculatedGridLines.horizontalLines.map((pos) => `${pos}mm`).join(", ")}</p>
                    )}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <div className="text-lg font-bold text-foreground">{stats.totalHoles}</div>
                    <div className="text-xs text-muted-foreground">冲孔总数</div>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <div className="text-lg font-bold text-foreground">
                      {Math.round((stats.totalHoles / (panelWidth * panelHeight)) * 10000) / 100}
                    </div>
                    <div className="text-xs text-muted-foreground">孔密度/cm²</div>
                  </div>
                </div>

                <Button variant="outline" className="w-full bg-transparent">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  查看详细报告
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    )
  },
)

PreviewCanvas.displayName = "PreviewCanvas"
