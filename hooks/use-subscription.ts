"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useSession } from "next-auth/react"

interface Subscription {
  id: string
  plan_type: string
  status: string
  monthly_generations_limit: number
  monthly_generations_used: number
  current_period_end: string | null
  amount: number
}

let globalSubscriptionCache: Subscription | null = null
let globalSubscriptionPromise: Promise<Subscription | null> | null = null

export function useSubscription() {
  const [subscription, setSubscription] = useState<Subscription | null>(globalSubscriptionCache)
  const [isLoading, setIsLoading] = useState(!globalSubscriptionCache)
  const [error, setError] = useState<string | null>(null)
  const hasFetched = useRef(false)

  const { data: session, status } = useSession()

  useEffect(() => {
    let isMounted = true

    const loadSubscription = async () => {
      if (status === "loading") {
        return
      }

      if (globalSubscriptionCache && !hasFetched.current) {
        setSubscription(globalSubscriptionCache)
        setIsLoading(false)
        return
      }

      if (hasFetched.current) return
      hasFetched.current = true

      try {
        if (globalSubscriptionPromise) {
          const cachedSubscription = await globalSubscriptionPromise
          if (isMounted) {
            setSubscription(cachedSubscription)
            setIsLoading(false)
          }
          return
        }

        setIsLoading(true)
        console.log("[v0] Fetching user subscription...")

        globalSubscriptionPromise = (async () => {
          if (!session?.user) {
            console.log("[v0] No authenticated user, using guest mode")
            return null
          }

          const response = await fetch("/api/subscription")
          const result = await response.json()

          if (result.success) {
            const subscriptionData = result.data
            globalSubscriptionCache = subscriptionData
            console.log("[v0] Subscription loaded and cached:", subscriptionData ? subscriptionData.plan_type : "none")
            return subscriptionData
          } else {
            throw new Error(result.error || "Failed to fetch subscription")
          }
        })()

        const subscriptionData = await globalSubscriptionPromise

        if (isMounted) {
          setSubscription(subscriptionData)
          setError(null)
          setIsLoading(false)
        }
      } catch (err) {
        console.error("[v0] Error fetching subscription:", err)
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to fetch subscription")
          setIsLoading(false)
        }
        globalSubscriptionPromise = null
      }
    }

    loadSubscription()

    return () => {
      isMounted = false
    }
  }, [session, status])

  const fetchSubscription = useCallback(async () => {
    try {
      setIsLoading(true)
      console.log("[v0] Manually fetching user subscription...")

      globalSubscriptionCache = null
      globalSubscriptionPromise = null

      if (!session?.user) {
        console.log("[v0] No authenticated user, using guest mode")
        setSubscription(null)
        setError(null)
        setIsLoading(false)
        return
      }

      const response = await fetch("/api/subscription")
      const result = await response.json()

      if (result.success) {
        const subscriptionData = result.data
        globalSubscriptionCache = subscriptionData
        setSubscription(subscriptionData)
        setError(null)
        console.log("[v0] Subscription refreshed:", subscriptionData ? subscriptionData.plan_type : "none")
      } else {
        throw new Error(result.error || "Failed to fetch subscription")
      }
    } catch (err) {
      console.error("[v0] Error fetching subscription:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch subscription")
    } finally {
      setIsLoading(false)
    }
  }, [session])

  const canDownload = useCallback(() => {
    if (!subscription) {
      return false
    }

    if (subscription.status !== "active") {
      return false
    }

    if (subscription.current_period_end) {
      const now = new Date()
      const endDate = new Date(subscription.current_period_end)
      if (now > endDate) {
        return false
      }
    }

    return subscription.monthly_generations_used < subscription.monthly_generations_limit
  }, [subscription])

  const getRemainingDownloads = useCallback(() => {
    if (!subscription || !canDownload()) {
      return 0
    }

    return Math.max(0, subscription.monthly_generations_limit - subscription.monthly_generations_used)
  }, [subscription, canDownload])

  const isExpired = useCallback(() => {
    if (!subscription || !subscription.current_period_end) {
      return false
    }

    const now = new Date()
    const endDate = new Date(subscription.current_period_end)
    return now > endDate
  }, [subscription])

  const getDaysUntilExpiry = useCallback(() => {
    if (!subscription || !subscription.current_period_end) {
      return null
    }

    const now = new Date()
    const endDate = new Date(subscription.current_period_end)
    const diffTime = endDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    return diffDays > 0 ? diffDays : 0
  }, [subscription])

  const incrementUsage = useCallback(async () => {
    console.log("[v0] Starting usage increment...")

    if (!session?.user) {
      console.log("[v0] Guest user cannot download - login required")
      return false
    }

    if (!canDownload()) {
      console.log("[v0] Cannot download - subscription limit reached or expired")
      return false
    }

    try {
      const response = await fetch("/api/subscription/increment", {
        method: "POST",
      })

      const result = await response.json()

      if (result.success) {
        globalSubscriptionCache = result.data
        setSubscription(result.data)
        console.log("[v0] Usage count incremented successfully:", result.data.monthly_generations_used)
        return true
      } else {
        console.error("[v0] Error incrementing usage:", result.error)
        return false
      }
    } catch (err) {
      console.error("[v0] Error incrementing usage:", err)
      return false
    }
  }, [session, canDownload])

  const createFreeSubscription = useCallback(async () => {
    try {
      const response = await fetch("/api/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create_free" }),
      })

      const result = await response.json()

      if (result.success) {
        await fetchSubscription()
        return true
      } else {
        setError(result.error)
        return false
      }
    } catch (err) {
      console.error("[v0] Error creating free subscription:", err)
      setError("创建免费订阅失败")
      return false
    }
  }, [fetchSubscription])

  const cancelSubscription = useCallback(async () => {
    try {
      const response = await fetch("/api/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      })

      const result = await response.json()

      if (result.success) {
        await fetchSubscription()
        return true
      } else {
        setError(result.error)
        return false
      }
    } catch (err) {
      console.error("[v0] Error cancelling subscription:", err)
      setError("取消订阅失败")
      return false
    }
  }, [fetchSubscription])

  return {
    subscription,
    isLoading,
    error,
    canDownload,
    getRemainingDownloads,
    incrementUsage,
    refetch: fetchSubscription,
    isExpired,
    getDaysUntilExpiry,
    createFreeSubscription,
    cancelSubscription,
  }
}
