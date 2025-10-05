import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    // 中间件逻辑可以在这里添加
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // 公开路径不需要认证
        const publicPaths = ["/", "/auth/login", "/auth/sign-up", "/gallery"]
        const isPublicPath = publicPaths.some((path) => req.nextUrl.pathname.startsWith(path))

        if (isPublicPath) {
          return true
        }

        // 管理员路径需要管理员权限
        if (req.nextUrl.pathname.startsWith("/admin")) {
          return token?.role === "admin"
        }

        // 其他路径需要登录
        return !!token
      },
    },
  },
)

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
