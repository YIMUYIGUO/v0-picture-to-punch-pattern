"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Activity, User, Settings, FileImage } from "lucide-react"
import { toast } from "sonner"

interface ActivityLogEntry {
  id: string
  action: string
  target_type: string | null
  target_id: string | null
  details: any
  created_at: string
  profiles: {
    display_name: string
    email: string
  }
}

export function ActivityLog() {
  const [activities, setActivities] = useState<ActivityLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [actionFilter, setActionFilter] = useState<string>("all")

  useEffect(() => {
    fetchActivities()
  }, [])

  const fetchActivities = async () => {
    try {
      const response = await fetch("/api/admin/activity")
      const result = await response.json()

      if (result.success) {
        setActivities(result.data)
      } else {
        toast.error("获取操作日志失败")
      }
    } catch (error) {
      toast.error("网络错误")
    } finally {
      setLoading(false)
    }
  }

  const getActionIcon = (action: string) => {
    if (action.includes("user")) return <User className="w-4 h-4" />
    if (action.includes("pattern")) return <FileImage className="w-4 h-4" />
    if (action.includes("setting")) return <Settings className="w-4 h-4" />
    return <Activity className="w-4 h-4" />
  }

  const getActionBadge = (action: string) => {
    const actionMap: {
      [key: string]: { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
    } = {
      update_user_role: { label: "更新用户角色", variant: "default" },
      approve_pattern: { label: "审核通过", variant: "default" },
      reject_pattern: { label: "审核拒绝", variant: "destructive" },
      update_system_setting: { label: "更新设置", variant: "secondary" },
    }

    const config = actionMap[action] || { label: action, variant: "outline" as const }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const filteredActivities = activities.filter((activity) => {
    const matchesSearch =
      activity.profiles.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.profiles.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.action.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesAction = actionFilter === "all" || activity.action === actionFilter

    return matchesSearch && matchesAction
  })

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="h-8 bg-muted rounded"></div>
            <div className="space-y-2">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-12 bg-muted rounded"></div>
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
        <h1 className="text-3xl font-bold text-foreground">操作日志</h1>
        <p className="text-muted-foreground">查看管理员的所有操作记录</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>活动记录</CardTitle>
          <CardDescription>系统中所有管理员操作的详细日志</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="搜索管理员或操作..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="筛选操作" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有操作</SelectItem>
                <SelectItem value="update_user_role">更新用户角色</SelectItem>
                <SelectItem value="approve_pattern">审核通过</SelectItem>
                <SelectItem value="reject_pattern">审核拒绝</SelectItem>
                <SelectItem value="update_system_setting">更新设置</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Activities Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>操作</TableHead>
                  <TableHead>管理员</TableHead>
                  <TableHead>目标</TableHead>
                  <TableHead>详情</TableHead>
                  <TableHead>时间</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredActivities.map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getActionIcon(activity.action)}
                        {getActionBadge(activity.action)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{activity.profiles.display_name}</p>
                        <p className="text-sm text-muted-foreground">{activity.profiles.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {activity.target_type && (
                        <Badge variant="outline">
                          {activity.target_type === "user" && "用户"}
                          {activity.target_type === "pattern" && "作品"}
                          {activity.target_type === "setting" && "设置"}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {activity.details && (
                        <div className="text-sm text-muted-foreground max-w-xs truncate">
                          {JSON.stringify(activity.details)}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{new Date(activity.created_at).toLocaleString("zh-CN")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredActivities.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">没有找到匹配的操作记录</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
