import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { CreateBookingData } from "@/lib/types";

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
        { id: { contains: search } },
      ];
    }

    console.log(whereClause);

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

    return NextResponse.json(bookings);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateBookingData = await request.json();
    const {
      sessionId,
      fullName,
      email,
      phone,
      emergencyContact,
      emergencyPhone,
      medicalConditions,
      experience,
      specialRequests,
    } = body;

    // Validate required fields
    if (!sessionId || !fullName || !email || !phone) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if session exists and has available slots
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
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

    if (!session.isActive) {
      return NextResponse.json(
        { error: "Session is no longer available" },
        { status: 400 }
      );
    }

    const availableSlots =
      session.sessionType.capacity - session._count.bookings;
    if (availableSlots <= 0) {
      return NextResponse.json(
        { error: "Session is fully booked" },
        { status: 400 }
      );
    }

    // Check for duplicate booking (same email for same session)
    const existingBooking = await prisma.booking.findFirst({
      where: {
        sessionId,
        email,
        status: {
          in: ["CONFIRMED", "PENDING"],
        },
      },
    });

    if (existingBooking) {
      return NextResponse.json(
        { error: "You already have a booking for this session" },
        { status: 409 }
      );
    }

    // Create the booking
    const booking = await prisma.booking.create({
      data: {
        sessionId,
        fullName,
        email,
        phone,
        emergencyContact,
        emergencyPhone,
        medicalConditions,
        experience: experience || "BEGINNER",
        specialRequests,
        status: "PENDING",
      },
      include: {
        session: {
          include: {
            sessionType: true,
          },
        },
      },
    });

    // Send email notifications
    await Promise.all([
      sendBookingConfirmationEmail(booking),
      // sendAdminNotificationEmail(booking),
    ]);

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error("Error creating booking:", error);
    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 }
    );
  }
}

