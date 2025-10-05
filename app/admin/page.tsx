import { redirect } from "next/navigation"
import { getCurrentUser, isAdmin, getUserStats } from "@/lib/db"
import { AdminDashboard } from "@/components/admin/admin-dashboard"

export default async function AdminPage() {
  const currentUser = await getCurrentUser()

  if (!currentUser) {
    redirect("/auth/login")
  }

  if (!(await isAdmin())) {
    redirect("/")
  }

  const stats = await getUserStats()

  return (
    <div className="min-h-screen bg-background">
      <AdminDashboard currentUser={currentUser} initialStats={stats} />
    </div>
  )
}
