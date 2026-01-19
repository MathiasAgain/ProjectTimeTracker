import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Create default templates for all user's projects that don't have them
export async function POST() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get all projects owned by the user
    const projects = await prisma.project.findMany({
      where: { ownerId: session.user.id },
      select: { id: true, name: true }
    })

    let templatesCreated = 0
    let recurringCreated = 0

    for (const project of projects) {
      // Check if project already has the default Meeting template
      const existingTemplate = await prisma.timeTemplate.findFirst({
        where: {
          projectId: project.id,
          userId: session.user.id,
          name: "Meeting",
          isDefault: true
        }
      })

      if (!existingTemplate) {
        // Create default templates
        await prisma.timeTemplate.createMany({
          data: [
            {
              name: "Meeting",
              activity: "Meeting",
              description: "Team meeting or client call",
              tags: ["meeting"],
              duration: 3600, // 1 hour
              billable: true,
              isDefault: true,
              userId: session.user.id,
              projectId: project.id
            },
            {
              name: "Quick Sync",
              activity: "Meeting",
              subtask: "Quick sync",
              description: "Short sync-up call",
              tags: ["meeting", "sync"],
              duration: 900, // 15 minutes
              billable: true,
              isDefault: true,
              userId: session.user.id,
              projectId: project.id
            }
          ]
        })
        templatesCreated += 2
      }

      // Check if project already has the Daily Standup recurring entry
      const existingRecurring = await prisma.recurringEntry.findFirst({
        where: {
          projectId: project.id,
          userId: session.user.id,
          name: "Daily Standup"
        }
      })

      if (!existingRecurring) {
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        await prisma.recurringEntry.create({
          data: {
            name: "Daily Standup",
            activity: "Meeting",
            subtask: "Daily standup",
            description: "Daily team standup meeting",
            tags: ["meeting", "standup", "daily"],
            duration: 900, // 15 minutes
            billable: false,
            frequency: "WEEKLY",
            daysOfWeek: [1, 2, 3, 4, 5], // Monday to Friday
            startDate: today,
            active: true,
            userId: session.user.id,
            projectId: project.id
          }
        })
        recurringCreated++
      }
    }

    return NextResponse.json({
      message: `Created ${templatesCreated} templates and ${recurringCreated} recurring entries for ${projects.length} projects`,
      templatesCreated,
      recurringCreated,
      projectsProcessed: projects.length
    })
  } catch (error) {
    console.error("Create default templates error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
