import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const sessionType = searchParams.get("sessionType");
    const search = searchParams.get("search");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const whereClause: any = {};

    // Filter by status
    if (status && status !== "all") {
      whereClause.status = status.toUpperCase();
    }

    // Filter by session type
    if (sessionType && sessionType !== "all") {
      whereClause.session = {
        sessionType: {
          name: sessionType,
        },
      };
    }

    // Filter by date range
    if (startDate || endDate) {
      whereClause.session = {
        ...whereClause.session,
        date: {},
      };
      if (startDate) {
        whereClause.session.date.gte = new Date(startDate);
      }
      if (endDate) {
        whereClause.session.date.lte = new Date(endDate);
      }
    }

    // Search functionality
    if (search) {
      whereClause.OR = [
        { fullName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
      ];
    }

    const bookings = await prisma.booking.findMany({
      where: whereClause,
      include: {
        session: {
          include: {
            sessionType: true,
          },
        },
      },
      orderBy: [
        { session: { date: "asc" } },
        { session: { time: "asc" } },
        { createdAt: "desc" },
      ],
    });

    // Generate CSV content
    const csvHeaders = [
      "Booking ID",
      "First Name",
      "Last Name",
      "Email",
      "Phone",
      "Session Type",
      "Session Date",
      "Session Time",
      "Duration (min)",
      "Price (IDR)",
      "Status",
      "Experience Level",
      "Medical Conditions",
      "Emergency Contact",
      "Emergency Phone",
      "Special Requests",
      "Booking Date",
    ];

    const csvRows = bookings.map((booking) => [
      booking.id,
      booking.fullName,
      booking.email,
      booking.phone,
      booking.session.sessionType.name,
      new Date(booking.session.date).toLocaleDateString("id-ID"),
      booking.session.time,
      booking.session.sessionType.duration,
      booking.session.sessionType.price || "",
      booking.status,
      booking.experience,
      booking.medicalConditions || "",
      booking.emergencyContact || "",
      booking.emergencyPhone || "",
      booking.specialRequests || "",
      new Date(booking.createdAt).toLocaleDateString("id-ID"),
    ]);

    // Convert to CSV format
    const csvContent = [
      csvHeaders.join(","),
      ...csvRows.map((row) =>
        row
          .map((field) => {
            // Escape fields that contain commas, quotes, or newlines
            if (
              typeof field === "string" &&
              (field.includes(",") ||
                field.includes('"') ||
                field.includes("\n"))
            ) {
              return `"${field.replace(/"/g, '""')}"`;
            }
            return field;
          })
          .join(",")
      ),
    ].join("\n");

    // Return CSV file
    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="bookings-export-${
          new Date().toISOString().split("T")[0]
        }.csv"`,
      },
    });
  } catch (error) {
    console.error("Error exporting bookings:", error);
    return NextResponse.json(
      { error: "Failed to export bookings" },
      { status: 500 }
    );
  }
}
