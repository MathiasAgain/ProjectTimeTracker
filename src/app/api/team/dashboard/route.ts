import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Get team dashboard data for projects user owns
export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get("projectId")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    // Get projects where user is owner
    const ownedProjects = await prisma.project.findMany({
      where: { ownerId: session.user.id },
      select: { id: true, name: true, color: true }
    })

    if (ownedProjects.length === 0) {
      return NextResponse.json({
        projects: [],
        teamMembers: [],
        entries: [],
        stats: {}
      })
    }

    const projectIds = projectId
      ? [projectId].filter(id => ownedProjects.some(p => p.id === id))
      : ownedProjects.map(p => p.id)

    // Date range
    const now = new Date()
    const defaultStart = new Date(now)
    defaultStart.setDate(defaultStart.getDate() - 7)

    const start = startDate ? new Date(startDate) : defaultStart
    const end = endDate ? new Date(endDate) : now
    end.setHours(23, 59, 59, 999)

    // Get team members for these projects
    const members = await prisma.projectMember.findMany({
      where: { projectId: { in: projectIds } },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        project: {
          select: { id: true, name: true, color: true }
        }
      }
    })

    // Get all time entries for these projects in date range
    const entries = await prisma.timeEntry.findMany({
      where: {
        projectId: { in: projectIds },
        startTime: { gte: start, lte: end }
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        project: {
          select: { id: true, name: true, color: true }
        }
      },
      orderBy: { startTime: "desc" }
    })

    // Calculate stats per member
    const memberStats: Record<string, {
      userId: string
      name: string
      email: string
      totalDuration: number
      entryCount: number
      projects: Record<string, number>
    }> = {}

    // Include project owner
    memberStats[session.user.id] = {
      userId: session.user.id,
      name: session.user.name || "You",
      email: session.user.email || "",
      totalDuration: 0,
      entryCount: 0,
      projects: {}
    }

    // Add team members
    for (const member of members) {
      if (!memberStats[member.userId]) {
        memberStats[member.userId] = {
          userId: member.userId,
          name: member.user.name || member.user.email || "Unknown",
          email: member.user.email,
          totalDuration: 0,
          entryCount: 0,
          projects: {}
        }
      }
    }

    // Calculate stats from entries
    for (const entry of entries) {
      const userId = entry.userId
      if (!memberStats[userId]) {
        memberStats[userId] = {
          userId,
          name: entry.user.name || entry.user.email || "Unknown",
          email: entry.user.email,
          totalDuration: 0,
          entryCount: 0,
          projects: {}
        }
      }

      const duration = entry.duration || 0
      memberStats[userId].totalDuration += duration
      memberStats[userId].entryCount += 1
      memberStats[userId].projects[entry.projectId] =
        (memberStats[userId].projects[entry.projectId] || 0) + duration
    }

    return NextResponse.json({
      projects: ownedProjects,
      teamMembers: Object.values(memberStats),
      entries: entries.slice(0, 100), // Limit to 100 entries
      dateRange: { start, end }
    })
  } catch (error) {
    console.error("Team dashboard error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
