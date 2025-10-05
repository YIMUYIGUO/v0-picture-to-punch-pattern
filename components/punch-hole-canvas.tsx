"use client"

import type React from "react"

import { useEffect, useRef, useState, useCallback, useMemo } from "react"

interface PunchHole {
  x: number
  y: number
  diameter: number
  intensity: number
  shape?: "circle" | "square" | "hexagon" | "triangle"
}

interface PunchHoleCanvasProps {
  width: number
  height: number
  holes: PunchHole[]
  zoom: number
  setZoom: (zoom: number) => void // Added setZoom prop for wheel zoom
  showGrid: boolean
  panelDimensions: { length: number; width: number; thickness: number }
  backgroundImage?: HTMLImageElement | null // Added backgroundImage prop to display image behind punch holes
  aluminumColor?: string
  holeColor?: string
  holeSpacing?: number
  holeShape?: "circle" | "square" | "hexagon" | "triangle" // 添加holeShape参数
  gridDivision?: {
    horizontal: number
    vertical: number
    enabled: boolean
    horizontalSpacings: number[]
    verticalSpacings: number[]
  }
  calculatedGridLines?: {
    verticalLines: number[]
    horizontalLines: number[]
  }
  isCanvasLocked?: boolean
  setMainCanvasRef?: (canvas: HTMLCanvasElement | null) => void
}

