"use client"
import { useSubscription } from "@/hooks/use-subscription"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Crown, TrendingUp, Calendar, Download } from "lucide-react"
import { SimpleSubscriptionDialog } from "./simple-subscription-dialog"
import { useState } from "react"
import { useSystemSettings } from "@/hooks/use-system-settings"

export function UsageDashboard() {
  const { subscription, isLoading, getRemainingDownloads } = useSubscription()
  const [showSubscriptionDialog, setShowSubscriptionDialog] = useState(false)
  const { getFreeUserLimit } = useSystemSettings()

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-2 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-1/3"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const remainingDownloads = getRemainingDownloads()
  const usagePercentage = subscription
    ? (subscription.monthly_generations_used / subscription.monthly_generations_limit) * 100
    : 0

  const getPlanDisplayName = (planType: string) => {
    switch (planType) {
      case "free":
        return "免费版"
      case "pro":
        return "专业版"
      case "enterprise":
        return "企业版"
      default:
        return "未知计划"
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

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return "text-red-600"
    if (percentage >= 70) return "text-orange-600"
    return "text-green-600"
  }

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return "bg-red-500"
    if (percentage >= 70) return "bg-orange-500"
    return "bg-green-500"
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center space-x-2">
              <Crown className="w-5 h-5 text-yellow-500" />
              <span>订阅状态</span>
            </CardTitle>
            {subscription && (
              <Badge className={getPlanColor(subscription.plan_type)}>
                {getPlanDisplayName(subscription.plan_type)}
              </Badge>
            )}
          </div>
          <CardDescription>{subscription ? "管理您的订阅和使用情况" : "升级订阅以获得更多功能"}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {subscription ? (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center space-x-1">
                    <Download className="w-4 h-4" />
                    <span>本月下载次数</span>
                  </span>
                  <span className={getUsageColor(usagePercentage)}>
                    {subscription.monthly_generations_used} / {subscription.monthly_generations_limit}
                  </span>
                </div>
                <Progress
                  value={usagePercentage}
                  className="h-2"
                  style={{
                    background: `linear-gradient(to right, ${getProgressColor(usagePercentage)} ${usagePercentage}%, #e5e7eb ${usagePercentage}%)`,
                  }}
                />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>剩余: {remainingDownloads} 次</span>
                  <span>{usagePercentage.toFixed(1)}% 已使用</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-center space-x-1 text-sm text-muted-foreground mb-1">
                    <Calendar className="w-4 h-4" />
                    <span>到期时间</span>
                  </div>
                  <div className="text-sm font-medium">
                    {new Date(subscription.current_period_end).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-center space-x-1 text-sm text-muted-foreground mb-1">
                    <TrendingUp className="w-4 h-4" />
                    <span>状态</span>
                  </div>
                  <div className="text-sm font-medium">{subscription.status === "active" ? "活跃" : "已取消"}</div>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full bg-transparent"
                onClick={() => setShowSubscriptionDialog(true)}
              >
                管理订阅
              </Button>
            </>
          ) : (
            <div className="text-center space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">免费用户</p>
                <p className="text-xs text-muted-foreground">每月{getFreeUserLimit()}次免费下载</p>
              </div>
              <Button className="w-full" onClick={() => setShowSubscriptionDialog(true)}>
                <Crown className="w-4 h-4 mr-2" />
                升级订阅
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <SimpleSubscriptionDialog
        open={showSubscriptionDialog}
        onOpenChange={setShowSubscriptionDialog}
        reason={subscription ? "manage" : "upgrade"}
      />
    </>
  )
}
