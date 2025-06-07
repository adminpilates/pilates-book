import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeBookings = searchParams.get("includeBookings") === "true";
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");

    const whereClause: any = {
      isActive: true,
    };

    // Add date filtering if provided
    if (fromDate) {
      whereClause.date = {
        gte: new Date(fromDate),
      };
    }

    if (toDate) {
      whereClause.date = {
        ...whereClause.date,
        lte: new Date(toDate),
      };
    }

    const sessions = await prisma.session.findMany({
      where: whereClause,
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
        ...(includeBookings && {
          bookings: {
            where: {
              status: {
                in: ["CONFIRMED", "PENDING"],
              },
            },
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
              status: true,
            },
          },
        }),
      },
      orderBy: [{ date: "asc" }, { time: "asc" }],
    });

    // Add computed fields
    const sessionsWithAvailability = sessions.map((session) => ({
      ...session,
      bookedSlots: session._count.bookings,
      availableSlots: session.sessionType.capacity - session._count.bookings,
      utilizationRate: Math.round(
        (session._count.bookings / session.sessionType.capacity) * 100
      ),
    }));

    return NextResponse.json(sessionsWithAvailability);
  } catch (error) {
    console.error("Error fetching sessions:", error);
    return NextResponse.json(
      { error: "Failed to fetch sessions" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionTypeId, date, time } = body;

    // Validate required fields
    if (!sessionTypeId || !date || !time) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if session already exists at this time
    const existingSession = await prisma.session.findUnique({
      where: {
        sessionTypeId_date_time: {
          sessionTypeId: Number.parseInt(sessionTypeId),
          date: new Date(date),
          time,
        },
      },
    });

    if (existingSession) {
      return NextResponse.json(
        { error: "A session already exists at this time" },
        { status: 409 }
      );
    }

    const session = await prisma.session.create({
      data: {
        sessionTypeId: Number.parseInt(sessionTypeId),
        date: new Date(date),
        time,
      },
      include: {
        sessionType: true,
        _count: {
          select: {
            bookings: true,
          },
        },
      },
    });

    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    console.error("Error creating session:", error);
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 }
    );
  }
}
