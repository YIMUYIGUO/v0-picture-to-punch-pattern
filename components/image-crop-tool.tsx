"use client"

import type React from "react"
import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Check, X } from "lucide-react"

interface ImageCropToolProps {
  imageUrl: string
  onCropComplete: (croppedImageUrl: string) => void
  onCancel: () => void
}

interface CropArea {
  x: number
  y: number
  width: number
  height: number
}

export function ImageCropTool({ imageUrl, onCropComplete, onCancel }: ImageCropToolProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const [cropArea, setCropArea] = useState<CropArea>({ x: 0, y: 0, width: 200, height: 200 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [imageLoaded, setImageLoaded] = useState(false)

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const image = imageRef.current
    if (!canvas || !image || !imageLoaded) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size to match image display size
    const rect = image.getBoundingClientRect()
    canvas.width = rect.width
    canvas.height = rect.height
    canvas.style.width = `${rect.width}px`
    canvas.style.height = `${rect.height}px`

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw semi-transparent overlay
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Clear crop area (make it transparent)
    ctx.globalCompositeOperation = "destination-out"
    ctx.fillRect(cropArea.x, cropArea.y, cropArea.width, cropArea.height)

    // Draw crop area border
    ctx.globalCompositeOperation = "source-over"
    ctx.strokeStyle = "#3b82f6"
    ctx.lineWidth = 2
    ctx.strokeRect(cropArea.x, cropArea.y, cropArea.width, cropArea.height)

    // Draw corner handles
    const handleSize = 8
    ctx.fillStyle = "#3b82f6"
    const corners = [
      { x: cropArea.x - handleSize / 2, y: cropArea.y - handleSize / 2 },
      { x: cropArea.x + cropArea.width - handleSize / 2, y: cropArea.y - handleSize / 2 },
      { x: cropArea.x - handleSize / 2, y: cropArea.y + cropArea.height - handleSize / 2 },
      { x: cropArea.x + cropArea.width - handleSize / 2, y: cropArea.y + cropArea.height - handleSize / 2 },
    ]
    corners.forEach((corner) => {
      ctx.fillRect(corner.x, corner.y, handleSize, handleSize)
    })
  }, [cropArea, imageLoaded])

  useEffect(() => {
    drawCanvas()
  }, [drawCanvas])

  const handleImageLoad = () => {
    setImageLoaded(true)
    const image = imageRef.current
    if (image) {
      // Initialize crop area to center of image
      const rect = image.getBoundingClientRect()
      const size = Math.min(rect.width, rect.height) * 0.6
      setCropArea({
        x: (rect.width - size) / 2,
        y: (rect.height - size) / 2,
        width: size,
        height: size,
      })
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Check if click is inside crop area
    if (x >= cropArea.x && x <= cropArea.x + cropArea.width && y >= cropArea.y && y <= cropArea.y + cropArea.height) {
      setIsDragging(true)
      setDragStart({ x: x - cropArea.x, y: y - cropArea.y })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const newX = Math.max(0, Math.min(x - dragStart.x, canvas.width - cropArea.width))
    const newY = Math.max(0, Math.min(y - dragStart.y, canvas.height - cropArea.height))

    setCropArea((prev) => ({ ...prev, x: newX, y: newY }))
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleCrop = async () => {
    const image = imageRef.current
    if (!image || !imageLoaded) return

    // Create a new canvas for cropping
    const cropCanvas = document.createElement("canvas")
    const cropCtx = cropCanvas.getContext("2d")
    if (!cropCtx) return

    // Calculate scale factors between display size and natural size
    const rect = image.getBoundingClientRect()
    const scaleX = image.naturalWidth / rect.width
    const scaleY = image.naturalHeight / rect.height

    // Set crop canvas size
    const cropWidth = cropArea.width * scaleX
    const cropHeight = cropArea.height * scaleY
    cropCanvas.width = cropWidth
    cropCanvas.height = cropHeight

    // Draw cropped image
    cropCtx.drawImage(
      image,
      cropArea.x * scaleX, // source x
      cropArea.y * scaleY, // source y
      cropWidth, // source width
      cropHeight, // source height
      0, // destination x
      0, // destination y
      cropWidth, // destination width
      cropHeight, // destination height
    )

    // Convert to blob and create URL
    cropCanvas.toBlob(
      (blob) => {
        if (blob) {
          const croppedUrl = URL.createObjectURL(blob)
          onCropComplete(croppedUrl)
        }
      },
      "image/jpeg",
      0.9,
    )
  }

  return (
    <div className="space-y-4">
      <div className="relative inline-block">
        <img
          ref={imageRef}
          src={imageUrl || "/placeholder.svg"}
          alt="Crop preview"
          className="max-w-full max-h-96 rounded-lg"
          onLoad={handleImageLoad}
          crossOrigin="anonymous"
        />
        {imageLoaded && (
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 cursor-move"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />
        )}
      </div>

      <div className="flex space-x-2">
        <Button onClick={handleCrop} className="flex-1">
          <Check className="w-4 h-4 mr-2" />
          确认裁剪
        </Button>
        <Button onClick={onCancel} variant="outline" className="flex-1 bg-transparent">
          <X className="w-4 h-4 mr-2" />
          取消
        </Button>
      </div>

      <p className="text-xs text-muted-foreground text-center">拖拽蓝色区域选择要作为缩略图的部分</p>
    </div>
  )
}
