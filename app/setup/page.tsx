import { AdminSetupButton } from "@/components/admin-setup-button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function SetupPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-md space-y-6">
        <div className="flex items-center">
          <Link
            href="/"
            className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回首页
          </Link>
        </div>

        <AdminSetupButton />

        <div className="text-center">
          <Link
            href="/auth/login"
            className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4"
          >
            设置完成后前往登录
          </Link>
        </div>
      </div>
    </div>
  )
}
