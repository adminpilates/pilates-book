import { type NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(request: NextRequest) {
  try {
    const { to, subject, html, type } = await request.json();

    // Validate required fields
    if (!to || !subject || !html) {
      return NextResponse.json(
        { error: "Missing required email fields" },
        { status: 400 }
      );
    }

    // Using Nodemailer as local development fallback
    if (process.env.SMTP_HOST) {
      // For local development or custom SMTP

      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number.parseInt(process.env.SMTP_PORT || "587"),
        secure: process.env.SMTP_SECURE === "true",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const info = await transporter.sendMail({
        from: process.env.FROM_EMAIL || "noreply@pilatesstudio.com",
        to,
        subject,
        html,
      });

      console.log(`Email sent via SMTP (${type}):`, info.messageId);
      return NextResponse.json({
        success: true,
        id: info.messageId,
        provider: "smtp",
      });
    }

    throw new Error("No email service configured");
  } catch (error) {
    console.error("Error sending email:", error);
    return NextResponse.json(
      {
        error: "Failed to send email",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
