import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number.parseInt(params.id);

    const session = await prisma.pSession.findUnique({
      where: { id },
      include: {
        sessionType: true,
        _count: {
          select: {
            bookings: {
              where: {
                status: {
                  in: ["CONFIRMED", "PENDING"],
                },
              },
            },
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const sessionWithAvailability = {
      ...session,
      bookedSlots: session._count.bookings,
      availableSlots: session.sessionType.capacity - session._count.bookings,
    };

    return NextResponse.json(sessionWithAvailability);
  } catch (error) {
    console.error("Error fetching session:", error);
    return NextResponse.json(
      { error: "Failed to fetch session" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number.parseInt(params.id);
    const body = await request.json();
    const { sessionTypeId, date, time } = body;

    // Validate required fields
    if (!sessionTypeId || !date || !time) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if another session exists at this time (excluding current session)
    const existingSession = await prisma.pSession.findFirst({
      where: {
        sessionTypeId: Number.parseInt(sessionTypeId),
        date: new Date(date),
        time,
        id: { not: id },
        isActive: true,
      },
    });

    if (existingSession) {
      return NextResponse.json(
        { error: "A session already exists at this time" },
        { status: 409 }
      );
    }

    const session = await prisma.pSession.update({
      where: { id },
      data: {
        sessionTypeId: Number.parseInt(sessionTypeId),
        date: new Date(date),
        time,
      },
      include: {
        sessionType: true,
        _count: {
          select: {
            bookings: {
              where: {
                status: {
                  in: ["CONFIRMED", "PENDING"],
                },
              },
            },
          },
        },
      },
    });

    const sessionWithAvailability = {
      ...session,
      bookedSlots: session._count.bookings,
      availableSlots: session.sessionType.capacity - session._count.bookings,
    };

    return NextResponse.json(sessionWithAvailability);
  } catch (error) {
    console.error("Error updating session:", error);
    return NextResponse.json(
      { error: "Failed to update session" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number.parseInt(params.id);

    // Check if there are any confirmed bookings
    const confirmedBookings = await prisma.booking.count({
      where: {
        sessionId: id,
        status: {
          in: ["CONFIRMED", "PENDING"],
        },
      },
    });

    if (confirmedBookings > 0) {
      return NextResponse.json(
        { error: "Cannot delete session with existing bookings" },
        { status: 400 }
      );
    }

    await prisma.pSession.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ message: "Session deleted successfully" });
  } catch (error) {
    console.error("Error deleting session:", error);
    return NextResponse.json(
      { error: "Failed to delete session" },
      { status: 500 }
    );
  }
}
