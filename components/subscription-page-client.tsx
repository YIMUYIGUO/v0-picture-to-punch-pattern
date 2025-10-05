"use client"

import { useEffect, useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, User, Calendar, BarChart3, Gift, CheckCircle } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { useSystemSettings } from "@/hooks/use-system-settings"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface Subscription {
  id: string
  plan_type: string
  status: string
  monthly_generations_used: number
  monthly_generations_limit: number
  expires_at: string | null
}

export default function SubscriptionPageClient() {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [giftCode, setGiftCode] = useState("")
  const [isRedeeming, setIsRedeeming] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [successData, setSuccessData] = useState<{
    planName: string
    planType: string
  } | null>(null)

  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()
  const { getFreeUserLimit, getMaxPanelSize } = useSystemSettings()

  const fetchSubscription = useCallback(async () => {
    console.log("[v0] Fetching user subscription...")

    if (!session?.user) {
      console.log("[v0] No authenticated user, using guest mode")
      setLoading(false)
      return
    }

    try {
      const response = await fetch("/api/subscription")
      const data = await response.json()

      if (data.subscription) {
        console.log("[v0] Subscription loaded:", data.subscription.planType)
        setSubscription(data.subscription)
      } else {
        setSubscription(null)
      }
    } catch (error) {
      console.error("Error fetching subscription:", error)
    }
    setLoading(false)
  }, [session])

  useEffect(() => {
    if (status !== "loading") {
      fetchSubscription()
    }
  }, [fetchSubscription, status])

  const handleCreateFreeSubscription = async () => {
    if (!session?.user) {
      router.push("/auth/login")
      return
    }

    const confirmed = window.confirm("确认开始免费体验？")
    if (!confirmed) return

    try {
      console.log("[v0] Creating free subscription...")
      const response = await fetch("/api/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create_free" }),
      })

      const result = await response.json()
      console.log("[v0] Free subscription result:", result)

      if (result.success) {
        toast.success("免费体验已开始！")
        fetchSubscription()
      } else {
        toast.error(result.error || "订阅失败")
      }
    } catch (error) {
      console.error("[v0] Subscription error:", error)
      toast.error("订阅失败，请重试")
    }
  }

  const handleRedeemGift = async () => {
    if (!giftCode.trim()) {
      toast.error("请输入兑换码")
      return
    }

    if (!session?.user) {
      toast.error("请先登录")
      router.push("/auth/login")
      return
    }

    setIsRedeeming(true)
    try {
      const response = await fetch("/api/redeem-gift", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ giftCode: giftCode.trim() }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setSuccessData({
          planName: result.data.planName,
          planType: result.data.planType,
        })
        setShowSuccessDialog(true)
        setGiftCode("")
        fetchSubscription()
      } else {
        if (result.code === "SAME_LEVEL_UPGRADE") {
          const confirmUpgrade = window.confirm(
            `${result.error}\n\n如需升级，请联系管理员获取包年版兑换码。\n\n点击确定了解更多升级信息。`,
          )
          if (confirmUpgrade) {
            toast.info("请联系管理员获取包年版兑换码进行升级")
          }
        } else {
          toast.error(result.error || "兑换失败")
        }
      }
    } catch (error) {
      console.error("兑换错误:", error)
      toast.error("网络错误，请重试")
    } finally {
      setIsRedeeming(false)
    }
  }

  const getPlanName = (planType: string) => {
    switch (planType) {
      case "free":
        return "免费版"
      case "monthly":
        return "包月版"
      case "yearly":
        return "包年版"
      default:
        return planType
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">加载中...</div>
  }

  const displaySubscription = subscription || {
    plan_type: "guest",
    monthly_generations_used: 0,
    monthly_generations_limit: getFreeUserLimit(),
    expires_at: null,
  }

  const usageCount = displaySubscription.monthly_generations_used ?? 0
  const usageLimit = displaySubscription.monthly_generations_limit ?? getFreeUserLimit()

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <Link href="/">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回主页
          </Button>
        </Link>
        <h1 className="text-2xl font-bold mb-2">订阅管理</h1>
        <p className="text-muted-foreground">管理您的订阅计划和使用情况</p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {subscription ? "当前订阅" : "使用情况"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">计划类型</p>
                <p className="font-medium">{subscription ? getPlanName(subscription.plan_type) : "未订阅"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <BarChart3 className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">使用次数</p>
                <p className="font-medium text-lg">
                  {usageCount} / {usageLimit}
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{
                      width: `${Math.min((usageCount / usageLimit) * 100, 100)}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Calendar className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">到期时间</p>
                <p className="font-medium">
                  {subscription?.expires_at
                    ? new Date(subscription.expires_at).toLocaleDateString("zh-CN")
                    : subscription
                      ? "永不过期"
                      : "未订阅"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <h2 className="text-xl font-semibold">兑换码订阅</h2>
        <p className="text-muted-foreground">所有订阅均通过兑换码激活，请联系管理员获取兑换码</p>

        <Card className="border-green-200 bg-green-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <Gift className="h-5 w-5" />
              兑换订阅
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-green-700">输入您的兑换码来激活订阅计划</p>
            <div className="flex gap-3">
              <div className="flex-1">
                <Label htmlFor="gift-code" className="sr-only">
                  兑换码
                </Label>
                <Input
                  id="gift-code"
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card
            className={`flex flex-col ${
              subscription?.plan_type === "free" ? "border-blue-500 bg-blue-50/50" : "hover:shadow-md transition-shadow"
            }`}
          >
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">免费版</h3>
                {subscription?.plan_type === "free" && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">当前</span>
                )}
              </div>
              <div className="text-2xl font-bold">免费体验</div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div className="flex-1 space-y-4">
                <p className="text-sm text-muted-foreground">新用户专享免费体验</p>
                <ul className="text-sm space-y-2">
                  <li className="flex items-center gap-2">
                    <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                    {getFreeUserLimit()}次免费使用
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                    面板尺寸限制：{getMaxPanelSize("free")}×{getMaxPanelSize("free")}
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                    基础冲孔功能
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                    DXF文件导出
                  </li>
                </ul>
              </div>
              {subscription?.plan_type !== "free" && (
                <Button className="w-full mt-4 bg-transparent" variant="outline" onClick={handleCreateFreeSubscription}>
                  开始免费体验
                </Button>
              )}
            </CardContent>
          </Card>

          <Card
            className={`flex flex-col ${
              subscription?.plan_type === "monthly"
                ? "border-blue-500 bg-blue-50/50"
                : "hover:shadow-md transition-shadow"
            }`}
          >
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">包月版</h3>
                {subscription?.plan_type === "monthly" && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">当前</span>
                )}
              </div>
              <div className="text-2xl font-bold">需要兑换码</div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div className="flex-1 space-y-4">
                <p className="text-sm text-muted-foreground">适合个人用户的精选方案</p>
                <ul className="text-sm space-y-2">
                  <li className="flex items-center gap-2">
                    <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                    50次使用额度
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                    无面板尺寸限制
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                    全部冲孔功能
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                    优先客服支持
                  </li>
                </ul>
              </div>
              <div className="mt-4 p-3 bg-gray-50 rounded-lg text-center">
                <p className="text-sm text-muted-foreground">请使用兑换码激活此计划</p>
              </div>
            </CardContent>
          </Card>

          <Card
            className={`flex flex-col ${
              subscription?.plan_type === "yearly"
                ? "border-blue-500 bg-blue-50/50"
                : "hover:shadow-md transition-shadow border-green-200"
            }`}
          >
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold">包年版</h3>
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">推荐</span>
                </div>
                {subscription?.plan_type === "yearly" && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">当前</span>
                )}
              </div>
              <div className="text-2xl font-bold">需要兑换码</div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div className="flex-1 space-y-4">
                <p className="text-sm text-muted-foreground">专业用户的终极选择</p>
                <ul className="text-sm space-y-2">
                  <li className="flex items-center gap-2">
                    <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                    1000次使用额度
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                    无面板尺寸限制
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                    全部冲孔功能
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                    VIP专属客服
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                    新功能抢先体验
                  </li>
                </ul>
              </div>
              <div className="mt-4 p-3 bg-gray-50 rounded-lg text-center">
                <p className="text-sm text-muted-foreground">请使用兑换码激活此计划</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-green-100 rounded-full">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <DialogTitle className="text-center text-xl font-semibold text-green-800">兑换成功！</DialogTitle>
            <DialogDescription className="text-center space-y-2">
              <p className="text-lg font-medium text-gray-900">恭喜您成功激活了{successData?.planName}</p>
              <p className="text-sm text-gray-600">
                您现在可以享受{successData?.planType === "monthly" ? "50次" : "1000次"}的使用额度
              </p>
              <p className="text-sm text-gray-500">页面将自动刷新以显示最新的订阅信息</p>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center mt-6">
            <Button onClick={() => setShowSuccessDialog(false)} className="bg-green-600 hover:bg-green-700">
              确定
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
