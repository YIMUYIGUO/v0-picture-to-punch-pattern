import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, Home } from "lucide-react"

export default function SignUpSuccessPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <div className="flex items-center">
            <Link
              href="/"
              className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回首页
            </Link>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">感谢您的注册！</CardTitle>
              <CardDescription>请检查您的邮箱确认账户</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">您已成功注册。请检查您的邮箱并确认账户后再登录。</p>

              <div className="flex gap-2">
                <Button asChild variant="outline" className="flex-1 bg-transparent">
                  <Link href="/">
                    <Home className="w-4 h-4 mr-2" />
                    返回首页
                  </Link>
                </Button>
                <Button asChild className="flex-1">
                  <Link href="/auth/login">去登录</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
