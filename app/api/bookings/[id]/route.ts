import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: {
        session: {
          include: {
            sessionType: true,
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    return NextResponse.json(booking);
  } catch (error) {
    console.error("Error fetching booking:", error);
    return NextResponse.json(
      { error: "Failed to fetch booking" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const reason = searchParams.get("reason") || "Cancelled by admin";

    const booking = await prisma.booking.update({
      where: { id: params.id },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        cancelReason: reason,
      },
      include: {
        session: {
          include: {
            sessionType: true,
          },
        },
      },
    });

    // Send cancellation notification (optional)
    await sendCancellationNotificationEmail(booking);

    return NextResponse.json({
      message: "Booking cancelled successfully",
      booking,
    });
  } catch (error) {
    console.error("Error cancelling booking:", error);
    return NextResponse.json(
      { error: "Failed to cancel booking" },
      { status: 500 }
    );
  }
}

async function sendCancellationNotificationEmail(booking: any) {
  try {
    // Send cancellation email to customer
    const customerEmailContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Booking Cancelled - Pilates Studio</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #dc3545; color: white; padding: 20px; text-align: center; border-radius: 8px; }
        .content { padding: 20px 0; }
        .booking-details { background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>❌ Booking Cancelled</h1>
            <p>Your Pilates session booking has been cancelled</p>
        </div>
        
        <div class="content">
            <p>Dear ${booking.fullName},</p>
            
            <p>We're writing to inform you that your Pilates session booking has been cancelled.</p>
            
            <div class="booking-details">
                <h3>Cancelled Booking Details</h3>
                <p><strong>Booking ID:</strong> ${booking.id}</p>
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
                <p><strong>Cancelled:</strong> ${new Date(
                  booking.cancelledAt
                ).toLocaleString()}</p>
                ${
                  booking.cancelReason
                    ? `<p><strong>Reason:</strong> ${booking.cancelReason}</p>`
                    : ""
                }
            </div>
            
            <p>We apologize for any inconvenience this may cause. You're welcome to book another session that fits your schedule.</p>
            
            <p>If you have any questions or concerns, please don't hesitate to contact us.</p>
        </div>
        
        <div class="footer">
            <p>Questions? Contact us at (555) 123-4567 or info@pilatesstudio.com</p>
            <p>Pilates Studio - Your Wellness Journey Continues</p>
        </div>
    </div>
</body>
</html>
    `;

    // Send customer notification
    await fetch(
      `${
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      }/api/send-email`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: booking.email,
          subject: `Booking Cancelled - ${booking.session.sessionType.name}`,
          html: customerEmailContent,
          type: "booking_cancellation",
        }),
      }
    );

    // Send admin notification
    const adminEmailContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Booking Cancelled - Admin Notification</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #dc3545; color: white; padding: 20px; text-align: center; border-radius: 8px; }
        .content { padding: 20px 0; }
        .booking-details { background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>❌ Booking Cancelled</h1>
            <p>A booking has been cancelled - slot now available</p>
        </div>
        
        <div class="content">
            <div class="booking-details">
                <h3>Cancelled Booking</h3>
                <p><strong>Booking ID:</strong> ${booking.id}</p>
                <p><strong>Customer:</strong> ${booking.fullName}</p>
                <p><strong>Email:</strong> ${booking.email}</p>
                <p><strong>Phone:</strong> ${booking.phone}</p>
                <p><strong>Session:</strong> ${
                  booking.session.sessionType.name
                }</p>
                <p><strong>Date:</strong> ${new Date(
                  booking.session.date
                ).toLocaleDateString()}</p>
                <p><strong>Time:</strong> ${booking.session.time}</p>
                <p><strong>Cancelled:</strong> ${new Date(
                  booking.cancelledAt
                ).toLocaleString()}</p>
                ${
                  booking.cancelReason
                    ? `<p><strong>Reason:</strong> ${booking.cancelReason}</p>`
                    : ""
                }
            </div>
            
            <p><strong>✅ The slot is now available for new bookings.</strong></p>
        </div>
    </div>
</body>
</html>
    `;

    // const adminEmail = process.env.ADMIN_EMAIL || "admin@pilatesstudio.com";
    // await fetch(
    //   `${
    //     process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    //   }/api/send-email`,
    //   {
    //     method: "POST",
    //     headers: {
    //       "Content-Type": "application/json",
    //     },
    //     body: JSON.stringify({
    //       to: adminEmail,
    //       subject: `Booking Cancelled: ${booking.fullName} - Slot Available`,
    //       html: adminEmailContent,
    //       type: "admin_cancellation",
    //     }),
    //   }
    // );

    console.log("Cancellation emails sent successfully");
  } catch (error) {
    console.error("Error sending cancellation emails:", error);
  }
}
