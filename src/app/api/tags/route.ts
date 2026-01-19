import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { PREDEFINED_TAGS } from "@/lib/tag-colors"

// Get all predefined tags with usage counts for the user
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get all time entries with tags to count usage
    const entries = await prisma.timeEntry.findMany({
      where: { userId: session.user.id },
      select: { tags: true }
    })

    // Count usage of each tag
    const tagCounts: Record<string, number> = {}
    entries.forEach(entry => {
      entry.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1
      })
    })

    // Return all predefined tags with their usage counts
    const tags = PREDEFINED_TAGS.map(tag => ({
      name: tag.name,
      count: tagCounts[tag.name] || 0
    })).sort((a, b) => b.count - a.count)

    return NextResponse.json(tags)
  } catch (error) {
    console.error("Get tags error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
