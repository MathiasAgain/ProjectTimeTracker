import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Manually trigger recurring entries (creates time entries for today)
export async function POST() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const dayOfWeek = today.getDay()
    const dayOfMonth = today.getDate()

    // Get all active recurring entries for this user
    const recurringEntries = await prisma.recurringEntry.findMany({
      where: {
        userId: session.user.id,
        active: true,
        startDate: { lte: today },
        OR: [
          { endDate: null },
          { endDate: { gte: today } }
        ]
      }
    })

    const createdEntries = []

    for (const recurring of recurringEntries) {
      let shouldCreate = false

      // Check if this recurring entry should run today
      if (recurring.frequency === "DAILY") {
        shouldCreate = true
      } else if (recurring.frequency === "WEEKLY") {
        shouldCreate = recurring.daysOfWeek.includes(dayOfWeek)
      } else if (recurring.frequency === "MONTHLY") {
        shouldCreate = recurring.dayOfMonth === dayOfMonth
      }

      // Check if already ran today
      if (shouldCreate && recurring.lastRun) {
        const lastRunDate = new Date(recurring.lastRun)
        lastRunDate.setHours(0, 0, 0, 0)
        if (lastRunDate.getTime() === today.getTime()) {
          shouldCreate = false // Already ran today
        }
      }

      if (shouldCreate) {
        // Create the time entry
        const startTime = new Date()
        startTime.setHours(9, 0, 0, 0) // Default to 9 AM

        const entry = await prisma.timeEntry.create({
          data: {
            activity: recurring.activity || recurring.name,
            subtask: recurring.subtask || null,
            notes: recurring.description || null,
            tags: recurring.tags || [],
            description: recurring.description || recurring.name,
            startTime,
            endTime: new Date(startTime.getTime() + recurring.duration * 1000),
            duration: recurring.duration,
            billable: recurring.billable,
            userId: recurring.userId,
            projectId: recurring.projectId
          }
        })

        // Update lastRun
        await prisma.recurringEntry.update({
          where: { id: recurring.id },
          data: { lastRun: today }
        })

        createdEntries.push(entry)
      }
    }

    return NextResponse.json({
      message: `Created ${createdEntries.length} time entries`,
      entries: createdEntries
    })
  } catch (error) {
    console.error("Run recurring entries error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
