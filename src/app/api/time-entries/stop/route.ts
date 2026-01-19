import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Stop running timer
export async function POST() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Find running entry
    const runningEntry = await prisma.timeEntry.findFirst({
      where: {
        userId: session.user.id,
        endTime: null
      }
    })

    if (!runningEntry) {
      return NextResponse.json(
        { error: "No running timer found" },
        { status: 404 }
      )
    }

    const endTime = new Date()
    const duration = Math.floor(
      (endTime.getTime() - runningEntry.startTime.getTime()) / 1000
    )

    const entry = await prisma.timeEntry.update({
      where: { id: runningEntry.id },
      data: {
        endTime,
        duration
      },
      include: {
        project: {
          select: { id: true, name: true, color: true }
        }
      }
    })

    return NextResponse.json(entry)
  } catch (error) {
    console.error("Stop timer error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
