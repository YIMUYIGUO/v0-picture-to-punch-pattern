"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, Settings, ImageIcon, Activity, TrendingUp, UserCheck, FileImage, DollarSign, Gift } from "lucide-react"
import { UserManagement } from "./user-management"
import { GalleryManagement } from "./gallery-management"
import { SystemSettings } from "./system-settings"
import { ActivityLog } from "./activity-log"
import { GiftSubscriptionManagement } from "./gift-subscription-management"

interface AdminDashboardProps {
  currentUser: any
  initialStats: {
    totalUsers: number
    adminUsers: number
    activeSubscriptions: number
    totalPatterns: number
  }
}

export function AdminDashboard({ currentUser, initialStats }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview")

  const isSuperAdmin = currentUser.profile?.role === "super_admin"

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 bg-sidebar border-r border-sidebar-border">
        <div className="p-6">
          <div className="flex items-center space-x-2 mb-6">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Settings className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-semibold text-sidebar-foreground">管理员面板</h2>
              <p className="text-xs text-muted-foreground">系统管理</p>
            </div>
          </div>

          <div className="mb-4 p-3 bg-muted rounded-lg">
            <p className="text-sm font-medium text-foreground">
              {currentUser.profile?.display_name || currentUser.user.email}
            </p>
            <Badge variant={isSuperAdmin ? "default" : "secondary"} className="mt-1">
              {isSuperAdmin ? "超级管理员" : "管理员"}
            </Badge>
          </div>

          <nav className="space-y-2">
            <Button
              variant={activeTab === "overview" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("overview")}
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              概览
            </Button>
            <Button
              variant={activeTab === "users" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("users")}
            >
              <Users className="w-4 h-4 mr-2" />
              用户管理
            </Button>
            <Button
              variant={activeTab === "gallery" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("gallery")}
            >
              <ImageIcon className="w-4 h-4 mr-2" />
              作品广场
            </Button>
            <Button
              variant={activeTab === "gifts" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("gifts")}
            >
              <Gift className="w-4 h-4 mr-2" />
              礼品订阅
            </Button>
            {isSuperAdmin && (
              <Button
                variant={activeTab === "settings" ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("settings")}
              >
                <Settings className="w-4 h-4 mr-2" />
                系统设置
              </Button>
            )}
            <Button
              variant={activeTab === "activity" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("activity")}
            >
              <Activity className="w-4 h-4 mr-2" />
              操作日志
            </Button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">系统概览</h1>
              <p className="text-muted-foreground">查看系统运行状态和关键指标</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">总用户数</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-chart-1">{initialStats.totalUsers}</div>
                  <p className="text-xs text-muted-foreground">+12% 较上月</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">管理员数量</CardTitle>
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-chart-2">{initialStats.adminUsers}</div>
                  <p className="text-xs text-muted-foreground">包含超级管理员</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">活跃订阅</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-chart-3">{initialStats.activeSubscriptions}</div>
                  <p className="text-xs text-muted-foreground">通过兑换码激活</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">作品总数</CardTitle>
                  <FileImage className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-chart-4">{initialStats.totalPatterns}</div>
                  <p className="text-xs text-muted-foreground">+8% 较上月</p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>快速操作</CardTitle>
                <CardDescription>常用管理功能</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button
                    variant="outline"
                    className="h-20 flex-col bg-transparent"
                    onClick={() => setActiveTab("users")}
                  >
                    <Users className="w-6 h-6 mb-2" />
                    管理用户
                  </Button>
                  <Button
                    variant="outline"
                    className="h-20 flex-col bg-transparent"
                    onClick={() => setActiveTab("gallery")}
                  >
                    <ImageIcon className="w-6 h-6 mb-2" />
                    审核作品
                  </Button>
                  <Button
                    variant="outline"
                    className="h-20 flex-col bg-transparent"
                    onClick={() => setActiveTab("gifts")}
                  >
                    <Gift className="w-6 h-6 mb-2" />
                    礼品订阅
                  </Button>
                  {isSuperAdmin && (
                    <Button
                      variant="outline"
                      className="h-20 flex-col bg-transparent"
                      onClick={() => setActiveTab("settings")}
                    >
                      <Settings className="w-6 h-6 mb-2" />
                      系统设置
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "users" && <UserManagement isSuperAdmin={isSuperAdmin} />}
        {activeTab === "gallery" && <GalleryManagement />}
        {activeTab === "gifts" && <GiftSubscriptionManagement />}
        {activeTab === "settings" && isSuperAdmin && <SystemSettings />}
        {activeTab === "activity" && <ActivityLog />}
      </div>
    </div>
  )
}
