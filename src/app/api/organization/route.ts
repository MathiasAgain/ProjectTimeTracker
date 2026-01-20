import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Get current user's organization
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        organization: {
          include: {
            members: {
              select: {
                id: true,
                name: true,
                email: true,
                orgRole: true,
                createdAt: true
              }
            },
            owner: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            _count: {
              select: {
                projects: true,
                members: true
              }
            }
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      organization: user.organization,
      userRole: user.orgRole
    })
  } catch (error) {
    console.error("Get organization error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}

// Create a new organization
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name } = await request.json()

    if (!name?.trim()) {
      return NextResponse.json({ error: "Organization name is required" }, { status: 400 })
    }

    // Check if user already has an organization
    const existingUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true }
    })

    if (existingUser?.organizationId) {
      return NextResponse.json(
        { error: "You are already a member of an organization. Leave it first to create a new one." },
        { status: 400 }
      )
    }

    // Create organization and update user in a transaction
    const organization = await prisma.$transaction(async (tx) => {
      // Create the organization
      const org = await tx.organization.create({
        data: {
          name: name.trim(),
          ownerId: session.user.id
        }
      })

      // Update user to be member and owner
      await tx.user.update({
        where: { id: session.user.id },
        data: {
          organizationId: org.id,
          orgRole: "OWNER"
        }
      })

      // Move user's existing projects to the organization
      await tx.project.updateMany({
        where: { ownerId: session.user.id },
        data: { organizationId: org.id }
      })

      return org
    })

    return NextResponse.json(organization, { status: 201 })
  } catch (error) {
    console.error("Create organization error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}

// Update organization (admin/owner only)
export async function PUT(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name } = await request.json()

    // Get user's org role
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true, orgRole: true }
    })

    if (!user?.organizationId) {
      return NextResponse.json({ error: "Not a member of any organization" }, { status: 400 })
    }

    if (user.orgRole !== "OWNER" && user.orgRole !== "ADMIN") {
      return NextResponse.json({ error: "Only admins can update the organization" }, { status: 403 })
    }

    const organization = await prisma.organization.update({
      where: { id: user.organizationId },
      data: { name: name.trim() }
    })

    return NextResponse.json(organization)
  } catch (error) {
    console.error("Update organization error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}

// Delete organization (owner only)
export async function DELETE() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's org role
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true, orgRole: true }
    })

    if (!user?.organizationId) {
      return NextResponse.json({ error: "Not a member of any organization" }, { status: 400 })
    }

    if (user.orgRole !== "OWNER") {
      return NextResponse.json({ error: "Only the owner can delete the organization" }, { status: 403 })
    }

    const orgId = user.organizationId!

    // Delete organization - this will cascade to remove org from all users
    await prisma.$transaction(async (tx) => {
      // First, reset all members' organization fields
      await tx.user.updateMany({
        where: { organizationId: orgId },
        data: {
          organizationId: null,
          orgRole: "MEMBER"
        }
      })

      // Remove organization from all projects
      await tx.project.updateMany({
        where: { organizationId: orgId },
        data: { organizationId: null }
      })

      // Delete the organization
      await tx.organization.delete({
        where: { id: orgId }
      })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete organization error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
