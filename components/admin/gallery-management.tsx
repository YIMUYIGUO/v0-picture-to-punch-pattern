"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Search, Eye, Check, X, Heart, Trash2 } from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"

interface Pattern {
  id: string
  title: string
  description: string
  image_url: string
  is_public: boolean
  approval_status?: string
  approved_at?: string
  likes_count: number
  views_count: number
  created_at: string
  profiles: {
    display_name: string
    email: string
  }
}

export function GalleryManagement() {
  const [patterns, setPatterns] = useState<Pattern[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedPattern, setSelectedPattern] = useState<Pattern | null>(null)
  const [actionReason, setActionReason] = useState("")
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  useEffect(() => {
    fetchPatterns()
  }, [])

  const fetchPatterns = async () => {
    try {
      const response = await fetch("/api/admin/gallery")
      const result = await response.json()

      if (result.success) {
        setPatterns(result.data)
      } else {
        toast.error("获取作品列表失败")
      }
    } catch (error) {
      toast.error("网络错误")
    } finally {
      setLoading(false)
    }
  }

  const handlePatternAction = async (patternId: string, isPublic: boolean) => {
    try {
      const response = await fetch("/api/admin/gallery", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patternId,
          isPublic,
          reason: actionReason,
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success(isPublic ? "作品已通过审核" : "作品已被拒绝")
        setPatterns(
          patterns.map((pattern) =>
            pattern.id === patternId
              ? { ...pattern, is_public: isPublic, approval_status: isPublic ? "approved" : "rejected" }
              : pattern,
          ),
        )
        setSelectedPattern(null)
        setActionReason("")
      } else {
        toast.error(result.error || "操作失败")
      }
    } catch (error) {
      toast.error("网络错误")
    }
  }

  const handleDeletePattern = async (patternId: string) => {
    try {
      const response = await fetch("/api/admin/gallery", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patternId,
          reason: actionReason,
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success("作品已删除")
        setPatterns(patterns.filter((pattern) => pattern.id !== patternId))
        setSelectedPattern(null)
        setActionReason("")
        setDeleteConfirm(null)
      } else {
        toast.error(result.error || "删除失败")
      }
    } catch (error) {
      toast.error("网络错误")
    }
  }

  const filteredPatterns = patterns.filter((pattern) => {
    const matchesSearch =
      pattern.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pattern.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pattern.profiles.display_name.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "public" && pattern.is_public) ||
      (statusFilter === "private" && !pattern.is_public) ||
      (statusFilter === "pending" && pattern.approval_status === "pending") ||
      (statusFilter === "approved" && pattern.approval_status === "approved") ||
      (statusFilter === "rejected" && pattern.approval_status === "rejected")

    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="h-8 bg-muted rounded"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-muted rounded"></div>
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
        <h1 className="text-3xl font-bold text-foreground">作品广场管理</h1>
        <p className="text-muted-foreground">审核和管理用户上传的作品</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>作品列表</CardTitle>
          <CardDescription>查看和审核所有用户作品</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="搜索作品标题、描述或作者..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="筛选状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有状态</SelectItem>
                <SelectItem value="pending">待审核</SelectItem>
                <SelectItem value="approved">已通过</SelectItem>
                <SelectItem value="rejected">已拒绝</SelectItem>
                <SelectItem value="public">已发布</SelectItem>
                <SelectItem value="private">未发布</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Patterns Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPatterns.map((pattern) => (
              <Card key={pattern.id} className="overflow-hidden">
                <div className="aspect-video relative bg-muted">
                  {pattern.image_url ? (
                    <Image
                      src={pattern.image_url || "/placeholder.svg"}
                      alt={pattern.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <span className="text-muted-foreground">无预览图</span>
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <Badge
                      variant={
                        pattern.approval_status === "approved"
                          ? "default"
                          : pattern.approval_status === "pending"
                            ? "secondary"
                            : "destructive"
                      }
                    >
                      {pattern.approval_status === "approved"
                        ? "已通过"
                        : pattern.approval_status === "pending"
                          ? "待审核"
                          : pattern.approval_status === "rejected"
                            ? "已拒绝"
                            : pattern.is_public
                              ? "已发布"
                              : "未发布"}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-sm mb-1 line-clamp-1">{pattern.title}</h3>
                  <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{pattern.description}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                    <span>作者: {pattern.profiles.display_name}</span>
                    <span>{new Date(pattern.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs mb-3">
                    <div className="flex items-center space-x-3">
                      <span className="flex items-center">
                        <Heart className="w-3 h-3 mr-1" />
                        {pattern.likes_count}
                      </span>
                      <span className="flex items-center">
                        <Eye className="w-3 h-3 mr-1" />
                        {pattern.views_count}
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 bg-transparent"
                          onClick={() => setSelectedPattern(pattern)}
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          查看
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>{pattern.title}</DialogTitle>
                          <DialogDescription>
                            作者: {pattern.profiles.display_name} ({pattern.profiles.email})
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="aspect-video relative bg-muted rounded-lg overflow-hidden">
                            {pattern.image_url && (
                              <Image
                                src={pattern.image_url || "/placeholder.svg"}
                                alt={pattern.title}
                                fill
                                className="object-cover"
                              />
                            )}
                          </div>
                          <div>
                            <Label>作品描述</Label>
                            <p className="text-sm text-muted-foreground mt-1">{pattern.description}</p>
                          </div>
                          <div>
                            <Label>审核状态</Label>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge
                                variant={
                                  pattern.approval_status === "approved"
                                    ? "default"
                                    : pattern.approval_status === "pending"
                                      ? "secondary"
                                      : "destructive"
                                }
                              >
                                {pattern.approval_status === "approved"
                                  ? "已通过"
                                  : pattern.approval_status === "pending"
                                    ? "待审核"
                                    : "已拒绝"}
                              </Badge>
                              {pattern.approved_at && (
                                <span className="text-xs text-muted-foreground">
                                  审核时间: {new Date(pattern.approved_at).toLocaleString()}
                                </span>
                              )}
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="reason">操作原因 (可选)</Label>
                            <Textarea
                              id="reason"
                              placeholder="请输入审核意见..."
                              value={actionReason}
                              onChange={(e) => setActionReason(e.target.value)}
                              className="mt-1"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setSelectedPattern(null)
                              setActionReason("")
                              setDeleteConfirm(null)
                            }}
                          >
                            取消
                          </Button>
                          {deleteConfirm === pattern.id ? (
                            <Button variant="destructive" onClick={() => handleDeletePattern(pattern.id)}>
                              确认删除
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              onClick={() => setDeleteConfirm(pattern.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              删除作品
                            </Button>
                          )}
                          {pattern.approval_status !== "approved" && (
                            <Button
                              onClick={() => handlePatternAction(pattern.id, true)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Check className="w-4 h-4 mr-1" />
                              通过审核
                            </Button>
                          )}
                          {pattern.is_public && (
                            <Button variant="destructive" onClick={() => handlePatternAction(pattern.id, false)}>
                              <X className="w-4 h-4 mr-1" />
                              取消发布
                            </Button>
                          )}
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredPatterns.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">没有找到匹配的作品</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
