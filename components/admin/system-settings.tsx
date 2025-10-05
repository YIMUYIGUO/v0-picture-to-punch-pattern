"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Settings } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"

function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout
  return ((...args: any[]) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }) as T
}

interface SystemSetting {
  id: string
  key: string
  value: string
  description: string
}

export function SystemSettings() {
  const [settings, setSettings] = useState<SystemSetting[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [localValues, setLocalValues] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/admin/settings")
      const result = await response.json()

      if (result.success) {
        setSettings(result.data)
        const values = result.data.reduce((acc: Record<string, string>, setting: SystemSetting) => {
          acc[setting.key] = setting.value
          return acc
        }, {})
        setLocalValues(values)
      } else {
        toast.error("获取系统设置失败")
      }
    } catch (error) {
      toast.error("网络错误")
    } finally {
      setLoading(false)
    }
  }

  const updateSetting = async (key: string, value: any) => {
    setSaving(true)
    try {
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success("设置已保存")
        setSettings(settings.map((setting) => (setting.key === key ? { ...setting, value: String(value) } : setting)))

        if (key === "free_user_download_limit") {
          try {
            const syncResponse = await fetch("/api/admin/sync-free-limits", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ newLimit: value }),
            })

            const syncResult = await syncResponse.json()
            if (syncResult.success) {
              toast.success(`已同步更新 ${syncResult.updatedCount} 个免费订阅的限制`)
            }
          } catch (error) {
            console.error("Failed to sync free limits:", error)
          }
        }
      } else {
        toast.error(result.error || "保存失败")
        setLocalValues((prev) => ({
          ...prev,
          [key]: settings.find((s) => s.key === key)?.value || "",
        }))
      }
    } catch (error) {
      toast.error("网络错误")
      setLocalValues((prev) => ({
        ...prev,
        [key]: settings.find((s) => s.key === key)?.value || "",
      }))
    } finally {
      setSaving(false)
    }
  }

  const debouncedUpdate = useCallback(
    debounce((key: string, value: string) => {
      updateSetting(key, value)
    }, 1000),
    [settings],
  )

  const getSetting = (key: string) => {
    return localValues[key] || settings.find((s) => s.key === key)?.value || ""
  }

  const getSettingDescription = (key: string) => {
    return settings.find((s) => s.key === key)?.description || ""
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">系统设置</h1>
        <p className="text-muted-foreground">配置系统参数和功能开关</p>
      </div>

      <div className="grid gap-6">
        {/* User Limits */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="w-5 h-5" />
              <span>用户限制</span>
            </CardTitle>
            <CardDescription>设置免费用户的使用限制</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="download-limit">免费用户月下载次数</Label>
              <div className="flex items-center space-x-2 mt-1">
                <Input
                  id="download-limit"
                  type="number"
                  value={getSetting("free_user_download_limit")}
                  onChange={(e) => {
                    const newValue = e.target.value
                    setLocalValues((prev) => ({
                      ...prev,
                      free_user_download_limit: newValue,
                    }))
                    debouncedUpdate("free_user_download_limit", newValue)
                  }}
                  className="w-32"
                />
                <span className="text-sm text-muted-foreground">次/月</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{getSettingDescription("free_user_download_limit")}</p>
            </div>

            <div>
              <Label htmlFor="max-panel-size-free">免费用户最大面板尺寸</Label>
              <div className="flex items-center space-x-2 mt-1">
                <Input
                  id="max-panel-size-free"
                  type="number"
                  value={getSetting("max_panel_size_free")}
                  onChange={(e) => {
                    const newValue = e.target.value
                    setLocalValues((prev) => ({
                      ...prev,
                      max_panel_size_free: newValue,
                    }))
                    debouncedUpdate("max_panel_size_free", newValue)
                  }}
                  className="w-32"
                  min="100"
                  max="10000"
                />
                <span className="text-sm text-muted-foreground">mm</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{getSettingDescription("max_panel_size_free")}</p>
            </div>

            <div>
              <Label htmlFor="max-panel-size-pro">专业用户最大面板尺寸</Label>
              <div className="flex items-center space-x-2 mt-1">
                <Input
                  id="max-panel-size-pro"
                  type="number"
                  value={getSetting("max_panel_size_pro")}
                  onChange={(e) => {
                    const newValue = e.target.value
                    setLocalValues((prev) => ({
                      ...prev,
                      max_panel_size_pro: newValue,
                    }))
                    debouncedUpdate("max_panel_size_pro", newValue)
                  }}
                  className="w-32"
                  min="100"
                  max="50000"
                />
                <span className="text-sm text-muted-foreground">mm</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{getSettingDescription("max_panel_size_pro")}</p>
            </div>

            <div>
              <Label htmlFor="max-panel-size-enterprise">企业用户最大面板尺寸</Label>
              <div className="flex items-center space-x-2 mt-1">
                <Input
                  id="max-panel-size-enterprise"
                  type="number"
                  value={getSetting("max_panel_size_enterprise")}
                  onChange={(e) => {
                    const newValue = e.target.value
                    setLocalValues((prev) => ({
                      ...prev,
                      max_panel_size_enterprise: newValue,
                    }))
                    debouncedUpdate("max_panel_size_enterprise", newValue)
                  }}
                  className="w-32"
                  min="100"
                  max="999999"
                />
                <span className="text-sm text-muted-foreground">mm</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{getSettingDescription("max_panel_size_enterprise")}</p>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Management */}
        <Card>
          <CardHeader>
            <CardTitle>订阅管理</CardTitle>
            <CardDescription>订阅系统配置和管理</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground bg-blue-50 p-3 rounded-lg">
              💡 所有订阅均通过兑换码激活，不支持在线支付。请前往"礼品订阅"页面管理兑换码。
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>订阅激活方式</Label>
                <p className="text-xs text-muted-foreground">当前仅支持兑换码激活</p>
              </div>
              <Badge variant="secondary">仅兑换码</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Gallery Settings */}
        <Card>
          <CardHeader>
            <CardTitle>作品广场设置</CardTitle>
            <CardDescription>配置作品发布和审核规则</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>启用作品审核</Label>
                <p className="text-xs text-muted-foreground">开启后新作品需要管理员审核才能发布</p>
              </div>
              <Switch
                checked={getSetting("gallery_moderation") === "true"}
                onCheckedChange={(checked) => updateSetting("gallery_moderation", checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle>系统状态</CardTitle>
            <CardDescription>查看系统运行状态</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2"></div>
                <p className="text-sm font-medium">数据库</p>
                <p className="text-xs text-muted-foreground">正常运行</p>
              </div>
              <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2"></div>
                <p className="text-sm font-medium">存储服务</p>
                <p className="text-xs text-muted-foreground">正常运行</p>
              </div>
              <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2"></div>
                <p className="text-sm font-medium">API服务</p>
                <p className="text-xs text-muted-foreground">正常运行</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
