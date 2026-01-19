import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

interface BulkEntry {
  projectId: string
  activity?: string
  subtask?: string
  notes?: string
  tags?: string[]
  date: string
  duration: number // in seconds
  billable?: boolean
}

// Create multiple time entries at once
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { entries } = await request.json() as { entries: BulkEntry[] }

    if (!entries || !Array.isArray(entries) || entries.length === 0) {
      return NextResponse.json({ error: "No entries provided" }, { status: 400 })
    }

    if (entries.length > 50) {
      return NextResponse.json({ error: "Maximum 50 entries at once" }, { status: 400 })
    }

    // Verify user has access to all projects
    const projectIds = [...new Set(entries.map(e => e.projectId))]
    const projects = await prisma.project.findMany({
      where: {
        id: { in: projectIds },
        OR: [
          { ownerId: session.user.id },
          { members: { some: { userId: session.user.id } } }
        ]
      },
      select: { id: true }
    })

    const accessibleProjectIds = new Set(projects.map(p => p.id))
    const unauthorizedProjects = projectIds.filter(id => !accessibleProjectIds.has(id))

    if (unauthorizedProjects.length > 0) {
      return NextResponse.json(
        { error: "Not authorized for some projects" },
        { status: 403 }
      )
    }

    // Create all entries
    const createdEntries = await prisma.$transaction(
      entries.map(entry => {
        const startTime = new Date(entry.date)
        startTime.setHours(9, 0, 0, 0)
        const endTime = new Date(startTime.getTime() + entry.duration * 1000)

        return prisma.timeEntry.create({
          data: {
            activity: entry.activity,
            subtask: entry.subtask,
            notes: entry.notes,
            tags: entry.tags || [],
            startTime,
            endTime,
            duration: entry.duration,
            billable: entry.billable ?? true,
            userId: session.user.id,
            projectId: entry.projectId
          },
          include: {
            project: {
              select: { id: true, name: true, color: true }
            }
          }
        })
      })
    )

    return NextResponse.json({
      message: `Created ${createdEntries.length} entries`,
      entries: createdEntries
    })
  } catch (error) {
    console.error("Bulk create error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
