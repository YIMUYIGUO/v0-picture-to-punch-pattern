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
import { Search, Edit, UserCheck, User, Shield } from "lucide-react"
import { toast } from "sonner"

interface UserManagementProps {
  isSuperAdmin: boolean
}

interface UserProfile {
  id: string
  email: string
  display_name: string | null
  role: "user" | "admin" | "super_admin"
  created_at: string
  updated_at: string
}

export function UserManagement({ isSuperAdmin }: UserManagementProps) {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null)
  const [newRole, setNewRole] = useState<string>("")

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users")
      const result = await response.json()

      if (result.success) {
        setUsers(result.data)
      } else {
        toast.error("获取用户列表失败")
      }
    } catch (error) {
      toast.error("网络错误")
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateRole = async () => {
    if (!editingUser || !newRole) return

    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: editingUser.id,
          role: newRole,
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success("用户角色更新成功")
        setUsers(users.map((user) => (user.id === editingUser.id ? { ...user, role: newRole as any } : user)))
        setEditingUser(null)
        setNewRole("")
      } else {
        toast.error(result.error || "更新失败")
      }
    } catch (error) {
      toast.error("网络错误")
    }
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
    const matchesRole = roleFilter === "all" || user.role === roleFilter
    return matchesSearch && matchesRole
  })

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "super_admin":
        return <Shield className="w-4 h-4" />
      case "admin":
        return <UserCheck className="w-4 h-4" />
      default:
        return <User className="w-4 h-4" />
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "super_admin":
        return <Badge variant="default">超级管理员</Badge>
      case "admin":
        return <Badge variant="secondary">管理员</Badge>
      default:
        return <Badge variant="outline">普通用户</Badge>
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="h-8 bg-muted rounded"></div>
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
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
        <h1 className="text-3xl font-bold text-foreground">用户管理</h1>
        <p className="text-muted-foreground">管理系统中的所有用户账户和权限</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>用户列表</CardTitle>
          <CardDescription>查看和管理所有注册用户</CardDescription>
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
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="筛选角色" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有角色</SelectItem>
                <SelectItem value="user">普通用户</SelectItem>
                <SelectItem value="admin">管理员</SelectItem>
                <SelectItem value="super_admin">超级管理员</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Users Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>用户信息</TableHead>
                  <TableHead>角色</TableHead>
                  <TableHead>注册时间</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{user.display_name || "未设置昵称"}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getRoleIcon(user.role)}
                        {getRoleBadge(user.role)}
                      </div>
                    </TableCell>
                    <TableCell>{new Date(user.created_at).toLocaleDateString("zh-CN")}</TableCell>
                    <TableCell>
                      {isSuperAdmin && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingUser(user)
                                setNewRole(user.role)
                              }}
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              编辑
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>编辑用户角色</DialogTitle>
                              <DialogDescription>修改用户 {user.email} 的系统角色</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="role">用户角色</Label>
                                <Select value={newRole} onValueChange={setNewRole}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="user">普通用户</SelectItem>
                                    <SelectItem value="admin">管理员</SelectItem>
                                    <SelectItem value="super_admin">超级管理员</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setEditingUser(null)}>
                                取消
                              </Button>
                              <Button onClick={handleUpdateRole}>保存更改</Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">没有找到匹配的用户</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
