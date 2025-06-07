import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";

export async function GET() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    // Get total bookings
    const totalBookings = await prisma.booking.count({
      where: {
        status: {
          in: ["CONFIRMED", "PENDING"],
        },
      },
    });

    // Get today's bookings
    const todayBookings = await prisma.booking.count({
      where: {
        session: {
          date: {
            gte: new Date(format(today, "yyyy-MM-dd")),
            lt: new Date(format(tomorrow, "yyyy-MM-dd")),
          },
        },
        status: {
          in: ["CONFIRMED", "PENDING"],
        },
      },
    });

    // Get sessions with capacity info for utilization calculation
    const sessions = await prisma.pSession.findMany({
      where: {
        isActive: true,
        date: {
          gte: new Date(format(today, "yyyy-MM-dd")),
          lt: new Date(format(tomorrow, "yyyy-MM-dd")),
        },
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

    // Calculate average capacity utilization
    const totalCapacity = sessions.reduce(
      (sum, session) => sum + session.sessionType.capacity,
      0
    );
    const totalBooked = sessions.reduce(
      (sum, session) => sum + session._count.bookings,
      0
    );
    const averageCapacity =
      totalCapacity > 0 ? Math.round((totalBooked / totalCapacity) * 100) : 0;

    // Calculate weekly revenue using the price of the session type and the confirmed bookings
    const startOfWeek = new Date(today);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    const confirmedBookings = await prisma.booking.count({
      where: {
        session: {
          date: {
            gte: new Date(format(startOfWeek, "yyyy-MM-dd")),
            lt: new Date(format(endOfWeek, "yyyy-MM-dd")),
          },
        },
        status: "CONFIRMED",
      },
    });

    const weeklyRevenue =
      confirmedBookings *
      sessions.reduce(
        (sum, session) => sum + Number(session.sessionType.price),
        0
      );

    const stats = {
      totalBookings,
      todayBookings,
      weeklyRevenue,
      averageCapacity,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
}
