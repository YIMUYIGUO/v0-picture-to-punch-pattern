"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Settings, Plus, X, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useSession } from "next-auth/react"
import { useSystemSettings } from "@/hooks/use-system-settings"

interface ParameterPanelProps {
  onParameterChange?: (dimensions: { length: number; width: number; thickness: number }) => void
  dimensions: { length: number; width: number; thickness: number }
  onHoleDiametersChange?: (diameters: number[]) => void
  onHoleSpacingChange?: (spacing: number) => void
  onConversionModeChange?: (mode: string) => void
  onAluminumColorChange?: (color: string) => void
  onHoleColorChange?: (color: string) => void
  onGridDivisionChange?: (gridDivision: {
    horizontal: number
    vertical: number
    enabled: boolean
    horizontalSpacings: number[]
    verticalSpacings: number[]
  }) => void
  onEdgeMarginChange?: (margin: number) => void
  onHoleShapeChange?: (shape: "circle" | "square" | "hexagon" | "triangle") => void
  edgeMargin?: number
  aluminumColor?: string
  holeColor?: string
}

interface Subscription {
  plan_type: string
  monthly_generations_used: number
  monthly_generations_limit: number
}

export function ParameterPanel({
  onParameterChange,
  dimensions,
  onHoleDiametersChange,
  onHoleSpacingChange,
  onConversionModeChange,
  onAluminumColorChange,
  onHoleColorChange,
  onGridDivisionChange,
  onEdgeMarginChange,
  onHoleShapeChange,
  edgeMargin = 0,
  aluminumColor: propAluminumColor,
  holeColor: propHoleColor,
}: ParameterPanelProps) {
  const [tempAluminumColor, setTempAluminumColor] = useState(propAluminumColor || "#f3f4f6")
  const [tempHoleColor, setTempHoleColor] = useState(propHoleColor || "#374151")
  const [appliedAluminumColor, setAppliedAluminumColor] = useState(propAluminumColor || "#f3f4f6")
  const [appliedHoleColor, setAppliedHoleColor] = useState(propHoleColor || "#374151")
  const [gridDivision, setGridDivision] = useState({
    horizontal: 2,
    vertical: 2,
    enabled: false,
    horizontalSpacings: [600], // Array of spacings for each horizontal division
    verticalSpacings: [1500], // Array of spacings for each vertical division
  })
  const [holeDiameters, setHoleDiameters] = useState<number[]>([3, 5, 8])
  const [newDiameter, setNewDiameter] = useState("")
  const [holeSpacing, setHoleSpacing] = useState(5)
  const [conversionMode, setConversionMode] = useState("density")
  const [holeShape, setHoleShape] = useState<"circle" | "square" | "hexagon" | "triangle">("circle")
  const [rotation, setRotation] = useState(0)
  const [subscription, setSubscription] = useState<Subscription | null>(null)

  const { data: session } = useSession()
  const systemSettings = useSystemSettings()
  const { getMaxPanelSize, loading: settingsLoading } = systemSettings

  const sizeWarning = useMemo(() => {
    if (settingsLoading || !subscription || !getMaxPanelSize) return ""

    if (subscription?.plan_type === "free") {
      const maxSize = getMaxPanelSize("free")
      if (dimensions.length > maxSize || dimensions.width > maxSize) {
        return `免费用户面板尺寸限制为${maxSize}×${maxSize}mm，当前：${dimensions.length}×${dimensions.width}mm`
      }
    }
    return ""
  }, [dimensions, subscription, getMaxPanelSize, settingsLoading])

  const hasColorChanges = useMemo(
    () => tempAluminumColor !== appliedAluminumColor || tempHoleColor !== appliedHoleColor,
    [tempAluminumColor, appliedAluminumColor, tempHoleColor, appliedHoleColor],
  )

  useEffect(() => {
    let isMounted = true

    async function fetchSubscription() {
      if (!session?.user) {
        if (isMounted) {
          setSubscription(null)
        }
        return
      }

      try {
        const response = await fetch("/api/subscription")
        const data = await response.json()

        if (data.subscription && isMounted) {
          setSubscription(data.subscription)
        }
      } catch (error) {
        console.error("[v0] Error fetching subscription:", error)
      }
    }

    fetchSubscription()

    return () => {
      isMounted = false
    }
  }, [session])

  const handleLengthChange = useCallback(
    (value: string) => {
      const length = Number.parseFloat(value) || 1000
      if (!settingsLoading && subscription?.plan_type === "free" && getMaxPanelSize) {
        const maxSize = getMaxPanelSize("free")
        if (length > maxSize) {
          alert(`免费用户长度限制为${maxSize}mm，请升级订阅`)
          return
        }
      }
      onParameterChange?.({ ...dimensions, length })
    },
    [subscription, dimensions, onParameterChange, getMaxPanelSize, settingsLoading],
  )

  const handleWidthChange = useCallback(
    (value: string) => {
      const width = Number.parseFloat(value) || 600
      if (!settingsLoading && subscription?.plan_type === "free" && getMaxPanelSize) {
        const maxSize = getMaxPanelSize("free")
        if (width > maxSize) {
          alert(`免费用户宽度限制为${maxSize}mm，请升级订阅`)
          return
        }
      }
      onParameterChange?.({ ...dimensions, width })
    },
    [subscription, dimensions, onParameterChange, getMaxPanelSize, settingsLoading],
  )

  const addHoleDiameter = useCallback(() => {
    const diameter = Number.parseFloat(newDiameter)
    if (diameter > 0 && diameter <= 50 && !holeDiameters.includes(diameter)) {
      const updatedDiameters = [...holeDiameters, diameter].sort((a, b) => a - b)
      setHoleDiameters(updatedDiameters)
      onHoleDiametersChange?.(updatedDiameters)
      setNewDiameter("")
    }
  }, [newDiameter, holeDiameters, onHoleDiametersChange])

  const removeHoleDiameter = useCallback(
    (diameter: number) => {
      const updatedDiameters = holeDiameters.filter((d) => d !== diameter)
      setHoleDiameters(updatedDiameters)
      onHoleDiametersChange?.(updatedDiameters)
    },
    [holeDiameters, onHoleDiametersChange],
  )

  const handleHoleSpacingChange = useCallback(
    (value: string) => {
      const spacing = Number.parseFloat(value) || 5
      setHoleSpacing(spacing)
      onHoleSpacingChange?.(spacing)
    },
    [onHoleSpacingChange],
  )

  const handleConversionModeChange = useCallback(
    (mode: string) => {
      setConversionMode(mode)
      onConversionModeChange?.(mode)
    },
    [onConversionModeChange],
  )

  const applyColorChanges = useCallback(() => {
    console.log("[v0] Applying color changes:", { aluminum: tempAluminumColor, hole: tempHoleColor })
    setAppliedAluminumColor(tempAluminumColor)
    setAppliedHoleColor(tempHoleColor)
    onAluminumColorChange?.(tempAluminumColor)
    onHoleColorChange?.(tempHoleColor)
  }, [tempAluminumColor, tempHoleColor, onAluminumColorChange, onHoleColorChange])

  const handleGridDivisionChange = useCallback(
    (
      field: "horizontal" | "vertical" | "enabled" | "horizontalSpacings" | "verticalSpacings",
      value: number | boolean | number[],
    ) => {
      const newGridDivision = { ...gridDivision }

      if (field === "horizontal") {
        const count = value as number
        newGridDivision.horizontal = count
        // Adjust horizontal spacings array
        if (count > 1) {
          const currentSpacings = newGridDivision.horizontalSpacings
          if (currentSpacings.length < count - 1) {
            // Add default spacings
            newGridDivision.horizontalSpacings = [
              ...currentSpacings,
              ...Array(count - 1 - currentSpacings.length).fill(600),
            ]
          } else if (currentSpacings.length > count - 1) {
            // Remove excess spacings
            newGridDivision.horizontalSpacings = currentSpacings.slice(0, count - 1)
          }
        } else {
          newGridDivision.horizontalSpacings = []
        }
      } else if (field === "vertical") {
        const count = value as number
        newGridDivision.vertical = count
        // Adjust vertical spacings array
        if (count > 1) {
          const currentSpacings = newGridDivision.verticalSpacings
          if (currentSpacings.length < count - 1) {
            // Add default spacings
            newGridDivision.verticalSpacings = [
              ...currentSpacings,
              ...Array(count - 1 - currentSpacings.length).fill(1500),
            ]
          } else if (currentSpacings.length > count - 1) {
            // Remove excess spacings
            newGridDivision.verticalSpacings = currentSpacings.slice(0, count - 1)
          }
        } else {
          newGridDivision.verticalSpacings = []
        }
      } else {
        newGridDivision[field] = value as any
      }

      setGridDivision(newGridDivision)
      onGridDivisionChange?.(newGridDivision)
    },
    [gridDivision, onGridDivisionChange],
  )

  const updateSpacing = useCallback(
    (type: "horizontal" | "vertical", index: number, value: number) => {
      const spacings = type === "horizontal" ? [...gridDivision.horizontalSpacings] : [...gridDivision.verticalSpacings]
      spacings[index] = value
      handleGridDivisionChange(type === "horizontal" ? "horizontalSpacings" : "verticalSpacings", spacings)
    },
    [gridDivision, handleGridDivisionChange],
  )

  const handleEdgeMarginChange = useCallback(
    (value: string) => {
      const margin = Number.parseFloat(value) || 0
      onEdgeMarginChange?.(margin)
    },
    [onEdgeMarginChange],
  )

  const handleHoleShapeChange = useCallback(
    (shape: "circle" | "square" | "hexagon" | "triangle") => {
      setHoleShape(shape)
      onHoleShapeChange?.(shape)
    },
    [onHoleShapeChange],
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Settings className="w-5 h-5" />
          <span>参数配置</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="panel" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="panel">铝板</TabsTrigger>
            <TabsTrigger value="punch">冲孔</TabsTrigger>
            <TabsTrigger value="pattern">图案</TabsTrigger>
            <TabsTrigger value="division">分格</TabsTrigger>
          </TabsList>

          <TabsContent value="panel" className="space-y-4">
            {sizeWarning && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  {sizeWarning}
                  <Button variant="link" className="p-0 h-auto ml-2 text-sm">
                    升级订阅
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="length" className="text-sm font-medium">
                  长度 (mm)
                </Label>
                <Input
                  id="length"
                  value={dimensions.length.toString()}
                  onChange={(e) => handleLengthChange(e.target.value)}
                  placeholder="1000"
                  max={
                    !settingsLoading && subscription?.plan_type === "free" && getMaxPanelSize
                      ? getMaxPanelSize("free")
                      : undefined
                  }
                />
                {!settingsLoading && subscription?.plan_type === "free" && getMaxPanelSize && (
                  <p className="text-xs text-muted-foreground mt-1">免费用户最大: {getMaxPanelSize("free")}mm</p>
                )}
              </div>
              <div>
                <Label htmlFor="width" className="text-sm font-medium">
                  宽度 (mm)
                </Label>
                <Input
                  id="width"
                  value={dimensions.width.toString()}
                  onChange={(e) => handleWidthChange(e.target.value)}
                  placeholder="600"
                  max={
                    !settingsLoading && subscription?.plan_type === "free" && getMaxPanelSize
                      ? getMaxPanelSize("free")
                      : undefined
                  }
                />
                {!settingsLoading && subscription?.plan_type === "free" && getMaxPanelSize && (
                  <p className="text-xs text-muted-foreground mt-1">免费用户最大: {getMaxPanelSize("free")}mm</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="edge-margin" className="text-sm font-medium">
                四边留白 (mm)
              </Label>
              <Input
                id="edge-margin"
                value={edgeMargin.toString()}
                onChange={(e) => handleEdgeMarginChange(e.target.value)}
                placeholder="0"
                type="number"
                min="0"
                max="100"
                step="1"
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                在铝板四边留出空白区域，不生成冲孔。当前留白: {edgeMargin}mm
              </p>
            </div>

            <div>
              <Label htmlFor="aluminum-color" className="text-sm font-medium">
                铝板颜色
              </Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="aluminum-color"
                  type="color"
                  value={tempAluminumColor}
                  onChange={(e) => setTempAluminumColor(e.target.value)}
                  className="w-16 h-10 p-1 border rounded"
                />
                <div className="flex-1">
                  <Select value={tempAluminumColor} onValueChange={setTempAluminumColor}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="#f3f4f6">银灰色 (默认)</SelectItem>
                      <SelectItem value="#fef3c7">金色</SelectItem>
                      <SelectItem value="#fecaca">玫瑰金</SelectItem>
                      <SelectItem value="#dbeafe">蓝色</SelectItem>
                      <SelectItem value="#dcfce7">绿色</SelectItem>
                      <SelectItem value="#1f2937">深灰色</SelectItem>
                      <SelectItem value="#ffffff">白色</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="hole-color" className="text-sm font-medium">
                冲孔颜色
              </Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="hole-color"
                  type="color"
                  value={tempHoleColor}
                  onChange={(e) => setTempHoleColor(e.target.value)}
                  className="w-16 h-10 p-1 border rounded"
                />
                <div className="flex-1">
                  <Select value={tempHoleColor} onValueChange={setTempHoleColor}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="#374151">深灰色 (默认)</SelectItem>
                      <SelectItem value="#000000">黑色</SelectItem>
                      <SelectItem value="#ffffff">白色</SelectItem>
                      <SelectItem value="#ef4444">红色</SelectItem>
                      <SelectItem value="#3b82f6">蓝色</SelectItem>
                      <SelectItem value="#10b981">绿色</SelectItem>
                      <SelectItem value="#f59e0b">橙色</SelectItem>
                      <SelectItem value="#8b5cf6">紫色</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">所有冲孔将使用统一颜色</p>
            </div>

            {hasColorChanges && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800 mb-2">颜色设置已更改，点击确认应用</p>
                <Button onClick={applyColorChanges} size="sm" className="w-full">
                  确认应用颜色设置
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="punch" className="space-y-4">
            <div>
              <Label className="text-sm font-medium">穿孔类型</Label>
              <Select value={holeShape} onValueChange={handleHoleShapeChange}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="circle">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-gray-400 rounded-full"></div>
                      <span>圆形</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="square">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-gray-400"></div>
                      <span>正方形</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="hexagon">
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-4 h-4 bg-gray-400"
                        style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }}
                      ></div>
                      <span>六边形</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="triangle">
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-4 h-4 bg-gray-400"
                        style={{ clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)" }}
                      ></div>
                      <span>三角形</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">选择冲孔的形状类型</p>
            </div>

            <div>
              <Label className="text-sm font-medium">指定孔径 (mm)</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  value={newDiameter}
                  onChange={(e) => setNewDiameter(e.target.value)}
                  placeholder="输入孔径值"
                  type="number"
                  min="0.1"
                  max="50"
                  step="0.1"
                />
                <Button onClick={addHoleDiameter} size="sm" disabled={!newDiameter}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex flex-wrap gap-2 mt-3">
                {holeDiameters.map((diameter) => (
                  <div key={diameter} className="flex items-center gap-1 bg-muted px-2 py-1 rounded-md text-sm">
                    <span>{diameter}mm</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0"
                      onClick={() => removeHoleDiameter(diameter)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>

              {holeDiameters.length === 0 && <p className="text-xs text-muted-foreground mt-2">请添加至少一个孔径值</p>}
            </div>

            <div>
              <Label htmlFor="spacing" className="text-sm font-medium">
                孔距 (mm)
              </Label>
              <Input
                id="spacing"
                value={holeSpacing.toString()}
                onChange={(e) => handleHoleSpacingChange(e.target.value)}
                placeholder="5"
                type="number"
                min="1"
                max="50"
                step="0.1"
                className="mt-2"
              />
              <span className="text-xs text-muted-foreground">当前孔距: {holeSpacing}mm</span>
            </div>
          </TabsContent>

          <TabsContent value="pattern" className="space-y-4">
            <div>
              <Label className="text-sm font-medium">转换模式</Label>
              <Select value={conversionMode} onValueChange={handleConversionModeChange}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="density">密度映射</SelectItem>
                  <SelectItem value="contour">轮廓提取</SelectItem>
                  <SelectItem value="pixel">像素化</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                {conversionMode === "density" && "根据图像亮度生成不同大小的孔"}
                {conversionMode === "contour" && "提取图像边缘轮廓生成孔"}
                {conversionMode === "pixel" && "像素化风格，生成规整的孔阵列"}
              </p>
            </div>
          </TabsContent>

          <TabsContent value="division" className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="enable-grid"
                checked={gridDivision.enabled}
                onChange={(e) => handleGridDivisionChange("enabled", e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="enable-grid" className="text-sm font-medium">
                启用分格功能
              </Label>
            </div>

            {gridDivision.enabled && (
              <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm font-medium">水平分格数</Label>
                    <Select
                      value={gridDivision.horizontal.toString()}
                      onValueChange={(value) => handleGridDivisionChange("horizontal", Number.parseInt(value))}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6].map((num) => (
                          <SelectItem key={num} value={num.toString()}>
                            {num}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">垂直分格数</Label>
                    <Select
                      value={gridDivision.vertical.toString()}
                      onValueChange={(value) => handleGridDivisionChange("vertical", Number.parseInt(value))}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6].map((num) => (
                          <SelectItem key={num} value={num.toString()}>
                            {num}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* 水平分格间距设置 */}
                {gridDivision.horizontal > 1 && (
                  <div>
                    <Label className="text-sm font-medium">水平分格间距 (mm)</Label>
                    <div className="space-y-2 mt-2">
                      {gridDivision.horizontalSpacings.map((spacing, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <span className="text-xs text-muted-foreground w-16">第{index + 1}段:</span>
                          <Input
                            type="number"
                            value={spacing}
                            onChange={(e) => updateSpacing("horizontal", index, Number.parseFloat(e.target.value) || 0)}
                            className="flex-1"
                            min="10"
                            max="2000"
                            step="1"
                            placeholder="输入间距"
                          />
                          <span className="text-xs text-muted-foreground">mm</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 垂直分格间距设置 */}
                {gridDivision.vertical > 1 && (
                  <div>
                    <Label className="text-sm font-medium">垂直分格间距 (mm)</Label>
                    <div className="space-y-2 mt-2">
                      {gridDivision.verticalSpacings.map((spacing, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <span className="text-xs text-muted-foreground w-16">第{index + 1}段:</span>
                          <Input
                            type="number"
                            value={spacing}
                            onChange={(e) => updateSpacing("vertical", index, Number.parseFloat(e.target.value) || 0)}
                            className="flex-1"
                            min="10"
                            max="3000"
                            step="1"
                            placeholder="输入间距"
                          />
                          <span className="text-xs text-muted-foreground">mm</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-800">
                    分格功能将在铝板上生成网格线，用于标记分割区域。可以直接输入具体的间距数值。
                    {gridDivision.horizontal > 1 && gridDivision.vertical > 1 && (
                      <span className="block mt-1">
                        当前设置将生成 {gridDivision.horizontal}×{gridDivision.vertical} ={" "}
                        {gridDivision.horizontal * gridDivision.vertical} 个区域
                      </span>
                    )}
                  </p>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
