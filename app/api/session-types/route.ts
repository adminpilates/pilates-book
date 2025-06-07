import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const sessionTypes = await prisma.sessionType.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    })

    return NextResponse.json(sessionTypes)
  } catch (error) {
    console.error("Error fetching session types:", error)
    return NextResponse.json({ error: "Failed to fetch session types" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, capacity, duration, price, color } = body

    // Validate required fields
    if (!name || !description || !capacity || !duration) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const sessionType = await prisma.sessionType.create({
      data: {
        name,
        description,
        capacity: Number.parseInt(capacity),
        duration: Number.parseInt(duration),
        price: price ? Number.parseFloat(price) : null,
        color: color || "bg-blue-100 text-blue-800",
      },
    })

    return NextResponse.json(sessionType, { status: 201 })
  } catch (error) {
    console.error("Error creating session type:", error)

    // Handle unique constraint violation
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return NextResponse.json({ error: "A session type with this name already exists" }, { status: 409 })
    }

    return NextResponse.json({ error: "Failed to create session type" }, { status: 500 })
  }
}
