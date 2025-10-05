"use client"

import type React from "react"
import { toast } from "react-toastify"

import { useState, useCallback, useRef, useEffect, useMemo } from "react"
import { Upload, ImageIcon, RotateCw, Palette, Zap } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface ImageUploadSectionProps {
  onImageProcessed?: (punchHoles: Array<{ x: number; y: number; diameter: number; intensity: number }>) => void
  onImageDimensionsDetected?: (dimensions: { length: number; width: number }) => void
  panelDimensions?: { length: number; width: number; thickness: number }
  holeDiameters?: number[]
  holeSpacing?: number
  conversionMode?: string
  edgeMargin?: number
  user?: any
}

export function ImageUploadSection({
  onImageProcessed,
  onImageDimensionsDetected,
  panelDimensions = { length: 400, width: 240, thickness: 3 },
  holeDiameters = [3, 5, 8],
  holeSpacing = 5,
  conversionMode = "density",
  edgeMargin = 0,
  user,
}: ImageUploadSectionProps) {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [brightness, setBrightness] = useState([100])
  const [contrast, setContrast] = useState([100])
  const [rotation, setRotation] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showCropTool, setShowCropTool] = useState(false)
  const [croppedImageUrl, setCroppedImageUrl] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const processingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const PIXELS_TO_MM = 1 // Direct 1:1 conversion

  const scalingFactors = useMemo(() => {
    if (!imageRef.current) return { scaleX: 1, scaleY: 1 }
    const scaleX = panelDimensions.length / imageRef.current.naturalWidth
    const scaleY = panelDimensions.width / imageRef.current.naturalHeight
    return { scaleX, scaleY }
  }, [panelDimensions.length, panelDimensions.width, imageRef.current?.naturalWidth, imageRef.current?.naturalHeight])

  const processImageToPunchHoles = useCallback(async () => {
    if (!uploadedImage || !canvasRef.current || !imageRef.current) return

    console.log("[v0] Starting image processing with mode:", conversionMode)
    setIsProcessing(true)

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const img = imageRef.current

    const canvasWidthPixels = img.naturalWidth
    const canvasHeightPixels = img.naturalHeight

    canvas.width = canvasWidthPixels
    canvas.height = canvasHeightPixels

    const { scaleX, scaleY } = scalingFactors

    ctx.filter = `brightness(${brightness[0]}%) contrast(${contrast[0]}%)`
    ctx.save()
    ctx.translate(canvasWidthPixels / 2, canvasHeightPixels / 2)
    ctx.rotate((rotation * Math.PI) / 180)

    const drawWidth = img.naturalWidth
    const drawHeight = img.naturalHeight

    ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight)
    ctx.restore()

    const imageData = ctx.getImageData(0, 0, canvasWidthPixels, canvasHeightPixels)
    const data = imageData.data

    const punchHoles: Array<{ x: number; y: number; diameter: number; intensity: number }> = []

    const sampleStepPixelsX = holeSpacing / scaleX
    const sampleStepPixelsY = holeSpacing / scaleY
    const minHoleSize = Math.min(...holeDiameters)
    const maxHoleSize = Math.max(...holeDiameters)

    const edgeMarginPixelsX = edgeMargin / scaleX
    const edgeMarginPixelsY = edgeMargin / scaleY

    const processPixel = (x: number, y: number, pixelIndex: number) => {
      const r = data[pixelIndex]
      const g = data[pixelIndex + 1]
      const b = data[pixelIndex + 2]
      return (r * 0.299 + g * 0.587 + b * 0.114) / 255
    }

    if (conversionMode === "density") {
      for (let y = 0; y < canvasHeightPixels; y += sampleStepPixelsY) {
        for (let x = 0; x < canvasWidthPixels; x += sampleStepPixelsX) {
          const pixelX = Math.round(x)
          const pixelY = Math.round(y)

          if (
            pixelX < edgeMarginPixelsX ||
            pixelX > canvasWidthPixels - edgeMarginPixelsX ||
            pixelY < edgeMarginPixelsY ||
            pixelY > canvasHeightPixels - edgeMarginPixelsY
          ) {
            continue
          }

          const pixelIndex = (pixelY * canvasWidthPixels + pixelX) * 4
          const grayscale = processPixel(x, y, pixelIndex)
          const intensity = 1 - grayscale

          if (intensity > 0.1) {
            const diameterIndex = Math.floor(intensity * holeDiameters.length)
            const diameter = holeDiameters[Math.min(diameterIndex, holeDiameters.length - 1)]

            punchHoles.push({
              x: x * scaleX,
              y: y * scaleY,
              diameter: diameter,
              intensity: intensity,
            })
          }
        }
      }
    } else if (conversionMode === "contour") {
      for (let y = 0; y < canvasHeightPixels; y += sampleStepPixelsY) {
        for (let x = 0; x < canvasWidthPixels; x += sampleStepPixelsX) {
          const pixelX = Math.round(x)
          const pixelY = Math.round(y)

          if (
            pixelX < edgeMarginPixelsX ||
            pixelX > canvasWidthPixels - edgeMarginPixelsX ||
            pixelY < edgeMarginPixelsY ||
            pixelY > canvasHeightPixels - edgeMarginPixelsY
          ) {
            continue
          }

          const pixelIndex = (pixelY * canvasWidthPixels + pixelX) * 4
          const grayscale = processPixel(x, y, pixelIndex)

          const rightIndex = (pixelY * canvasWidthPixels + Math.min(pixelX + 1, canvasWidthPixels - 1)) * 4
          const bottomIndex = (Math.min(pixelY + 1, canvasHeightPixels - 1) * canvasWidthPixels + pixelX) * 4

          const rightGray = processPixel(x + 1, y, rightIndex)
          const bottomGray = processPixel(x, y + 1, bottomIndex)

          const edgeStrength = Math.abs(grayscale - rightGray) + Math.abs(grayscale - bottomGray)

          if (edgeStrength > 0.3) {
            punchHoles.push({
              x: x * scaleX,
              y: y * scaleY,
              diameter: holeDiameters[Math.floor(holeDiameters.length / 2)],
              intensity: edgeStrength,
            })
          }
        }
      }
    } else if (conversionMode === "pixel") {
      const pixelSizePixelsX = Math.max(sampleStepPixelsX * 2, 5)
      const pixelSizePixelsY = Math.max(sampleStepPixelsY * 2, 5)
      for (let y = 0; y < canvasHeightPixels; y += pixelSizePixelsY) {
        for (let x = 0; x < canvasWidthPixels; x += pixelSizePixelsX) {
          const pixelX = Math.round(x)
          const pixelY = Math.round(y)

          if (
            pixelX < edgeMarginPixelsX ||
            pixelX > canvasWidthPixels - edgeMarginPixelsX ||
            pixelY < edgeMarginPixelsY ||
            pixelY > canvasHeightPixels - edgeMarginPixelsY
          ) {
            continue
          }

          const pixelIndex = (pixelY * canvasWidthPixels + pixelX) * 4
          const grayscale = processPixel(x, y, pixelIndex)
          const intensity = 1 - grayscale

          if (intensity > 0.2) {
            punchHoles.push({
              x: x * scaleX,
              y: y * scaleY,
              diameter: intensity > 0.7 ? maxHoleSize : minHoleSize,
              intensity: intensity,
            })
          }
        }
      }
    }

    console.log(`Generated ${punchHoles.length} punch holes using ${conversionMode} mode`)
    onImageProcessed?.(punchHoles)
    setIsProcessing(false)
  }, [
    uploadedImage,
    brightness,
    contrast,
    rotation,
    onImageProcessed,
    holeDiameters,
    holeSpacing,
    conversionMode,
    panelDimensions,
    edgeMargin,
    scalingFactors,
  ])

  useEffect(() => {
    if (uploadedImage && imageRef.current?.complete) {
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current)
      }
      processingTimeoutRef.current = setTimeout(() => {
        processImageToPunchHoles()
      }, 300) // 300ms防抖
    }

    return () => {
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current)
      }
    }
  }, [
    uploadedImage,
    brightness,
    contrast,
    rotation,
    conversionMode,
    holeSpacing,
    holeDiameters,
    panelDimensions,
    edgeMargin,
    processImageToPunchHoles,
  ]) // 添加缺失的参数依赖

  const handleImageUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (!user) {
        toast.error("上传图片需要登录", {
          description: "您可以先使用演示图片体验功能，登录后可上传自己的图片",
          duration: 5000,
          action: {
            label: "立即登录",
            onClick: () => {
              window.location.href = "/auth/login"
            },
          },
        })
        // Clear the file input
        event.target.value = ""
        return
      }

      const file = event.target.files?.[0]
      if (file) {
        // 检查文件大小限制 (10MB)
        if (file.size > 10 * 1024 * 1024) {
          console.error("[v0] File too large:", file.size)
          toast.error("文件大小不能超过 10MB")
          return
        }

        console.log("[v0] Image file selected:", file.name)
        const reader = new FileReader()
        reader.onload = (e) => {
          const result = e.target?.result as string
          console.log("[v0] Image loaded successfully")
          // 清理之前的图片URL
          if (uploadedImage && uploadedImage.startsWith("blob:")) {
            URL.revokeObjectURL(uploadedImage)
          }
          setUploadedImage(result)
        }
        reader.onerror = (e) => {
          console.error("[v0] Error reading file:", e)
          toast.error("图片读取失败，请重试")
        }
        reader.readAsDataURL(file)
      }
    },
    [uploadedImage, user],
  )

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault()

      if (!user) {
        toast.error("上传图片需要登录", {
          description: "您可以先使用演示图片体验功能，登录后可上传自己的图片",
          duration: 5000,
          action: {
            label: "立即登录",
            onClick: () => {
              window.location.href = "/auth/login"
            },
          },
        })
        return
      }

      const file = event.dataTransfer.files[0]
      if (file && file.type.startsWith("image/")) {
        // 检查文件大小限制 (10MB)
        if (file.size > 10 * 1024 * 1024) {
          console.error("[v0] File too large:", file.size)
          toast.error("文件大小不能超过 10MB")
          return
        }

        console.log("[v0] Image dropped:", file.name)
        const reader = new FileReader()
        reader.onload = (e) => {
          const result = e.target?.result as string
          console.log("[v0] Dropped image loaded successfully")
          setUploadedImage(result)
        }
        reader.onerror = (e) => {
          console.error("[v0] Error reading dropped file:", e)
          toast.error("图片读取失败，请重试")
        }
        reader.readAsDataURL(file)
      } else {
        console.log("[v0] Invalid file type dropped")
        toast.error("请上传图片文件")
      }
    },
    [user],
  )

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
  }, [])

  const rotateImage = () => {
    setRotation((prev) => (prev + 90) % 360)
  }

  const convertToGrayscale = () => {
    setBrightness([100])
    setContrast([150])
  }

  const handleImageLoad = useCallback(() => {
    console.log("[v0] Image element loaded, ready for processing")

    if (imageRef.current && onImageDimensionsDetected) {
      const img = imageRef.current
      const imageDimensions = {
        length: img.naturalWidth * PIXELS_TO_MM,
        width: img.naturalHeight * PIXELS_TO_MM,
      }
      console.log("[v0] Auto-adjusting panel dimensions to image size:", imageDimensions)
      console.log("[v0] Auto-adjusting canvas size to:", imageDimensions)
      onImageDimensionsDetected(imageDimensions)
    }

    if (uploadedImage) {
      setTimeout(() => {
        processImageToPunchHoles()
      }, 100)
    }
  }, [uploadedImage, processImageToPunchHoles, onImageDimensionsDetected])

  const handleCropComplete = (croppedUrl: string) => {
    setCroppedImageUrl(croppedUrl)
    setShowCropTool(false)
  }

  const handleCropCancel = () => {
    setShowCropTool(false)
  }

  useEffect(() => {
    return () => {
      if (uploadedImage && uploadedImage.startsWith("blob:")) {
        URL.revokeObjectURL(uploadedImage)
      }
      if (croppedImageUrl && croppedImageUrl.startsWith("blob:")) {
        URL.revokeObjectURL(croppedImageUrl)
      }
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current)
      }
    }
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <ImageIcon className="w-5 h-5" />
          <span>图片上传与处理</span>
          {isProcessing && <Zap className="w-4 h-4 animate-pulse text-accent" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-accent transition-colors cursor-pointer"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => document.getElementById("image-upload")?.click()}
        >
          {uploadedImage ? (
            <div className="space-y-4">
              <img
                ref={imageRef}
                src={uploadedImage || "/placeholder.svg"}
                alt="Uploaded"
                className="max-w-full max-h-48 mx-auto rounded-lg"
                style={{
                  transform: `rotate(${rotation}deg)`,
                  filter: `brightness(${brightness[0]}%) contrast(${contrast[0]}%)`,
                }}
                crossOrigin="anonymous"
                onLoad={handleImageLoad}
              />
              <p className="text-sm text-muted-foreground">
                {isProcessing
                  ? `正在使用${conversionMode === "density" ? "密度映射" : conversionMode === "contour" ? "轮廓提取" : "像素化"}模式处理...`
                  : "点击或拖拽新图片替换"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
              <div>
                <p className="text-lg font-medium">上传图片</p>
                <p className="text-sm text-muted-foreground">支持 JPG、PNG、SVG 格式，拖拽或点击选择文件</p>
              </div>
            </div>
          )}
          <input id="image-upload" type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
        </div>

        <canvas ref={canvasRef} className="hidden" />

        {uploadedImage && (
          <Tabs defaultValue="adjust" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="adjust">调整</TabsTrigger>
              <TabsTrigger value="convert">转换</TabsTrigger>
            </TabsList>

            <TabsContent value="adjust" className="space-y-4">
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium">亮度</Label>
                  <Slider
                    value={brightness}
                    onValueChange={setBrightness}
                    max={200}
                    min={0}
                    step={1}
                    className="mt-2"
                  />
                  <span className="text-xs text-muted-foreground">{brightness[0]}%</span>
                </div>

                <div>
                  <Label className="text-sm font-medium">对比度</Label>
                  <Slider value={contrast} onValueChange={setContrast} max={200} min={0} step={1} className="mt-2" />
                  <span className="text-xs text-muted-foreground">{contrast[0]}%</span>
                </div>

                <Button onClick={rotateImage} variant="outline" size="sm" className="w-full bg-transparent">
                  <RotateCw className="w-4 h-4 mr-2" />
                  旋转 90°
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="convert" className="space-y-4">
              <Button onClick={convertToGrayscale} variant="outline" className="w-full bg-transparent">
                <Palette className="w-4 h-4 mr-2" />
                优化冲孔效果
              </Button>
              <Button onClick={processImageToPunchHoles} variant="default" className="w-full" disabled={isProcessing}>
                <Zap className="w-4 h-4 mr-2" />
                {isProcessing ? "处理中..." : "重新生成冲孔"}
              </Button>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  )
}
