"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, Users, TrendingUp, CreditCard } from "lucide-react"

interface RevenueData {
  monthlyRevenue: number
  paidUsers: number
  conversionRate: number
  averageOrder: number
  revenueGrowth: number
  userGrowth: number
  conversionGrowth: number
  orderGrowth: number
}

export function RevenueAnalytics() {
  const [data, setData] = useState<RevenueData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRevenueData()
  }, [])

  const fetchRevenueData = async () => {
    try {
      const response = await fetch("/api/admin/revenue")
      const result = await response.json()

      if (result.success) {
        setData(result.data)
      } else {
        console.error("Failed to fetch revenue data:", result.error)
        // 设置默认值以防API失败
        setData({
          monthlyRevenue: 0,
          paidUsers: 0,
          conversionRate: 0,
          averageOrder: 0,
          revenueGrowth: 0,
          userGrowth: 0,
          conversionGrowth: 0,
          orderGrowth: 0,
        })
      }
    } catch (error) {
      console.error("Error fetching revenue data:", error)
      // 设置默认值以防网络错误
      setData({
        monthlyRevenue: 0,
        paidUsers: 0,
        conversionRate: 0,
        averageOrder: 0,
        revenueGrowth: 0,
        userGrowth: 0,
        conversionGrowth: 0,
        orderGrowth: 0,
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-muted rounded w-1/2"></div>
                <div className="h-8 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">暂无收入数据</p>
        </CardContent>
      </Card>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("zh-CN", {
      style: "currency",
      currency: "CNY",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const formatGrowth = (growth: number) => {
    const sign = growth >= 0 ? "+" : ""
    return `${sign}${growth.toFixed(1)}%`
  }

  const getGrowthColor = (growth: number) => {
    return growth >= 0 ? "text-green-600" : "text-red-600"
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">本月收入</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.monthlyRevenue)}</div>
            <p className={`text-xs ${getGrowthColor(data.revenueGrowth)}`}>{formatGrowth(data.revenueGrowth)} 较上月</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">付费用户</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.paidUsers}</div>
            <p className={`text-xs ${getGrowthColor(data.userGrowth)}`}>{formatGrowth(data.userGrowth)} 较上月</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">转化率</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.conversionRate.toFixed(1)}%</div>
            <p className={`text-xs ${getGrowthColor(data.conversionGrowth)}`}>
              {formatGrowth(data.conversionGrowth)} 较上月
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均订单</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.averageOrder)}</div>
            <p className={`text-xs ${getGrowthColor(data.orderGrowth)}`}>{formatGrowth(data.orderGrowth)} 较上月</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>收入详情</CardTitle>
          <CardDescription>基于真实订单数据的收入分析</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium mb-2">本月订阅分布</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>专业版 (月付):</span>
                    <span className="font-medium">计算中...</span>
                  </div>
                  <div className="flex justify-between">
                    <span>企业版 (年付):</span>
                    <span className="font-medium">计算中...</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium mb-2">支付方式分布</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>虎皮椒支付:</span>
                    <span className="font-medium">计算中...</span>
                  </div>
                  <div className="flex justify-between">
                    <span>支付宝直连:</span>
                    <span className="font-medium">计算中...</span>
                  </div>
                </div>
              </div>
            </div>

            {data.monthlyRevenue === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>暂无收入数据</p>
                <p className="text-sm">用户完成首次付费后，这里将显示详细的收入分析</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  )
}