// Email notification function using Resend
async function sendBookingConfirmationEmail(booking: any) {
  try {
    const emailContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Booking Confirmation - Pilates Studio</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px; }
        .content { padding: 20px 0; }
        .booking-details { background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
        .button { display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧘‍♀️ Booking Confirmed!</h1>
            <p>Your Pilates session has been successfully booked</p>
        </div>
        
        <div class="content">
            <p>Dear ${booking.fullName},</p>
            
            <p>Thank you for booking with Pilates Studio! Your session has been confirmed.</p>
            
            <div class="booking-details">
                <h3>Booking Details</h3>
                <p><strong>Session:</strong> ${
                  booking.session.sessionType.name
                }</p>
                <p><strong>Date:</strong> ${new Date(
                  booking.session.date
                ).toLocaleDateString("id-ID", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}</p>
                <p><strong>Time:</strong> ${booking.session.time}</p>
                <p><strong>Duration:</strong> ${
                  booking.session.sessionType.duration
                } minutes</p>
                <p><strong>Booking ID:</strong> ${booking.id}</p>
                ${
                  booking.session.sessionType.price
                    ? `<p><strong>Price:</strong> ${new Intl.NumberFormat(
                        "id-ID",
                        {
                          style: "currency",
                          currency: "IDR",
                          minimumFractionDigits: 0,
                        }
                      ).format(booking.session.sessionType.price)}</p>`
                    : ""
                }
            </div>
            
            ${
              booking.medicalConditions
                ? `
            <div class="booking-details">
                <h3>Medical Notes</h3>
                <p>${booking.medicalConditions}</p>
            </div>
            `
                : ""
            }
            
            <h3>What to Bring:</h3>
            <ul>
                <li>Comfortable workout clothes</li>
                <li>Water bottle</li>
                <li>Towel</li>
                <li>Yoga mat (if you have one)</li>
            </ul>
            
            <h3>Important Information:</h3>
            <ul>
                <li>Please arrive 10 minutes early</li>
                <li>If you need to cancel, please contact us at least 24 hours in advance</li>
                <li>Our studio is located at [Your Studio Address]</li>
            </ul>
        </div>
        
        <div class="footer">
            <p>Questions? Contact us at (555) 123-4567 or info@pilatesstudio.com</p>
            <p>Pilates Studio - Your Wellness Journey Starts Here</p>
        </div>
    </div>
</body>
</html>
    `;

    // Send email using fetch to your email API endpoint
    const response = await fetch(
      `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/send-email`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: booking.email,
          subject: `Booking Confirmed - ${
            booking.session.sessionType.name
          } on ${new Date(booking.session.date).toLocaleDateString()}`,
          html: emailContent,
          type: "booking_confirmation",
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to send confirmation email");
    }

    console.log("Booking confirmation email sent to:", booking.email);
  } catch (error) {
    console.error("Error sending booking confirmation email:", error);
    // Don't throw error here to avoid failing the booking
  }
}

// Admin notification email
async function sendAdminNotificationEmail(booking: any) {
  try {
    const emailContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>New Booking - Pilates Studio Admin</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #28a745; color: white; padding: 20px; text-align: center; border-radius: 8px; }
        .content { padding: 20px 0; }
        .booking-details { background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0; }
        .customer-details { background: #e9ecef; padding: 15px; border-radius: 8px; margin: 15px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧘‍♀️ New Booking Alert</h1>
            <p>A new Pilates session has been booked</p>
        </div>
        
        <div class="content">
            <div class="booking-details">
                <h3>Session Details</h3>
                <p><strong>Session:</strong> ${
                  booking.session.sessionType.name
                }</p>
                <p><strong>Date:</strong> ${new Date(
                  booking.session.date
                ).toLocaleDateString("id-ID", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}</p>
                <p><strong>Time:</strong> ${booking.session.time}</p>
                <p><strong>Duration:</strong> ${
                  booking.session.sessionType.duration
                } minutes</p>
                <p><strong>Booking ID:</strong> ${booking.id}</p>
                <p><strong>Booked At:</strong> ${new Date(
                  booking.createdAt
                ).toLocaleString()}</p>
                ${
                  booking.session.sessionType.price
                    ? `<p><strong>Price:</strong> ${new Intl.NumberFormat(
                        "id-ID",
                        {
                          style: "currency",
                          currency: "IDR",
                          minimumFractionDigits: 0,
                        }
                      ).format(booking.session.sessionType.price)}</p>`
                    : ""
                }
            </div>
            
            <div class="customer-details">
                <h3>Customer Information</h3>
                <p><strong>Name:</strong> ${booking.fullName}</p>
                <p><strong>Email:</strong> ${booking.email}</p>
                <p><strong>Phone:</strong> ${booking.phone}</p>
                <p><strong>Experience Level:</strong> ${booking.experience}</p>
                
                ${
                  booking.emergencyContact
                    ? `
                <p><strong>Emergency Contact:</strong> ${booking.emergencyContact}</p>
                <p><strong>Emergency Phone:</strong> ${booking.emergencyPhone}</p>
                `
                    : ""
                }
                
                ${
                  booking.medicalConditions
                    ? `
                <div style="margin-top: 15px; padding: 10px; background: #fff3cd; border-radius: 5px;">
                    <strong>⚠️ Medical Conditions:</strong><br>
                    ${booking.medicalConditions}
                </div>
                `
                    : ""
                }
                
                ${
                  booking.specialRequests
                    ? `
                <div style="margin-top: 15px;">
                    <strong>Special Requests:</strong><br>
                    ${booking.specialRequests}
                </div>
                `
                    : ""
                }
            </div>
        </div>
    </div>
</body>
</html>
    `;

    // Send admin notification email
    const adminEmail = process.env.ADMIN_EMAIL || "admin@pilatesstudio.com";
    const response = await fetch(
      `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/send-email`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: adminEmail,
          subject: `New Booking: ${booking.fullName} - ${booking.session.sessionType.name}`,
          html: emailContent,
          type: "admin_notification",
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to send admin notification email");
    }

    console.log("Admin notification email sent to:", adminEmail);
  } catch (error) {
    console.error("Error sending admin notification email:", error);
  }
}
