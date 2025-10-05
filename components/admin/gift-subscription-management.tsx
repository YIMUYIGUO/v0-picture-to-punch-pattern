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
import { Textarea } from "@/components/ui/textarea"
import { Search, Gift, Plus, Copy, Calendar, Mail, RefreshCw } from "lucide-react"
import { toast } from "sonner"

interface GiftSubscription {
  id: string
  gift_code: string
  plan_type: string
  status: string
  recipient_email?: string
  recipient_user_id?: string
  redeemed_at?: string
  expires_at: string
  notes?: string
  amount?: number
  created_at: string
  created_by?: string
  profiles?: {
    display_name: string
    email: string
  }
}

interface GiftStats {
  totalGifts: number
  activeGifts: number
  redeemedGifts: number
  expiredGifts: number
  totalValue: number
}

export function GiftSubscriptionManagement() {
  const [gifts, setGifts] = useState<GiftSubscription[]>([])
  const [stats, setStats] = useState<GiftStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [planFilter, setPlanFilter] = useState<string>("all")

  // Create gift dialog state
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [createForm, setCreateForm] = useState({
    plan_type: "monthly",
    recipient_email: "",
    notes: "",
    expires_days: "30",
  })

  useEffect(() => {
    fetchGiftData()
  }, [])

  const fetchGiftData = async () => {
    try {
      const response = await fetch("/api/admin/gift-subscriptions")
      const result = await response.json()

      if (result.success) {
        setGifts(result.data.gifts)
        setStats(result.data.stats)
      } else {
        toast.error("获取礼品订阅数据失败")
      }
    } catch (error) {
      toast.error("网络错误")
    } finally {
      setLoading(false)
    }
  }

  const createGiftSubscription = async () => {
    try {
      const response = await fetch("/api/admin/gift-subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan_type: createForm.plan_type,
          recipient_email: createForm.recipient_email || null,
          notes: createForm.notes || null,
          expires_days: Number.parseInt(createForm.expires_days),
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success(`礼品订阅创建成功！礼品码：${result.data.gift_code}`)
        await fetchGiftData()
        setShowCreateDialog(false)
        setCreateForm({
          plan_type: "monthly",
          recipient_email: "",
          notes: "",
          expires_days: "30",
        })
      } else {
        toast.error(result.error || "创建礼品订阅失败")
      }
    } catch (error) {
      toast.error("网络错误")
    }
  }

  const copyGiftCode = (giftCode: string) => {
    navigator.clipboard.writeText(giftCode)
    toast.success("礼品码已复制到剪贴板")
  }

  const cancelGift = async (giftId: string) => {
    try {
      const response = await fetch("/api/admin/gift-subscriptions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gift_id: giftId,
          action: "cancel",
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success("礼品订阅已取消")
        await fetchGiftData()
      } else {
        toast.error(result.error || "取消礼品订阅失败")
      }
    } catch (error) {
      toast.error("网络错误")
    }
  }

  const getPlanDisplayName = (planType: string) => {
    switch (planType) {
      case "monthly":
        return "包月"
      case "yearly":
        return "包年"
      default:
        return "未知"
    }
  }

  const getStatusDisplayName = (status: string) => {
    switch (status) {
      case "active":
        return "有效"
      case "redeemed":
        return "已兑换"
      case "expired":
        return "已过期"
      case "cancelled":
        return "已取消"
      default:
        return "未知"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "redeemed":
        return "bg-blue-100 text-blue-800"
      case "expired":
        return "bg-gray-100 text-gray-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const filteredGifts = gifts.filter((gift) => {
    const matchesSearch =
      gift.gift_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (gift.recipient_email && gift.recipient_email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (gift.notes && gift.notes.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesStatus = statusFilter === "all" || gift.status === statusFilter
    const matchesPlan = planFilter === "all" || gift.plan_type === planFilter

    return matchesSearch && matchesStatus && matchesPlan
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">礼品订阅管理</h1>
          <p className="text-muted-foreground">创建和管理礼品订阅码</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              创建礼品订阅
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>创建礼品订阅</DialogTitle>
              <DialogDescription>创建一个新的礼品订阅码，可以赠送给其他用户</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="plan_type">订阅类型</Label>
                <Select
                  value={createForm.plan_type}
                  onValueChange={(value) => setCreateForm((prev) => ({ ...prev, plan_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择订阅类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">包月订阅</SelectItem>
                    <SelectItem value="yearly">包年订阅</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="recipient_email">收件人邮箱（可选）</Label>
                <Input
                  id="recipient_email"
                  type="email"
                  value={createForm.recipient_email}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, recipient_email: e.target.value }))}
                  placeholder="指定收件人邮箱，留空则任何人都可兑换"
                />
              </div>

              <div>
                <Label htmlFor="expires_days">有效期（天）</Label>
                <Input
                  id="expires_days"
                  type="number"
                  value={createForm.expires_days}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, expires_days: e.target.value }))}
                  placeholder="礼品码有效期"
                  min="1"
                  max="365"
                />
              </div>

              <div>
                <Label htmlFor="notes">备注（可选）</Label>
                <Textarea
                  id="notes"
                  value={createForm.notes}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, notes: e.target.value }))}
                  placeholder="添加备注信息"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                取消
              </Button>
              <Button onClick={createGiftSubscription}>创建礼品订阅</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">总礼品数</CardTitle>
              <Gift className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalGifts}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">有效礼品</CardTitle>
              <Gift className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.activeGifts}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">已兑换</CardTitle>
              <Gift className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.redeemedGifts}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">已过期</CardTitle>
              <Gift className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">{stats.expiredGifts}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">总价值</CardTitle>
              <Gift className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">¥{stats.totalValue}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>礼品订阅列表</CardTitle>
              <CardDescription>管理所有礼品订阅码</CardDescription>
            </div>
            <Button onClick={fetchGiftData} variant="outline" size="sm">
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
                placeholder="搜索礼品码、邮箱或备注..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue placeholder="状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有状态</SelectItem>
                <SelectItem value="active">有效</SelectItem>
                <SelectItem value="redeemed">已兑换</SelectItem>
                <SelectItem value="expired">已过期</SelectItem>
                <SelectItem value="cancelled">已取消</SelectItem>
              </SelectContent>
            </Select>
            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue placeholder="类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有类型</SelectItem>
                <SelectItem value="monthly">包月</SelectItem>
                <SelectItem value="yearly">包年</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Gifts Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>礼品码</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>收件人</TableHead>
                  <TableHead>过期时间</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGifts.map((gift) => (
                  <TableRow key={gift.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <code className="bg-muted px-2 py-1 rounded text-sm font-mono">{gift.gift_code}</code>
                        <Button variant="ghost" size="sm" onClick={() => copyGiftCode(gift.gift_code)}>
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                      {gift.notes && <p className="text-xs text-muted-foreground mt-1">{gift.notes}</p>}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{getPlanDisplayName(gift.plan_type)}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(gift.status)}>{getStatusDisplayName(gift.status)}</Badge>
                    </TableCell>
                    <TableCell>
                      {gift.recipient_email ? (
                        <div className="flex items-center space-x-1 text-sm">
                          <Mail className="w-3 h-3" />
                          <span>{gift.recipient_email}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">任何人可兑换</span>
                      )}
                      {gift.redeemed_at && (
                        <p className="text-xs text-muted-foreground">
                          兑换时间: {new Date(gift.redeemed_at).toLocaleDateString("zh-CN")}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1 text-sm">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(gift.expires_at).toLocaleDateString("zh-CN")}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {gift.status === "active" && (
                        <Button variant="outline" size="sm" onClick={() => cancelGift(gift.id)}>
                          取消
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredGifts.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">没有找到匹配的礼品订阅</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
