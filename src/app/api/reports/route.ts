import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const projectId = searchParams.get("projectId")

    const where: Record<string, unknown> = {
      userId: session.user.id,
      endTime: { not: null }
    }

    if (startDate || endDate) {
      where.startTime = {}
      if (startDate) {
        (where.startTime as Record<string, Date>).gte = new Date(startDate)
      }
      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        ;(where.startTime as Record<string, Date>).lte = end
      }
    }

    if (projectId) {
      where.projectId = projectId
    }

    // Get all time entries
    const entries = await prisma.timeEntry.findMany({
      where,
      include: {
        project: {
          select: { id: true, name: true, color: true }
        }
      },
      orderBy: { startTime: "asc" }
    })

    // Calculate totals by project
    const projectTotals = entries.reduce((acc, entry) => {
      const key = entry.project.id
      if (!acc[key]) {
        acc[key] = {
          project: entry.project,
          totalDuration: 0,
          entryCount: 0
        }
      }
      acc[key].totalDuration += entry.duration || 0
      acc[key].entryCount += 1
      return acc
    }, {} as Record<string, { project: typeof entries[0]["project"]; totalDuration: number; entryCount: number }>)

    // Calculate daily totals
    const dailyTotals = entries.reduce((acc, entry) => {
      const date = new Date(entry.startTime).toISOString().split("T")[0]
      if (!acc[date]) {
        acc[date] = 0
      }
      acc[date] += entry.duration || 0
      return acc
    }, {} as Record<string, number>)

    // Convert to arrays
    const projectData = Object.values(projectTotals)
    const dailyData = Object.entries(dailyTotals)
      .map(([date, duration]) => ({ date, duration }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Calculate overall totals
    const totalDuration = entries.reduce((sum, e) => sum + (e.duration || 0), 0)
    const totalEntries = entries.length

    return NextResponse.json({
      projectData,
      dailyData,
      totalDuration,
      totalEntries
    })
  } catch (error) {
    console.error("Get reports error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
