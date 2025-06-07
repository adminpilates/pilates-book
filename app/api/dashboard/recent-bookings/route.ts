import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const recentBookings = await prisma.booking.findMany({
      take: 10,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        session: {
          include: {
            sessionType: true,
          },
        },
      },
      where: {
        status: {
          in: ["CONFIRMED", "PENDING"],
        },
      },
    })

    return NextResponse.json(recentBookings)
  } catch (error) {
    console.error("Error fetching recent bookings:", error)
    return NextResponse.json({ error: "Failed to fetch recent bookings" }, { status: 500 })
  }
}
