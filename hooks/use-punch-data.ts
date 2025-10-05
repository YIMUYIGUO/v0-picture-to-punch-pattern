"use client"

import { useState, useCallback, useMemo } from "react"

export interface PunchHole {
  x: number
  y: number
  diameter: number
  shape?: "circle" | "square" | "hexagon" | "triangle"
  width?: number // for rectangles/squares
  height?: number // for rectangles
}

export interface GridLine {
  position: number
  type: "horizontal" | "vertical"
}

export interface PunchDataState {
  holes: PunchHole[]
  gridLines: GridLine[]
  panelWidth: number
  panelHeight: number
  margin: number
}

export interface GridDivisionConfig {
  horizontal: number
  vertical: number
  enabled: boolean
  spacing?: number
  horizontalSpacings?: number[]
  verticalSpacings?: number[]
}

export function usePunchData(edgeMargin = 0) {
  const [holes, setHoles] = useState<PunchHole[]>([])
  const [panelWidth, setPanelWidth] = useState(0)
  const [panelHeight, setPanelHeight] = useState(0)
  const [gridDivision, setGridDivision] = useState<GridDivisionConfig>({
    horizontal: 2,
    vertical: 2,
    enabled: false,
    spacing: 0, // 默认值改为0，将使用 edgeMargin 的值
    horizontalSpacings: [600],
    verticalSpacings: [1500],
  })

  const MARGIN = 20 // mm

  const gridLines = useMemo((): GridLine[] => {
    if (panelWidth === 0 || panelHeight === 0) {
      console.log("[v0] Grid lines: No panel dimensions")
      return []
    }

    if (!gridDivision.enabled) {
      console.log("[v0] Grid division disabled - no grid lines generated")
      return []
    }

    const lines: GridLine[] = []

    const hasVerticalSpacings = gridDivision.verticalSpacings && gridDivision.verticalSpacings.length > 0
    const hasHorizontalSpacings = gridDivision.horizontalSpacings && gridDivision.horizontalSpacings.length > 0

    console.log("[v0] Grid calculation:", {
      enabled: gridDivision.enabled,
      hasVerticalSpacings,
      hasHorizontalSpacings,
      verticalSpacings: gridDivision.verticalSpacings,
      horizontalSpacings: gridDivision.horizontalSpacings,
      panelWidth,
      panelHeight,
    })

    // Vertical lines (divide horizontally) - use custom spacings if available
    if (hasVerticalSpacings) {
      gridDivision.verticalSpacings!.forEach((spacing, index) => {
        if (spacing > 0 && spacing < panelWidth) {
          lines.push({ position: spacing, type: "vertical" })
          console.log(`[v0] Added vertical line at ${spacing}mm (custom spacing ${index + 1})`)
        }
      })
    } else if (gridDivision.vertical > 1) {
      // Equal division
      for (let i = 1; i < gridDivision.vertical; i++) {
        const position = (panelWidth / gridDivision.vertical) * i
        lines.push({ position, type: "vertical" })
        console.log(`[v0] Added vertical line at ${position}mm (equal division ${i})`)
      }
    }

    // Horizontal lines (divide vertically) - use custom spacings if available
    if (hasHorizontalSpacings) {
      gridDivision.horizontalSpacings!.forEach((spacing, index) => {
        if (spacing > 0 && spacing < panelHeight) {
          lines.push({ position: spacing, type: "horizontal" })
          console.log(`[v0] Added horizontal line at ${spacing}mm (custom spacing ${index + 1})`)
        }
      })
    } else if (gridDivision.horizontal > 1) {
      // Equal division
      for (let i = 1; i < gridDivision.horizontal; i++) {
        const position = (panelHeight / gridDivision.horizontal) * i
        lines.push({ position, type: "horizontal" })
        console.log(`[v0] Added horizontal line at ${position}mm (equal division ${i})`)
      }
    }

    console.log(`[v0] Final grid lines calculated: ${lines.length} lines`, lines)
    return lines
  }, [gridDivision, panelWidth, panelHeight])

  const filteredHoles = useMemo((): PunchHole[] => {
    if (gridLines.length === 0) {
      if (gridDivision.enabled) {
        console.log("[v0] Grid division enabled - filtering holes for grid lines")
        return holes
      } else {
        console.log(`[v0] Grid division disabled - using all holes: ${holes.length}`)
        return holes
      }
    }

    const tolerance = edgeMargin > 0 ? edgeMargin : gridDivision.spacing || 5
    const filtered = holes.filter((hole) => {
      for (const line of gridLines) {
        if (line.type === "vertical") {
          if (Math.abs(hole.x - line.position) < tolerance) {
            return false
          }
        } else {
          if (Math.abs(hole.y - line.position) < tolerance) {
            return false
          }
        }
      }
      return true
    })

    console.log(
      `[v0] Filtered ${holes.length - filtered.length} holes conflicting with grid lines (tolerance: ${tolerance}mm)`,
    )
    return filtered
  }, [holes, gridLines, gridDivision.spacing, gridDivision.enabled, edgeMargin])

  const getPunchData = useCallback((): PunchDataState => {
    return {
      holes: filteredHoles,
      gridLines,
      panelWidth,
      panelHeight,
      margin: MARGIN,
    }
  }, [filteredHoles, gridLines, panelWidth, panelHeight])

  const getExportCoordinates = useCallback((x: number, y: number) => {
    return {
      x: x + MARGIN,
      y: y + MARGIN,
    }
  }, [])

  return {
    holes,
    setHoles,
    panelWidth,
    setPanelWidth,
    panelHeight,
    setPanelHeight,
    gridDivision,
    setGridDivision,
    getPunchData,
    getExportCoordinates,
    filteredHoles,
    gridLines,
    margin: MARGIN,
  }
}
