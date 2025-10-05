"use client"

import { useEffect, useState } from "react"
import { useSession, signOut } from "next-auth/react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { CreditCard, LogOut, History, Shield } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface UserData {
  email: string
  isAdmin?: boolean
  subscription?: {
    planType: string
    monthlyGenerationsUsed: number
    monthlyGenerationsLimit: number
  }
}

export function UserMenu() {
  const { data: session, status } = useSession()
  const [user, setUser] = useState<UserData | null>(null)
  const router = useRouter()

  useEffect(() => {
    async function fetchUserData() {
      if (!session?.user) return

      try {
        // 获取订阅信息
        const response = await fetch("/api/subscription")
        const data = await response.json()

        setUser({
          email: session.user.email!,
          isAdmin: (session.user as any).role === "admin",
          subscription: data.success ? data.data : undefined,
        })
      } catch (error) {
        console.error("[v0] Error fetching user data:", error)
      }
    }

    fetchUserData()
  }, [session])

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    router.push("/auth/login")
  }

  if (status === "loading") {
    return <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
  }

  if (!session?.user || !user) {
    return null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="h-8 w-8 cursor-pointer hover:opacity-80 transition-opacity">
          <AvatarFallback className="bg-primary text-primary-foreground font-medium">
            {user.email.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <div className="flex flex-col space-y-1 p-2">
          <p className="text-sm font-medium leading-none">{user.email}</p>
          {user.subscription && (
            <p className="text-xs leading-none text-muted-foreground">
              {user.subscription.planType === "free"
                ? "免费用户"
                : user.subscription.planType === "monthly"
                  ? "包月用户"
                  : "包年用户"}
              ({user.subscription.monthlyGenerationsUsed}/{user.subscription.monthlyGenerationsLimit})
            </p>
          )}
          {user.isAdmin && <p className="text-xs leading-none text-emerald-600 font-medium">超级管理员</p>}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/history" className="flex items-center">
            <History className="mr-2 h-4 w-4" />
            <span>历史记录</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/subscription" className="flex items-center">
            <CreditCard className="mr-2 h-4 w-4" />
            <span>订阅管理</span>
          </Link>
        </DropdownMenuItem>
        {user.isAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/admin" className="flex items-center">
                <Shield className="mr-2 h-4 w-4" />
                <span>管理面板</span>
              </Link>
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>退出登录</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
