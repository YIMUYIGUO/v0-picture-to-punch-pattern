"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Crown, Check, User, Gift } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { useSystemSettings } from "@/hooks/use-system-settings"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useSession } from "next-auth/react"

interface SimpleSubscriptionDialogProps {
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  reason?: "download_limit" | "upgrade" | "manage"
}

interface Subscription {
  id: string
  plan_type: string
  status: string
  monthly_generations_limit: number
  monthly_generations_used: number
  current_period_end: string | null
  amount: number
}

export function SimpleSubscriptionDialog({
  trigger,
  open,
  onOpenChange,
  reason = "upgrade",
}: SimpleSubscriptionDialogProps) {
  const [isOpen, setIsOpen] = useState(open || false)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [giftCode, setGiftCode] = useState("")
  const [isRedeeming, setIsRedeeming] = useState(false)
  const { getFreeUserLimit } = useSystemSettings()
  const { data: session } = useSession()

  const SUBSCRIPTION_PLANS = [
    {
      id: "free",
      name: "免费版",
      price: 0,
      monthly_generations: getFreeUserLimit(),
      features: [`每月${getFreeUserLimit()}次图案生成`, "基础图案分享", "标准导出格式"],
      popular: false,
    },
    {
      id: "monthly",
      name: "包月版",
      price: 29,
      monthly_generations: 100,
      features: ["每月100次图案生成", "高级图案分享", "所有导出格式", "优先客服支持", "批量处理功能"],
      popular: true,
    },
    {
      id: "yearly",
      name: "包年版",
      price: 299,
      monthly_generations: 1200,
      features: ["每年1200次图案生成", "无限图案分享", "所有导出格式", "专属客服支持", "API访问权限", "团队协作功能"],
      popular: false,
    },
  ]

  useEffect(() => {
    if (open !== undefined) {
      setIsOpen(open)
    }
  }, [open])

  useEffect(() => {
    if (isOpen) {
      fetchSubscription()
    }
  }, [isOpen])

  const handleOpenChange = (newOpen: boolean) => {
    setIsOpen(newOpen)
    onOpenChange?.(newOpen)
  }

  const fetchSubscription = async () => {
    try {
      if (!session?.user) return

      const response = await fetch("/api/subscription")
      const result = await response.json()

      if (result.success && result.data) {
        setSubscription(result.data)
      }
    } catch (error) {
      console.error("Error fetching subscription:", error)
    }
  }

  const handleActivateFree = async () => {
    setIsLoading(true)

    try {
      if (!session?.user) {
        toast.error("请先登录")
        return
      }

      const response = await fetch("/api/subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "create_free",
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success("免费版已激活！")
        await fetchSubscription()
        handleOpenChange(false)
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error("Activation error:", error)
      toast.error("激活失败，请重试")
    } finally {
      setIsLoading(false)
    }
  }

  const handlePurchaseSubscription = (planId: string) => {
    const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId)
    if (!plan) return

    toast.info(`正在跳转到支付页面购买${plan.name}...`)
    handleOpenChange(false)
  }

  const handleCancelSubscription = async () => {
    if (!subscription) return

    setIsLoading(true)
    try {
      const response = await fetch("/api/subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "cancel",
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success("订阅已取消")
        await fetchSubscription()
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error("Cancel subscription error:", error)
      toast.error("取消订阅失败")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRedeemGift = async () => {
    if (!giftCode.trim()) {
      toast.error("请输入兑换码")
      return
    }

    setIsRedeeming(true)
    try {
      const response = await fetch("/api/redeem-gift", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ giftCode: giftCode.trim() }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success(`兑换成功！已激活${result.data.planName}`)
        setGiftCode("")
        await fetchSubscription()
        handleOpenChange(false)
      } else {
        toast.error(result.error || "兑换失败")
      }
    } catch (error) {
      console.error("兑换错误:", error)
      toast.error("兑换失败，请重试")
    } finally {
      setIsRedeeming(false)
    }
  }

  const getReasonMessage = () => {
    switch (reason) {
      case "download_limit":
        return subscription
          ? "您的下载次数已用完，请联系管理员升级订阅"
          : `请先登录以获得${getFreeUserLimit()}次免费下载`
      case "manage":
        return "管理您的订阅计划"
      default:
        return "选择适合您的订阅计划"
    }
  }

  const currentPlan = subscription
    ? SUBSCRIPTION_PLANS.find((p) => p.id === subscription.plan_type)
    : SUBSCRIPTION_PLANS[0]

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Crown className="w-5 h-5 text-yellow-500" />
            <span>{subscription ? "订阅管理" : "登录以开始使用"}</span>
          </DialogTitle>
          <DialogDescription>{getReasonMessage()}</DialogDescription>
        </DialogHeader>

        {subscription && (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-lg">当前订阅</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold">{currentPlan?.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    本月已使用: {subscription.monthly_generations_used} / {subscription.monthly_generations_limit} 次
                  </p>
                  {subscription.current_period_end && (
                    <p className="text-xs text-muted-foreground">
                      到期时间: {new Date(subscription.current_period_end).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <Badge variant={subscription.status === "active" ? "default" : "secondary"}>
                    {subscription.status === "active"
                      ? "活跃"
                      : subscription.status === "expired"
                        ? "已过期"
                        : "已取消"}
                  </Badge>
                  {subscription.status === "active" && subscription.plan_type !== "free" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancelSubscription}
                      disabled={isLoading}
                      className="ml-2 bg-transparent"
                    >
                      取消订阅
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {!subscription && (
          <Card className="mb-4 border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-lg text-blue-800">需要登录</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-blue-700 mb-4">登录后即可获得{getFreeUserLimit()}次免费下载，无需付费即可开始使用！</p>
              <Button
                className="w-full"
                onClick={() => {
                  toast.info("请使用页面右上角的登录按钮")
                  handleOpenChange(false)
                }}
              >
                前往登录
              </Button>
            </CardContent>
          </Card>
        )}

        {!subscription && (
          <Card className="mb-4 border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-lg text-green-800 flex items-center gap-2">
                <Gift className="w-5 h-5" />
                有兑换码？
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-green-700 text-sm">如果您有礼品订阅兑换码，请在下方输入并兑换</p>
              <div className="flex gap-3">
                <div className="flex-1">
                  <Label htmlFor="gift-code-dialog" className="sr-only">
                    兑换码
                  </Label>
                  <Input
                    id="gift-code-dialog"
                    placeholder="请输入兑换码"
                    value={giftCode}
                    onChange={(e) => setGiftCode(e.target.value.toUpperCase())}
                    className="bg-white"
                    maxLength={20}
                  />
                </div>
                <Button
                  onClick={handleRedeemGift}
                  disabled={isRedeeming || !giftCode.trim()}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isRedeeming ? "兑换中..." : "兑换"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {SUBSCRIPTION_PLANS.map((plan) => (
            <Card key={plan.id} className={`relative ${plan.popular ? "border-primary" : ""}`}>
              {plan.popular && <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2">推荐</Badge>}
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {plan.name}
                  {currentPlan?.id === plan.id && <Badge variant="secondary">当前</Badge>}
                </CardTitle>
                <CardDescription>
                  <span className="text-2xl font-bold">¥{plan.price}</span>
                  {plan.price > 0 && <span className="text-sm">/月</span>}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-green-500" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                {currentPlan?.id !== plan.id && (
                  <Button
                    className="w-full"
                    onClick={() => {
                      if (plan.id === "free") {
                        handleActivateFree()
                      } else {
                        handlePurchaseSubscription(plan.id)
                      }
                    }}
                    disabled={isLoading}
                    variant={plan.popular ? "default" : "outline"}
                  >
                    {isLoading && plan.id === "free" ? (
                      <>
                        <User className="w-4 h-4 mr-2 animate-pulse" />
                        激活中...
                      </>
                    ) : (
                      <>
                        <User className="w-4 h-4 mr-2" />
                        {plan.price === 0 ? "激活免费版" : "立即购买"}
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
