"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, Crown, Star } from "lucide-react"

interface SubscriptionCardProps {
  title: string
  price: string
  period: string
  description: string
  features: string[]
  isPopular?: boolean
  isCurrentPlan?: boolean
  planType?: "free" | "monthly" | "yearly"
  onSubscribe: () => void
}

export function SubscriptionCard({
  title,
  price,
  period,
  description,
  features,
  isPopular = false,
  isCurrentPlan = false,
  planType = "free",
  onSubscribe,
}: SubscriptionCardProps) {
  const getCardStyles = () => {
    switch (planType) {
      case "yearly":
        return {
          card: "relative border-2 border-yellow-400 bg-gradient-to-br from-yellow-50 via-amber-50 to-yellow-100 shadow-2xl transform hover:scale-105 transition-all duration-300 overflow-hidden",
          header: "bg-gradient-to-r from-yellow-400 to-amber-500 text-white -mx-6 -mt-6 px-6 pt-6 pb-4 mb-6",
          badge: "bg-yellow-500 text-white shadow-lg",
          icon: <Crown className="h-5 w-5 text-yellow-600" />,
          priceColor: "text-yellow-800",
          buttonStyle:
            "bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white shadow-lg",
        }
      case "monthly":
        return {
          card: "relative border-2 border-gray-400 bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100 shadow-xl transform hover:scale-105 transition-all duration-300 overflow-hidden",
          header: "bg-gradient-to-r from-gray-400 to-slate-500 text-white -mx-6 -mt-6 px-6 pt-6 pb-4 mb-6",
          badge: "bg-gray-500 text-white shadow-lg",
          icon: <Star className="h-5 w-5 text-gray-600" />,
          priceColor: "text-gray-800",
          buttonStyle:
            "bg-gradient-to-r from-gray-500 to-slate-600 hover:from-gray-600 hover:to-slate-700 text-white shadow-lg",
        }
      default:
        return {
          card: "relative border border-gray-200 overflow-hidden",
          header: "",
          badge: "bg-primary text-primary-foreground",
          icon: <Check className="h-4 w-4 text-green-500" />,
          priceColor: "text-foreground",
          buttonStyle: "",
        }
    }
  }

  const styles = getCardStyles()

  return (
    <Card className={styles.card}>
      {isPopular && (
        <Badge className={`absolute -top-3 left-1/2 -translate-x-1/2 ${styles.badge} px-4 py-1 text-sm font-semibold`}>
          {planType === "yearly" ? "🏆 最划算" : planType === "monthly" ? "⭐ 推荐" : "推荐"}
        </Badge>
      )}

      <CardHeader className={`text-center ${styles.header}`}>
        <div className="flex items-center justify-center gap-2 mb-2">
          {styles.icon}
          <CardTitle className={`text-2xl ${planType === "free" ? "" : "text-white"}`}>{title}</CardTitle>
        </div>
        <CardDescription className={planType === "free" ? "" : "text-white/90"}>{description}</CardDescription>
        <div className="mt-4">
          <span className={`text-4xl font-bold ${planType === "free" ? styles.priceColor : "text-white"}`}>
            {price}
          </span>
          <span className={`text-muted-foreground ${planType === "free" ? "" : "text-white/70"}`}>/{period}</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-2">
        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center gap-3">
              <div
                className={`rounded-full p-1 ${planType === "yearly" ? "bg-yellow-100" : planType === "monthly" ? "bg-gray-100" : "bg-green-50"}`}
              >
                <Check
                  className={`h-3 w-3 ${planType === "yearly" ? "text-yellow-600" : planType === "monthly" ? "text-gray-600" : "text-green-500"}`}
                />
              </div>
              <span className="text-sm font-medium">{feature}</span>
            </li>
          ))}
        </ul>

        <Button
          className={`w-full py-3 font-semibold ${styles.buttonStyle}`}
          onClick={onSubscribe}
          disabled={isCurrentPlan}
          variant={isCurrentPlan ? "secondary" : planType === "free" ? "default" : "default"}
        >
          {isCurrentPlan
            ? "当前计划"
            : planType === "yearly"
              ? "立即升级至金卡"
              : planType === "monthly"
                ? "立即升级至银卡"
                : "免费体验"}
        </Button>

        {planType === "yearly" && <p className="text-center text-xs text-yellow-700 font-medium">💰 相比包月节省60%</p>}
      </CardContent>
    </Card>
  )
}
