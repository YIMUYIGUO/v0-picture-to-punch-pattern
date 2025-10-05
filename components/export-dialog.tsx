"use client"

import type React from "react"
import { SimpleSubscriptionDialog } from "./simple-subscription-dialog"
import { useSubscription } from "@/hooks/use-subscription"
import { useSystemSettings } from "@/hooks/use-system-settings"

import { useState } from "react"
import { Download, FileText, Crown, Lock } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { PreviewCanvasRef } from "./preview-canvas"
import type { PunchDataState, PunchHole, GridDivisionConfig } from "@/hooks/use-punch-data"
import { toast } from "sonner"

interface ExportDialogProps {
  punchHoles: PunchHole[]
  panelDimensions: { length: number; width: number; thickness: number }
  stats: {
    totalHoles: number
    smallHoles: number
    mediumHoles: number
    largeHoles: number
    materialUsage: number
  }
  gridDivision?: GridDivisionConfig
  previewCanvasRef?: React.RefObject<PreviewCanvasRef>
  getPunchData?: () => PunchDataState
  getExportCoordinates?: (x: number, y: number) => { x: number; y: number }
}

export function ExportDialog({
  punchHoles,
  panelDimensions,
  stats,
  gridDivision,
  previewCanvasRef,
  getPunchData,
  getExportCoordinates,
}: ExportDialogProps) {
  const [exportFormat, setExportFormat] = useState("dxf")
  const [includeStats, setIncludeStats] = useState(true)
  const [fileName, setFileName] = useState("aluminum_panel_punch")
  const [gCodeSettings, setGCodeSettings] = useState({
    feedRate: "1000",
    spindleSpeed: "12000",
    plungeRate: "300",
  })

  const [imageSettings, setImageSettings] = useState({
    format: "png",
    quality: 0.9,
    scale: 2,
    backgroundColor: "#ffffff",
  })

  const [showSubscriptionDialog, setShowSubscriptionDialog] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const {
    subscription,
    canDownload,
    getRemainingDownloads,
    incrementUsage,
    isLoading: subscriptionLoading,
  } = useSubscription()
  const { getFreeUserLimit } = useSystemSettings()

  const getUnifiedData = (): PunchDataState => {
    if (getPunchData) {
      const data = getPunchData()
      console.log(
        `[v0] Export - Using unified data system: ${data.holes.length} holes, ${data.gridLines.length} grid lines`,
      )
      return data
    }

    // Fallback to legacy data if unified system not available
    console.log(`[v0] Export - Using legacy data as fallback: ${punchHoles.length} holes`)
    return {
      holes: punchHoles,
      gridLines: [],
      panelWidth: panelDimensions.length,
      panelHeight: panelDimensions.width,
      margin: 20,
    }
  }

  const generateDXF = () => {
    const data = getUnifiedData()
    let dxfContent = `0\nSECTION\n2\nENTITIES\n`

    console.log(`[v0] DXF Export - Panel dimensions: ${data.panelWidth}mm x ${data.panelHeight}mm (unified data)`)

    dxfContent += `0\nLWPOLYLINE\n8\nPANEL_OUTLINE\n90\n4\n70\n1\n10\n0.0\n20\n0.0\n10\n${data.panelWidth.toFixed(3)}\n20\n0.0\n10\n${data.panelWidth.toFixed(3)}\n20\n${data.panelHeight.toFixed(3)}\n10\n0.0\n20\n${data.panelHeight.toFixed(3)}\n`

    if (data.gridLines.length > 0) {
      console.log(`[v0] DXF Export - Adding ${data.gridLines.length} grid lines from unified data`)

      data.gridLines.forEach((line, index) => {
        if (line.type === "vertical") {
          const lineX = line.position
          console.log(`[v0] DXF Export - Vertical line ${index}: position ${line.position}mm -> export ${lineX}mm`)
          if (lineX > data.margin && lineX < data.panelWidth - data.margin) {
            dxfContent += `0\nLINE\n8\nGRID_DIVISION\n10\n${lineX.toFixed(3)}\n20\n0.0\n30\n0.0\n11\n${lineX.toFixed(3)}\n21\n${data.panelHeight.toFixed(3)}\n31\n0.0\n`
          }
        } else {
          const lineY = data.panelHeight - line.position // Y-axis flip for correct CAD orientation
          console.log(
            `[v0] DXF Export - Horizontal line ${index}: position ${line.position}mm -> export ${lineY}mm (Y-flipped)`,
          )
          if (line.position > data.margin && line.position < data.panelHeight - data.margin) {
            dxfContent += `0\nLINE\n8\nGRID_DIVISION\n10\n0.0\n20\n${lineY.toFixed(3)}\n30\n0.0\n11\n${data.panelWidth.toFixed(3)}\n21\n${lineY.toFixed(3)}\n31\n0.0\n`
          }
        }
      })
    }

    console.log(`[v0] DXF Export - Processing ${data.holes.length} holes with unified coordinate system`)

    data.holes.forEach((hole, index) => {
      const holeX = hole.x
      const holeY = hole.y
      const yCoord = data.panelHeight - holeY // Y-axis flip for correct CAD orientation
      const shape = (hole as any).shape || "circle"

      if (index < 5) {
        console.log(
          `[v0] DXF Export - Hole ${index + 1}: (${hole.x}mm, ${hole.y}mm) -> export (${holeX}mm, ${yCoord}mm), diameter ${hole.diameter}mm, shape ${shape}`,
        )
      }

      switch (shape) {
        case "circle":
          dxfContent += `0\nCIRCLE\n8\nPUNCH_HOLES\n10\n${holeX.toFixed(3)}\n20\n${yCoord.toFixed(3)}\n30\n0.0\n40\n${(hole.diameter / 2).toFixed(3)}\n`
          break
        case "square":
          const halfSize = hole.diameter / 2
          dxfContent += `0\nLWPOLYLINE\n8\nPUNCH_HOLES\n90\n4\n70\n1\n10\n${(holeX - halfSize).toFixed(3)}\n20\n${(yCoord - halfSize).toFixed(3)}\n10\n${(holeX + halfSize).toFixed(3)}\n20\n${(yCoord - halfSize).toFixed(3)}\n10\n${(holeX + halfSize).toFixed(3)}\n20\n${(yCoord + halfSize).toFixed(3)}\n10\n${(holeX - halfSize).toFixed(3)}\n20\n${(yCoord + halfSize).toFixed(3)}\n`
          break
        case "hexagon":
          const radius = hole.diameter / 2
          dxfContent += `0\nLWPOLYLINE\n8\nPUNCH_HOLES\n90\n6\n70\n1\n`
          for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3
            const x = holeX + radius * Math.cos(angle)
            const y = yCoord + radius * Math.sin(angle)
            dxfContent += `10\n${x.toFixed(3)}\n20\n${y.toFixed(3)}\n`
          }
          break
        case "triangle":
          const triRadius = hole.diameter / 2
          const height = triRadius * Math.sqrt(3)
          dxfContent += `0\nLWPOLYLINE\n8\nPUNCH_HOLES\n90\n3\n70\n1\n10\n${holeX.toFixed(3)}\n20\n${(yCoord - (height * 2) / 3).toFixed(3)}\n10\n${(holeX - triRadius).toFixed(3)}\n20\n${(yCoord + (height * 1) / 3).toFixed(3)}\n10\n${(holeX + triRadius).toFixed(3)}\n20\n${(yCoord + (height * 1) / 3).toFixed(3)}\n`
          break
        default:
          // Fallback to circle
          dxfContent += `0\nCIRCLE\n8\nPUNCH_HOLES\n10\n${holeX.toFixed(3)}\n20\n${yCoord.toFixed(3)}\n30\n0.0\n40\n${(hole.diameter / 2).toFixed(3)}\n`
          break
      }
    })

    dxfContent += `0\nENDSEC\n0\nEOF`
    return dxfContent
  }

  const generateGCode = () => {
    const data = getUnifiedData()

    console.log(`[v0] G-Code Export - Panel dimensions: ${data.panelWidth}mm x ${data.panelHeight}mm (unified data)`)
    console.log(`[v0] G-Code Export - Processing ${data.holes.length} holes with unified coordinate system`)

    let gCode = `; Aluminum Panel Punch Hole G-Code\n; Generated by Aluminum Panel Punch System\n; Panel: ${data.panelWidth}mm x ${data.panelHeight}mm x ${panelDimensions.thickness}mm\n; Total Holes: ${data.holes.length}\n; IMPORTANT: All coordinates are in millimeters using unified data system\n`

    if (data.gridLines.length > 0) {
      gCode += `; === GRID DIVISION CUTTING ===\n`

      data.gridLines.forEach((line, index) => {
        if (line.type === "vertical") {
          const lineX = line.position
          if (lineX > data.margin && lineX < data.panelWidth - data.margin) {
            gCode += `; Vertical cut ${index + 1} at X=${lineX}mm\nG0 X${lineX.toFixed(3)} Y0 ; Position at start\nG1 Z-${panelDimensions.thickness.toFixed(3)} F${gCodeSettings.plungeRate} ; Plunge\nG1 Y${data.panelHeight.toFixed(3)} F${gCodeSettings.feedRate} ; Cut through\nG1 Z5 F${gCodeSettings.feedRate} ; Retract\n`
          }
        } else {
          const lineY = line.position
          if (lineY > data.margin && lineY < data.panelHeight - data.margin) {
            gCode += `; Horizontal cut ${index + 1} at Y=${lineY}mm\nG0 X0 Y${lineY.toFixed(3)} ; Position at start\nG1 Z-${panelDimensions.thickness.toFixed(3)} F${gCodeSettings.plungeRate} ; Plunge\nG1 X${data.panelWidth.toFixed(3)} F${gCodeSettings.feedRate} ; Cut through\nG1 Z5 F${gCodeSettings.feedRate} ; Retract\n`
          }
        }
      })

      gCode += `\n; === PUNCH HOLE OPERATIONS ===\n`
    }

    data.holes.forEach((hole, index) => {
      const holeX = hole.x
      const holeY = hole.y

      if (index < 5) {
        console.log(
          `[v0] G-Code Export - Hole ${index + 1}: (${hole.x}mm, ${hole.y}mm) -> export (${holeX}mm, ${holeY}mm), diameter ${hole.diameter}mm`,
        )
      }
      gCode += `; Hole ${index + 1} - Diameter: ${hole.diameter.toFixed(2)}mm\nG0 X${holeX.toFixed(3)} Y${holeY.toFixed(3)} ; Position over hole\nG1 Z-${panelDimensions.thickness.toFixed(3)} F${gCodeSettings.plungeRate} ; Plunge\nG1 Z5 F${gCodeSettings.feedRate} ; Retract\n`
    })

    gCode += `\nG0 Z10 ; Move to safe height\nM5 ; Stop spindle\nM30 ; Program end`
    return gCode
  }

  const generateReport = () => {
    const data = getUnifiedData()

    const report = {
      project: {
        name: fileName,
        date: new Date().toISOString().split("T")[0],
        panelDimensions: {
          length: data.panelWidth,
          width: data.panelHeight,
          thickness: panelDimensions.thickness,
        },
      },
      statistics: {
        totalHoles: data.holes.length,
        gridLines: data.gridLines.length,
        materialUsage: stats.materialUsage,
      },
      holes: data.holes.map((hole, index) => ({
        id: index + 1,
        x: Math.round(hole.x * 100) / 100,
        y: Math.round(hole.y * 100) / 100,
        diameter: Math.round(hole.diameter * 100) / 100,
      })),
      gridLines: data.gridLines.map((line, index) => ({
        id: index + 1,
        type: line.type,
        position: Math.round(line.position * 100) / 100,
      })),
      summary: {
        totalArea: data.panelWidth * data.panelHeight,
        punchedArea: data.holes.reduce((sum, hole) => sum + Math.PI * (hole.diameter / 2) ** 2, 0),
        holeDensity: (data.holes.length / (data.panelWidth * data.panelHeight)) * 10000,
      },
    }

    return JSON.stringify(report, null, 2)
  }

  const generateCSV = () => {
    const data = getUnifiedData()

    return `ID,X,Y,Diameter\n${data.holes
      .map((hole, index) => `${index + 1},${hole.x},${hole.y},${hole.diameter}`)
      .join("\n")}`
  }

  const exportImage = async () => {
    if (!previewCanvasRef?.current) {
      console.error("[v0] Image export failed: Preview canvas ref not available")
      return
    }

    try {
      console.log("[v0] Starting image export...")
      const canvas = previewCanvasRef.current.getMainCanvas()
      if (!canvas) {
        console.error("[v0] Image export failed: Canvas not available")
        return
      }

      // Create a new canvas with the desired scale
      const exportCanvas = document.createElement("canvas")
      const exportCtx = exportCanvas.getContext("2d")
      if (!exportCtx) {
        console.error("[v0] Image export failed: Could not get export canvas context")
        return
      }

      const scale = imageSettings.scale
      exportCanvas.width = canvas.width * scale
      exportCanvas.height = canvas.height * scale

      // Set background color
      exportCtx.fillStyle = imageSettings.backgroundColor
      exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height)

      // Scale and draw the original canvas
      exportCtx.scale(scale, scale)
      exportCtx.drawImage(canvas, 0, 0)

      // Convert to blob and download
      exportCanvas.toBlob(
        (blob) => {
          if (!blob) {
            console.error("[v0] Image export failed: Could not create blob")
            return
          }

          const url = URL.createObjectURL(blob)
          const a = document.createElement("a")
          a.href = url
          a.download = `${fileName}.${imageSettings.format}`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
          console.log(`[v0] Image exported successfully: ${fileName}.${imageSettings.format}`)
        },
        `image/${imageSettings.format}`,
        imageSettings.quality,
      )
    } catch (error) {
      console.error("[v0] Image export error:", error)
    }
  }

  const handleExport = async () => {
    // Check if user can download
    if (!canDownload()) {
      setShowSubscriptionDialog(true)
      return
    }

    setIsExporting(true)

    try {
      const success = await incrementUsage()
      if (!success) {
        toast.error("使用次数已达上限或更新失败")
        setIsExporting(false)
        return
      }

      if (exportFormat === "image") {
        await exportImage()
      } else {
        let content = ""
        let mimeType = "text/plain"
        let fileExtension = "txt"

        switch (exportFormat) {
          case "dxf":
            content = generateDXF()
            mimeType = "application/dxf"
            fileExtension = "dxf"
            break
          default:
            console.error(`[v0] Unsupported export format: ${exportFormat}`)
            return
        }

        const blob = new Blob([content], { type: mimeType })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${fileName}.${fileExtension}`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }

      toast.success("文件下载成功！")
    } catch (error) {
      console.error("[v0] Export error:", error)
      toast.error("导出失败，请重试")
    } finally {
      setIsExporting(false)
    }
  }

  const data = getUnifiedData()
  const remainingDownloads = getRemainingDownloads()

  return (
    <>
      <Dialog>
        <DialogTrigger asChild>
          <Button>
            <Download className="w-4 h-4 mr-2" />
            导出文件
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>导出冲孔数据</DialogTitle>
            <DialogDescription>选择导出格式和配置选项，生成用于加工设备的文件。</DialogDescription>
          </DialogHeader>

          {!subscriptionLoading && (
            <Alert className={canDownload() ? "border-green-200 bg-green-50" : "border-orange-200 bg-orange-50"}>
              <Crown className="h-4 w-4" />
              <AlertDescription>
                {canDownload() ? (
                  <span className="text-green-700">
                    剩余下载次数: <strong>{remainingDownloads}</strong> 次
                    {subscription && (
                      <span className="ml-2 text-xs">
                        (
                        {subscription.plan_type === "free"
                          ? "免费版"
                          : subscription.plan_type === "pro"
                            ? "专业版"
                            : "企业版"}
                        )
                      </span>
                    )}
                  </span>
                ) : (
                  <span className="text-orange-700">
                    <Lock className="w-4 h-4 inline mr-1" />
                    {subscription
                      ? "下载次数已用完，请升级订阅以继续使用"
                      : `请先登录以获得${getFreeUserLimit()}次免费下载`}
                  </span>
                )}
              </AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="format" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="format">格式</TabsTrigger>
              <TabsTrigger value="download">下载</TabsTrigger>
            </TabsList>

            <TabsContent value="format" className="space-y-4">
              <div>
                <Label className="text-sm font-medium">文件名</Label>
                <Input value={fileName} onChange={(e) => setFileName(e.target.value)} className="mt-2" />
              </div>

              <div>
                <Label className="text-sm font-medium">导出格式</Label>
                <Select value={exportFormat} onValueChange={setExportFormat}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="image">
                      <div className="flex items-center space-x-2">
                        <Download className="w-4 h-4" />
                        <span>图片 - PNG/JPG 格式</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="dxf">
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4" />
                        <span>DXF - CAD 矢量格式</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox id="stats" checked={includeStats} onCheckedChange={setIncludeStats} />
                <Label htmlFor="stats" className="text-sm">
                  包含统计信息
                </Label>
              </div>
            </TabsContent>

            <TabsContent value="download" className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">导出预览</h4>
                  <Badge variant="outline">{exportFormat.toUpperCase()}</Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">文件名:</span>
                    <span className="ml-2 font-mono">
                      {fileName}.
                      {exportFormat === "gcode" ? "nc" : exportFormat === "image" ? imageSettings.format : exportFormat}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">孔数:</span>
                    <span className="ml-2">{data.holes.length}</span>
                    <span className="ml-1 text-xs text-green-600">(统一数据)</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">铝板尺寸:</span>
                    <span className="ml-2">
                      {data.panelWidth}×{data.panelHeight}×{panelDimensions.thickness}mm
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">分格线:</span>
                    <span className="ml-2">{data.gridLines.length} 条</span>
                  </div>
                </div>
              </div>

              <Button onClick={handleExport} className="w-full" disabled={isExporting || subscriptionLoading}>
                {isExporting ? (
                  <>
                    <Download className="w-4 h-4 mr-2 animate-pulse" />
                    导出中...
                  </>
                ) : !canDownload() ? (
                  <>
                    <Lock className="w-4 h-4 mr-2" />
                    {subscription ? "升级订阅以下载" : `请先登录以获得${getFreeUserLimit()}次免费下载`}
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    下载 {exportFormat === "image" ? imageSettings.format.toUpperCase() : exportFormat.toUpperCase()}{" "}
                    文件
                  </>
                )}
              </Button>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <SimpleSubscriptionDialog
        open={showSubscriptionDialog}
        onOpenChange={setShowSubscriptionDialog}
        reason="download_limit"
      />
    </>
  )
}
