import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Get active (running) time entry
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const activeEntry = await prisma.timeEntry.findFirst({
      where: {
        userId: session.user.id,
        endTime: null
      },
      include: {
        project: {
          select: { id: true, name: true, color: true }
        }
      }
    })

    return NextResponse.json(activeEntry)
  } catch (error) {
    console.error("Get active entry error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
