import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getUserOrgId, getOrgUserIds } from "@/lib/organization"

// Get team dashboard data for organization or owned projects
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

    // Check if user is in an organization
    const orgId = await getUserOrgId(session.user.id)

    // Get projects - either org projects or owned projects
    const projectsQuery = orgId
      ? { organizationId: orgId }
      : { ownerId: session.user.id }

    const accessibleProjects = await prisma.project.findMany({
      where: projectsQuery,
      select: { id: true, name: true, color: true }
    })

    if (accessibleProjects.length === 0) {
      return NextResponse.json({
        projects: [],
        teamMembers: [],
        entries: [],
        stats: {},
        isOrganization: !!orgId
      })
    }

    const projectIds = projectId
      ? [projectId].filter(id => accessibleProjects.some(p => p.id === id))
      : accessibleProjects.map(p => p.id)

    // Date range
    const now = new Date()
    const defaultStart = new Date(now)
    defaultStart.setDate(defaultStart.getDate() - 7)

    const start = startDate ? new Date(startDate) : defaultStart
    const end = endDate ? new Date(endDate) : now
    end.setHours(23, 59, 59, 999)

    // Get team members - either org members or project members
    let teamUserIds: string[] = []

    if (orgId) {
      // Get all organization members
      teamUserIds = await getOrgUserIds(session.user.id)
    } else {
      // Get project members
      const members = await prisma.projectMember.findMany({
        where: { projectId: { in: projectIds } },
        select: { userId: true }
      })
      teamUserIds = [...new Set([session.user.id, ...members.map(m => m.userId)])]
    }

    // Get user details for team members
    const teamUsers = await prisma.user.findMany({
      where: { id: { in: teamUserIds } },
      select: { id: true, name: true, email: true, orgRole: true }
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

    // Initialize stats for all team members
    for (const user of teamUsers) {
      memberStats[user.id] = {
        userId: user.id,
        name: user.name || user.email || "Unknown",
        email: user.email,
        totalDuration: 0,
        entryCount: 0,
        projects: {}
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
      projects: accessibleProjects,
      teamMembers: Object.values(memberStats),
      entries: entries.slice(0, 100), // Limit to 100 entries
      dateRange: { start, end },
      isOrganization: !!orgId
    })
  } catch (error) {
    console.error("Team dashboard error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
