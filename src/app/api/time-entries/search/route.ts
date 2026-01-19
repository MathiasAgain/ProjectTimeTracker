import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Search time entries
export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q") || ""
    const projectId = searchParams.get("projectId")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const tags = searchParams.get("tags")?.split(",").filter(Boolean)
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100)

    // Build where clause
    const where: Record<string, unknown> = {
      userId: session.user.id
    }

    // Text search across activity, subtask, notes, description
    if (query) {
      where.OR = [
        { activity: { contains: query, mode: "insensitive" } },
        { subtask: { contains: query, mode: "insensitive" } },
        { notes: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } }
      ]
    }

    if (projectId) {
      where.projectId = projectId
    }

    if (startDate) {
      where.startTime = { ...((where.startTime as object) || {}), gte: new Date(startDate) }
    }

    if (endDate) {
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)
      where.startTime = { ...((where.startTime as object) || {}), lte: end }
    }

    if (tags && tags.length > 0) {
      where.tags = { hasSome: tags }
    }

    const entries = await prisma.timeEntry.findMany({
      where,
      include: {
        project: {
          select: { id: true, name: true, color: true }
        }
      },
      orderBy: { startTime: "desc" },
      take: limit
    })

    return NextResponse.json(entries)
  } catch (error) {
    console.error("Search entries error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
