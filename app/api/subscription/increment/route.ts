import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function POST() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get current subscription
    const subscription = await prisma.subscription.findFirst({
      where: {
        user_id: session.user.id,
        status: "active",
      },
    })

    if (!subscription) {
      return NextResponse.json({ error: "No active subscription found" }, { status: 404 })
    }

    // Check if limit reached
    if (subscription.monthly_generations_used >= subscription.monthly_generations_limit) {
      return NextResponse.json({ error: "Usage limit reached" }, { status: 403 })
    }

    // Increment usage
    const updatedSubscription = await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        monthly_generations_used: subscription.monthly_generations_used + 1,
      },
    })

    return NextResponse.json({
      success: true,
      data: updatedSubscription,
    })
  } catch (error) {
    console.error("Error incrementing usage:", error)
    return NextResponse.json({ error: "Failed to increment usage" }, { status: 500 })
  }
}
