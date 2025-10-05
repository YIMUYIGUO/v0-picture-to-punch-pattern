"use client"

import { User, LogIn, Crown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { UserMenu } from "./user-menu"
import { useSession } from "next-auth/react"
import Link from "next/link"

export function Header() {
  const { data: session, status } = useSession()
  const loading = status === "loading"
  const user = session?.user

  return (
    <header className="border-b bg-card">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-sm flex items-center justify-center">
                <div className="w-4 h-4 bg-primary-foreground rounded-full opacity-80" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">铝单板冲孔系统</h1>
                <p className="text-sm text-muted-foreground">Aluminum Panel Punch Hole System</p>
              </div>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <nav className="hidden md:flex items-center space-x-4">
              <Link
                href="/"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                首页
              </Link>
              <Link
                href="/gallery"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                作品广场
              </Link>
              {user && (
                <Link
                  href="/subscription"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center space-x-1"
                >
                  <Crown className="w-4 h-4" />
                  <span>升级订阅</span>
                </Link>
              )}
            </nav>

            <div className="flex items-center space-x-2">
              {loading ? (
                <div className="w-8 h-8 bg-muted rounded-full animate-pulse" />
              ) : user ? (
                <UserMenu />
              ) : (
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/auth/login">
                      <LogIn className="w-4 h-4 mr-2" />
                      登录
                    </Link>
                  </Button>
                  <Button size="sm" asChild>
                    <Link href="/auth/sign-up">
                      <User className="w-4 h-4 mr-2" />
                      注册
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