export function PunchHoleCanvas({
  width,
  height,
  holes,
  zoom,
  setZoom,
  showGrid,
  panelDimensions,
  backgroundImage,
  aluminumColor = "#f3f4f6",
  holeColor = "#374151",
  holeSpacing = 5,
  holeShape = "circle", // 添加holeShape默认值
  gridDivision = {
    horizontal: 2,
    vertical: 2,
    enabled: false,
    horizontalSpacings: [600],
    verticalSpacings: [1500],
  },
  calculatedGridLines = { verticalLines: [], horizontalLines: [] },
  isCanvasLocked = false,
  setMainCanvasRef,
}: PunchHoleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 })
  const [hasInitialFit, setHasInitialFit] = useState(false)
  const [lastPanelDimensions, setLastPanelDimensions] = useState(panelDimensions)

  const MM_TO_PX_RATIO = 1 // 1mm = 1px at 100% zoom for consistent scaling

  const filterHolesForGridDivision = useCallback(
    (
      holes: PunchHole[],
      panelX: number,
      panelY: number,
      panelDimensions: { length: number; width: number },
      calculatedGridLines: {
        verticalLines: number[]
        horizontalLines: number[]
      },
    ): PunchHole[] => {
      if (!gridDivision.enabled) return holes

      const holeSpacingPx = holeSpacing * MM_TO_PX_RATIO
      const tolerance = holeSpacingPx * 0.4 // 40% tolerance for grid alignment

      return holes.filter((hole) => {
        // Check if hole conflicts with vertical lines
        for (const lineX of calculatedGridLines.verticalLines) {
          const lineXPx = lineX * MM_TO_PX_RATIO
          const nearestColumnX = Math.round(lineXPx / holeSpacingPx) * holeSpacingPx
          const holeColumnX = Math.round(hole.x / holeSpacingPx) * holeSpacingPx

          if (Math.abs(holeColumnX - nearestColumnX) < tolerance) {
            return false
          }
        }

        // Check if hole conflicts with horizontal lines
        for (const lineY of calculatedGridLines.horizontalLines) {
          const lineYPx = lineY * MM_TO_PX_RATIO
          const nearestRowY = Math.round(lineYPx / holeSpacingPx) * holeSpacingPx
          const holeRowY = Math.round(hole.y / holeSpacingPx) * holeSpacingPx

          if (Math.abs(holeRowY - nearestRowY) < tolerance) {
            return false
          }
        }

        return true
      })
    },
    [holeSpacing, gridDivision.enabled],
  )

  const filteredHoles = useMemo(() => {
    if (!gridDivision.enabled) {
      console.log("[v0] Grid division disabled - using all holes:", holes.length)
      return holes
    }

    console.log("[v0] Grid division enabled - filtering holes for grid lines")
    return filterHolesForGridDivision(
      holes,
      0, // panelX will be calculated in draw function
      0, // panelY will be calculated in draw function
      { length: panelDimensions.length * MM_TO_PX_RATIO, width: panelDimensions.width * MM_TO_PX_RATIO },
      calculatedGridLines,
    )
  }, [holes, gridDivision.enabled, panelDimensions, calculatedGridLines, holeSpacing, filterHolesForGridDivision])

  const centerAndFit = useCallback(() => {
    console.log("[v0] Canvas - Centering and fitting view")

    // Reset pan offset
    setPanOffset({ x: 0, y: 0 })

    // Calculate optimal zoom to fit panel in canvas
    const canvas = canvasRef.current
    if (!canvas) return

    const canvasWidth = canvas.width
    const canvasHeight = canvas.height
    const panelLengthPx = panelDimensions.length * MM_TO_PX_RATIO
    const panelWidthPx = panelDimensions.width * MM_TO_PX_RATIO

    const padding = 0.85 // 85% of canvas space, leaving 15% for margins
    const scaleX = (canvasWidth * padding) / panelLengthPx
    const scaleY = (canvasHeight * padding) / panelWidthPx

    // Use the smaller scale to ensure entire panel fits
    const optimalScale = Math.min(scaleX, scaleY)
    const optimalZoom = Math.max(10, Math.min(400, optimalScale * 100))

    console.log(
      `[v0] Canvas - Optimal zoom calculated: ${optimalZoom.toFixed(1)}% (scaleX: ${scaleX.toFixed(3)}, scaleY: ${scaleY.toFixed(3)})`,
    )

    const zoomDifference = Math.abs(zoom - optimalZoom)
    if (zoomDifference > 1) {
      setZoom(optimalZoom)
      console.log(`[v0] Canvas - Zoom updated to: ${optimalZoom}%`)
    }
  }, [panelDimensions, zoom, setZoom])

  useEffect(() => {
    const dimensionsChanged =
      lastPanelDimensions.length !== panelDimensions.length || lastPanelDimensions.width !== panelDimensions.width

    if (dimensionsChanged) {
      console.log("[v0] Canvas - Panel dimensions changed, auto-fitting view")
      setLastPanelDimensions(panelDimensions)

      // Auto-fit after a short delay to ensure canvas is ready
      const timeoutId = setTimeout(() => {
        centerAndFit()
      }, 100)

      return () => clearTimeout(timeoutId)
    }
  }, [panelDimensions, lastPanelDimensions, centerAndFit])

  useEffect(() => {
    if (!hasInitialFit && canvasRef.current && panelDimensions.length > 0 && panelDimensions.width > 0) {
      console.log("[v0] Canvas - Applying initial fit")
      setHasInitialFit(true)
      const timeoutId = setTimeout(() => {
        centerAndFit()
      }, 200)

      return () => clearTimeout(timeoutId)
    }
  }, [hasInitialFit, panelDimensions, centerAndFit])

  useEffect(() => {
    if (canvasRef.current && setMainCanvasRef) {
      const canvas = canvasRef.current
      // Add centerAndFit method to canvas element for parent access
      ;(canvas as any).centerAndFit = centerAndFit
      setMainCanvasRef(canvas)
    }
  }, [setMainCanvasRef, centerAndFit])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Save context for transformations
    ctx.save()

    // Apply zoom and pan
    ctx.scale(zoom / 100, zoom / 100)
    ctx.translate(panOffset.x, panOffset.y)

    // Draw grid if enabled
    if (showGrid) {
      drawGrid(ctx, canvas.width, canvas.height)
    }

    const panelLengthPx = panelDimensions.length * MM_TO_PX_RATIO
    const panelWidthPx = panelDimensions.width * MM_TO_PX_RATIO
    const panelX = (canvas.width / (zoom / 100) - panelLengthPx) / 2
    const panelY = (canvas.height / (zoom / 100) - panelWidthPx) / 2

    if (backgroundImage) {
      drawBackgroundImage(ctx, backgroundImage, panelX, panelY, panelLengthPx, panelWidthPx)
    }

    drawPanel(ctx, panelX, panelY, panelLengthPx, panelWidthPx, aluminumColor)

    drawPunchHoles(ctx, filteredHoles, panelX, panelY, holeColor)

    if (gridDivision.enabled && calculatedGridLines) {
      drawGridDivisionLines(ctx, panelX, panelY, panelLengthPx, panelWidthPx, calculatedGridLines)
    }

    // Draw dimensions
    drawDimensions(ctx, panelX, panelY, panelDimensions.length, panelDimensions.width)

    // Restore context
    ctx.restore()

    if (setMainCanvasRef) {
      setMainCanvasRef(canvas)
    }
  }, [
    width,
    height,
    filteredHoles,
    zoom,
    showGrid,
    panelDimensions,
    panOffset,
    backgroundImage,
    aluminumColor,
    holeColor,
    gridDivision,
    calculatedGridLines,
    setMainCanvasRef,
  ])

  useEffect(() => {
    // Cancel previous animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }

    // Schedule new draw
    animationFrameRef.current = requestAnimationFrame(draw)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [draw])

  const drawGrid = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      ctx.strokeStyle = "#e5e7eb"
      ctx.lineWidth = 0.5
      ctx.globalAlpha = 0.3

      const gridSize = 20
      const scaledWidth = width / (zoom / 100)
      const scaledHeight = height / (zoom / 100)

      ctx.beginPath()
      // Vertical lines
      for (let x = 0; x <= scaledWidth; x += gridSize) {
        ctx.moveTo(x, 0)
        ctx.lineTo(x, scaledHeight)
      }

      // Horizontal lines
      for (let y = 0; y <= scaledHeight; y += gridSize) {
        ctx.moveTo(0, y)
        ctx.lineTo(scaledWidth, y)
      }
      ctx.stroke()

      ctx.globalAlpha = 1
    },
    [zoom],
  )

  const drawPanel = useCallback(
    (ctx: CanvasRenderingContext2D, x: number, y: number, length: number, width: number, backgroundColor: string) => {
      ctx.fillStyle = backgroundColor
      ctx.fillRect(x, y, length, width)

      // Panel border
      ctx.strokeStyle = "#374151"
      ctx.lineWidth = 2
      ctx.strokeRect(x, y, length, width)
    },
    [],
  )

  const drawPunchHoles = useCallback(
    (ctx: CanvasRenderingContext2D, holes: PunchHole[], offsetX: number, offsetY: number, color: string) => {
      const rgb = hexToRgb(color)
      ctx.fillStyle = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`
      ctx.strokeStyle = color
      ctx.lineWidth = 0.5

      // Group holes by shape for batch processing
      const holesByShape = holes.reduce(
        (acc, hole) => {
          const shape = hole.shape || holeShape // 优先使用hole.shape，否则使用全局holeShape
          if (!acc[shape]) acc[shape] = []
          acc[shape].push(hole)
          return acc
        },
        {} as Record<string, PunchHole[]>,
      )

      // Draw each shape type in batches
      Object.entries(holesByShape).forEach(([shape, shapeHoles]) => {
        ctx.beginPath()

        shapeHoles.forEach((hole) => {
          const centerX = offsetX + hole.x
          const centerY = offsetY + hole.y
          const radius = hole.diameter / 2

          switch (shape) {
            case "circle":
              ctx.moveTo(centerX + radius, centerY)
              ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI)
              break

            case "square":
              const squareSize = hole.diameter
              ctx.rect(centerX - squareSize / 2, centerY - squareSize / 2, squareSize, squareSize)
              break

            case "hexagon":
              ctx.moveTo(centerX + radius, centerY)
              for (let i = 1; i < 6; i++) {
                const angle = (i * Math.PI) / 3
                const x = centerX + radius * Math.cos(angle)
                const y = centerY + radius * Math.sin(angle)
                ctx.lineTo(x, y)
              }
              ctx.closePath()
              break

            case "triangle":
              const height = radius * Math.sqrt(3)
              ctx.moveTo(centerX, centerY - (height * 2) / 3)
              ctx.lineTo(centerX - radius, centerY + (height * 1) / 3)
              ctx.lineTo(centerX + radius, centerY + (height * 1) / 3)
              ctx.closePath()
              break
          }
        })

        ctx.fill()
        ctx.stroke()
      })
    },
    [holeShape], // 添加holeShape依赖
  )

  const drawDimensions = useCallback(
    (ctx: CanvasRenderingContext2D, x: number, y: number, length: number, width: number) => {
      ctx.fillStyle = "#374151"
      ctx.font = "12px monospace"
      ctx.textAlign = "center"

      // Length dimension (top)
      ctx.fillText(`${length}mm`, x + length / 2, y - 10)

      // Width dimension (left, rotated)
      ctx.save()
      ctx.translate(x - 15, y + width / 2)
      ctx.rotate(-Math.PI / 2)
      ctx.fillText(`${width}mm`, 0, 0)
      ctx.restore()
    },
    [],
  )

  const drawBackgroundImage = useCallback(
    (ctx: CanvasRenderingContext2D, image: HTMLImageElement, x: number, y: number, width: number, height: number) => {
      ctx.save()

      // Create clipping path for the panel area
      ctx.beginPath()
      ctx.rect(x, y, width, height)
      ctx.clip()

      ctx.drawImage(image, x, y, width, height)
      ctx.restore()
    },
    [],
  )

  const drawGridDivisionLines = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      panelX: number,
      panelY: number,
      panelLength: number,
      panelWidth: number,
      calculatedGridLines: {
        verticalLines: number[]
        horizontalLines: number[]
      },
    ) => {
      ctx.strokeStyle = "#dc2626"
      ctx.lineWidth = 2
      ctx.setLineDash([10, 5])

      ctx.beginPath()
      // Draw vertical division lines
      calculatedGridLines.verticalLines.forEach((lineX) => {
        const absoluteX = panelX + lineX
        if (absoluteX > panelX && absoluteX < panelX + panelLength) {
          ctx.moveTo(absoluteX, panelY)
          ctx.lineTo(absoluteX, panelY + panelWidth)
        }
      })

      // Draw horizontal division lines
      calculatedGridLines.horizontalLines.forEach((lineY) => {
        const absoluteY = panelY + lineY
        if (absoluteY > panelY && absoluteY < panelY + panelWidth) {
          ctx.moveTo(panelX, absoluteY)
          ctx.lineTo(panelX + panelLength, absoluteY)
        }
      })

      ctx.stroke()
      ctx.setLineDash([])

      // Draw division labels
      ctx.fillStyle = "#dc2626"
      ctx.font = "10px monospace"
      ctx.textAlign = "center"

      calculatedGridLines.verticalLines.forEach((lineX, index) => {
        const absoluteX = panelX + lineX
        if (absoluteX > panelX && absoluteX < panelX + panelLength) {
          ctx.fillText(`切割线 V${index + 1} (${lineX.toFixed(0)}mm)`, absoluteX, panelY - 5)
        }
      })

      calculatedGridLines.horizontalLines.forEach((lineY, index) => {
        const absoluteY = panelY + lineY
        if (absoluteY > panelY && absoluteY < panelY + panelWidth) {
          ctx.save()
          ctx.translate(panelX - 15, absoluteY)
          ctx.rotate(-Math.PI / 2)
          ctx.fillText(`切割线 H${index + 1} (${lineY.toFixed(0)}mm)`, 0, 0)
          ctx.restore()
        }
      })
    },
    [],
  )

  const hexToRgb = useCallback((hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result
      ? {
          r: Number.parseInt(result[1], 16),
          g: Number.parseInt(result[2], 16),
          b: Number.parseInt(result[3], 16),
        }
      : { r: 55, g: 65, b: 81 } // fallback to default gray
  }, [])

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (isCanvasLocked) return
      e.preventDefault()
      setIsDragging(true)
      setLastMousePos({ x: e.clientX, y: e.clientY })
    },
    [isCanvasLocked],
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDragging || isCanvasLocked) return
      e.preventDefault()

      const deltaX = e.clientX - lastMousePos.x
      const deltaY = e.clientY - lastMousePos.y

      const panSensitivity = 1.0 / (zoom / 100)
      setPanOffset((prev) => ({
        x: prev.x + deltaX * panSensitivity,
        y: prev.y + deltaY * panSensitivity,
      }))

      setLastMousePos({ x: e.clientX, y: e.clientY })
    },
    [isDragging, isCanvasLocked, lastMousePos, zoom],
  )

  const handleMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLCanvasElement>) => {
      if (isCanvasLocked) return
      e.preventDefault()

      const canvas = canvasRef.current
      if (!canvas) return

      // Get mouse position relative to canvas
      const rect = canvas.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top

      // Convert mouse position to canvas coordinates (accounting for current zoom and pan)
      const canvasMouseX = mouseX / (zoom / 100) - panOffset.x
      const canvasMouseY = mouseY / (zoom / 100) - panOffset.y

      const zoomStep = e.deltaY > 0 ? -15 : 15
      const newZoom = Math.max(5, Math.min(500, zoom + zoomStep))
      const zoomRatio = newZoom / zoom

      // Adjust pan offset to keep mouse position as zoom center
      const newPanX = panOffset.x + canvasMouseX * (1 - zoomRatio)
      const newPanY = panOffset.y + canvasMouseY * (1 - zoomRatio)

      setPanOffset({ x: newPanX, y: newPanY })
      setZoom(newZoom)
    },
    [isCanvasLocked, zoom, panOffset, setZoom],
  )

  const handleDoubleClick = useCallback(() => {
    centerAndFit()
  }, [centerAndFit])

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={`w-full border rounded-lg bg-white h-full ${
        isCanvasLocked ? "cursor-not-allowed opacity-75" : isDragging ? "cursor-grabbing" : "cursor-grab"
      }`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      onDoubleClick={handleDoubleClick}
    />
  )
}
