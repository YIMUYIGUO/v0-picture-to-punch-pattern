"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Search, Settings, RefreshCw, Calendar, TrendingUp, Users, AlertTriangle } from "lucide-react"
import { toast } from "sonner"

interface UserSubscription {
  id: string
  plan_type: string
  status: string
  monthly_generations_limit: number
  monthly_generations_used: number
  current_period_end: string
  profiles: {
    id: string
    display_name: string
    email: string
  }
}

interface UsageStats {
  totalUsers: number
  freeUsers: number
  proUsers: number
  enterpriseUsers: number
  totalUsage: number
  averageUsage: number
  highUsageUsers: number
}

export function UserLimitsControl() {
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([])
  const [stats, setStats] = useState<UsageStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [planFilter, setPlanFilter] = useState<string>("all")
  const [selectedUser, setSelectedUser] = useState<UserSubscription | null>(null)
  const [actionType, setActionType] = useState<string>("")
  const [actionValue, setActionValue] = useState<string>("")

  useEffect(() => {
    fetchUsageData()
  }, [])

  const fetchUsageData = async () => {
    try {
      const response = await fetch("/api/admin/usage-limits")
      const result = await response.json()

      if (result.success) {
        setSubscriptions(result.data.subscriptions)
        setStats(result.data.stats)
      } else {
        toast.error("获取使用数据失败")
      }
    } catch (error) {
      toast.error("网络错误")
    } finally {
      setLoading(false)
    }
  }

  const handleUserAction = async () => {
    if (!selectedUser || !actionType) return

    try {
      const response = await fetch("/api/admin/usage-limits", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser.profiles.id,
          action: actionType,
          value: actionValue ? Number(actionValue) : undefined,
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success("操作成功")
        await fetchUsageData()
        setSelectedUser(null)
        setActionType("")
        setActionValue("")
      } else {
        toast.error(result.error || "操作失败")
      }
    } catch (error) {
      toast.error("网络错误")
    }
  }

  const getPlanDisplayName = (planType: string) => {
    switch (planType) {
      case "free":
        return "免费版"
      case "pro":
        return "专业版"
      case "enterprise":
        return "企业版"
      default:
        return "未知"
    }
  }

  const getPlanColor = (planType: string) => {
    switch (planType) {
      case "free":
        return "bg-gray-100 text-gray-800"
      case "pro":
        return "bg-blue-100 text-blue-800"
      case "enterprise":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getUsagePercentage = (used: number, limit: number) => {
    return limit > 0 ? (used / limit) * 100 : 0
  }

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return "text-red-600"
    if (percentage >= 70) return "text-orange-600"
    return "text-green-600"
  }

  const filteredSubscriptions = subscriptions.filter((sub) => {
    const matchesSearch =
      sub.profiles.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.profiles.email.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesPlan = planFilter === "all" || sub.plan_type === planFilter

    return matchesSearch && matchesPlan
  })

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-muted rounded"></div>
              ))}
            </div>
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
        <h1 className="text-3xl font-bold text-foreground">用户限制控制</h1>
        <p className="text-muted-foreground">管理用户的使用限制和订阅状态</p>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">总用户数</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                免费: {stats.freeUsers} | 专业: {stats.proUsers} | 企业: {stats.enterpriseUsers}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">总使用量</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsage}</div>
              <p className="text-xs text-muted-foreground">本月累计下载次数</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">平均使用量</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageUsage.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground">每用户平均下载次数</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">高使用用户</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.highUsageUsers}</div>
              <p className="text-xs text-muted-foreground">使用量超过80%的用户</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>用户使用情况</CardTitle>
              <CardDescription>查看和管理所有用户的使用限制</CardDescription>
            </div>
            <Button onClick={fetchUsageData} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              刷新
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="搜索用户邮箱或昵称..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="筛选计划" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有计划</SelectItem>
                <SelectItem value="free">免费版</SelectItem>
                <SelectItem value="pro">专业版</SelectItem>
                <SelectItem value="enterprise">企业版</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Users Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>用户信息</TableHead>
                  <TableHead>计划</TableHead>
                  <TableHead>使用情况</TableHead>
                  <TableHead>到期时间</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubscriptions.map((subscription) => {
                  const usagePercentage = getUsagePercentage(
                    subscription.monthly_generations_used,
                    subscription.monthly_generations_limit,
                  )
                  return (
                    <TableRow key={subscription.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{subscription.profiles.display_name || "未设置昵称"}</p>
                          <p className="text-sm text-muted-foreground">{subscription.profiles.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPlanColor(subscription.plan_type)}>
                          {getPlanDisplayName(subscription.plan_type)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className={getUsageColor(usagePercentage)}>
                              {subscription.monthly_generations_used} / {subscription.monthly_generations_limit}
                            </span>
                            <span className="text-xs text-muted-foreground">{usagePercentage.toFixed(1)}%</span>
                          </div>
                          <Progress value={usagePercentage} className="h-2" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1 text-sm">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(subscription.current_period_end).toLocaleDateString("zh-CN")}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedUser(subscription)
                                setActionType("")
                                setActionValue("")
                              }}
                            >
                              <Settings className="w-4 h-4 mr-1" />
                              管理
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>管理用户限制</DialogTitle>
                              <DialogDescription>
                                用户: {subscription.profiles.display_name} ({subscription.profiles.email})
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="action">操作类型</Label>
                                <Select value={actionType} onValueChange={setActionType}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="选择操作" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="reset_usage">重置本月使用量</SelectItem>
                                    <SelectItem value="update_limit">修改使用限制</SelectItem>
                                    <SelectItem value="extend_period">延长订阅期限</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              {actionType === "update_limit" && (
                                <div>
                                  <Label htmlFor="limit">新的使用限制</Label>
                                  <Input
                                    id="limit"
                                    type="number"
                                    value={actionValue}
                                    onChange={(e) => setActionValue(e.target.value)}
                                    placeholder="输入新的限制数量"
                                  />
                                </div>
                              )}

                              {actionType === "extend_period" && (
                                <div>
                                  <Label htmlFor="days">延长天数</Label>
                                  <Input
                                    id="days"
                                    type="number"
                                    value={actionValue}
                                    onChange={(e) => setActionValue(e.target.value)}
                                    placeholder="输入延长的天数"
                                  />
                                </div>
                              )}
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setSelectedUser(null)}>
                                取消
                              </Button>
                              <Button onClick={handleUserAction} disabled={!actionType}>
                                确认操作
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {filteredSubscriptions.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">没有找到匹配的用户</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
