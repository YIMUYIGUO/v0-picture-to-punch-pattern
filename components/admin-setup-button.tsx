"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, CheckCircle, Settings } from "lucide-react"

export function AdminSetupButton() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleSetupAdmin = async () => {
    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/admin/setup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (response.ok) {
        setResult({ success: true, message: data.message })
      } else {
        setResult({ success: false, message: data.error || "Setup failed" })
      }
    } catch (error) {
      console.error("[v0] Admin setup error:", error)
      setResult({ success: false, message: "Network error occurred" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          管理员账号设置
        </CardTitle>
        <CardDescription>创建或重置默认管理员账号</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          <p>
            <strong>邮箱:</strong> admin@example.com
          </p>
          <p>
            <strong>密码:</strong> 123456
          </p>
        </div>

        <Button onClick={handleSetupAdmin} disabled={isLoading} className="w-full">
          {isLoading ? "设置中..." : "设置管理员账号"}
        </Button>

        {result && (
          <div
            className={`flex items-center gap-2 p-3 rounded-md text-sm ${
              result.success
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {result.success ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {result.message}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
