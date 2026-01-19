import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Get all unique tags used by the user
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get all time entries with tags
    const entries = await prisma.timeEntry.findMany({
      where: { userId: session.user.id },
      select: { tags: true }
    })

    // Extract unique tags with count
    const tagCounts: Record<string, number> = {}
    entries.forEach(entry => {
      entry.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1
      })
    })

    // Sort by count descending
    const tags = Object.entries(tagCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)

    return NextResponse.json(tags)
  } catch (error) {
    console.error("Get tags error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
