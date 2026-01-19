import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { formatDuration, formatDate } from "@/lib/utils"

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

    const entries = await prisma.timeEntry.findMany({
      where,
      include: {
        project: {
          select: { name: true }
        },
        task: {
          select: { name: true }
        }
      },
      orderBy: { startTime: "desc" }
    })

    // Generate CSV
    const headers = ["Date", "Project", "Task", "Description", "Start Time", "End Time", "Duration"]
    const rows = entries.map((entry) => [
      formatDate(new Date(entry.startTime)),
      entry.project.name,
      entry.task?.name || "",
      entry.description || "",
      new Date(entry.startTime).toLocaleTimeString(),
      entry.endTime ? new Date(entry.endTime).toLocaleTimeString() : "",
      formatDuration(entry.duration || 0)
    ])

    const csv = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      )
    ].join("\n")

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="time-report-${new Date().toISOString().split("T")[0]}.csv"`
      }
    })
  } catch (error) {
    console.error("Export report error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
