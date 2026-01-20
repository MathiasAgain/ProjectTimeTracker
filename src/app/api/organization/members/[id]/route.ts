import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Update member role (admin/owner only)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: memberId } = await params
    const { role } = await request.json()

    if (!["ADMIN", "MEMBER"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    // Get current user's org and role
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true, orgRole: true }
    })

    if (!currentUser?.organizationId) {
      return NextResponse.json({ error: "Not a member of any organization" }, { status: 400 })
    }

    if (currentUser.orgRole !== "OWNER" && currentUser.orgRole !== "ADMIN") {
      return NextResponse.json({ error: "Only admins can change member roles" }, { status: 403 })
    }

    // Get target member
    const targetMember = await prisma.user.findUnique({
      where: { id: memberId },
      select: { organizationId: true, orgRole: true }
    })

    if (!targetMember || targetMember.organizationId !== currentUser.organizationId) {
      return NextResponse.json({ error: "Member not found in organization" }, { status: 404 })
    }

    // Can't change owner's role
    if (targetMember.orgRole === "OWNER") {
      return NextResponse.json({ error: "Cannot change owner's role" }, { status: 403 })
    }

    // Admins can't change other admins (only owner can)
    if (currentUser.orgRole === "ADMIN" && targetMember.orgRole === "ADMIN") {
      return NextResponse.json({ error: "Only the owner can change admin roles" }, { status: 403 })
    }

    // Update member's role
    const updatedMember = await prisma.user.update({
      where: { id: memberId },
      data: { orgRole: role },
      select: {
        id: true,
        name: true,
        email: true,
        orgRole: true
      }
    })

    return NextResponse.json(updatedMember)
  } catch (error) {
    console.error("Update member role error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}

// Remove member from organization (admin/owner only)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: memberId } = await params

    // Get current user's org and role
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true, orgRole: true }
    })

    if (!currentUser?.organizationId) {
      return NextResponse.json({ error: "Not a member of any organization" }, { status: 400 })
    }

    // Users can remove themselves (leave org)
    const isSelf = session.user.id === memberId

    if (!isSelf && currentUser.orgRole !== "OWNER" && currentUser.orgRole !== "ADMIN") {
      return NextResponse.json({ error: "Only admins can remove members" }, { status: 403 })
    }

    // Get target member
    const targetMember = await prisma.user.findUnique({
      where: { id: memberId },
      select: { organizationId: true, orgRole: true }
    })

    if (!targetMember || targetMember.organizationId !== currentUser.organizationId) {
      return NextResponse.json({ error: "Member not found in organization" }, { status: 404 })
    }

    // Owner can't be removed (must delete org or transfer ownership first)
    if (targetMember.orgRole === "OWNER") {
      return NextResponse.json({ error: "Owner cannot be removed. Transfer ownership or delete the organization." }, { status: 403 })
    }

    // Admins can't remove other admins (only owner can)
    if (!isSelf && currentUser.orgRole === "ADMIN" && targetMember.orgRole === "ADMIN") {
      return NextResponse.json({ error: "Only the owner can remove admins" }, { status: 403 })
    }

    // Remove member from organization
    await prisma.user.update({
      where: { id: memberId },
      data: {
        organizationId: null,
        orgRole: "MEMBER"
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Remove member error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
