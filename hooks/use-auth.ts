"use client"

import { useSession } from "next-auth/react"
import { useMemo } from "react"

export function useAuth() {
  const sessionResult = useSession()
  const session = sessionResult?.data ?? null
  const status = sessionResult?.status ?? "loading"

  const user = useMemo(() => {
    if (!session?.user) return null

    // 将 NextAuth 的 user 格式转换为应用期望的格式
    return {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      image: session.user.image,
    }
  }, [session])

  const loading = status === "loading"

  return { user, loading }
}
