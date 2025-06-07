import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)
    const body = await request.json()
    const { name, description, capacity, duration, price, color } = body

    const sessionType = await prisma.sessionType.update({
      where: { id },
      data: {
        name,
        description,
        capacity: Number.parseInt(capacity),
        duration: Number.parseInt(duration),
        price: price ? Number.parseFloat(price) : null,
        color,
      },
    })

    return NextResponse.json(sessionType)
  } catch (error) {
    console.error("Error updating session type:", error)
    return NextResponse.json({ error: "Failed to update session type" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)

    // Check if there are any sessions using this session type
    const sessionsCount = await prisma.session.count({
      where: { sessionTypeId: id, isActive: true },
    })

    if (sessionsCount > 0) {
      return NextResponse.json({ error: "Cannot delete session type with existing sessions" }, { status: 400 })
    }

    await prisma.sessionType.update({
      where: { id },
      data: { isActive: false },
    })

    return NextResponse.json({ message: "Session type deleted successfully" })
  } catch (error) {
    console.error("Error deleting session type:", error)
    return NextResponse.json({ error: "Failed to delete session type" }, { status: 500 })
  }
}
