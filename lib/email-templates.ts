export interface BookingEmailData {
  fullName: string;
  email: string;
  session: {
    sessionType: {
      name: string;
      duration: number;
    };
    date: string;
    time: string;
  };
  id: string;
  medicalConditions?: string;
  specialRequests?: string;
}

export function generateBookingConfirmationEmail(
  booking: BookingEmailData
): string {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Booking Confirmation - Pilates Studio</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0; 
            padding: 0; 
            background-color: #f8f9fa;
        }
        .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background: white; 
            border-radius: 8px; 
            overflow: hidden; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
            padding: 30px 20px; 
            text-align: center; 
        }
        .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
        .header p { margin: 10px 0 0 0; opacity: 0.9; }
        .content { padding: 30px 20px; }
        .booking-card { 
            background: #f8f9fa; 
            padding: 20px; 
            border-radius: 8px; 
            margin: 20px 0; 
            border-left: 4px solid #667eea;
        }
        .booking-card h3 { margin-top: 0; color: #495057; }
        .detail-row { 
            display: flex; 
            justify-content: space-between; 
            margin: 8px 0; 
            padding: 8px 0;
            border-bottom: 1px solid #e9ecef;
        }
        .detail-row:last-child { border-bottom: none; }
        .detail-label { font-weight: 600; color: #6c757d; }
        .detail-value { color: #495057; }
        .info-section { 
            background: #e3f2fd; 
            padding: 20px; 
            border-radius: 8px; 
            margin: 20px 0; 
        }
        .info-section h3 { margin-top: 0; color: #1976d2; }
        .info-section ul { margin: 10px 0; padding-left: 20px; }
        .info-section li { margin: 5px 0; }
        .footer { 
            background: #f8f9fa; 
            text-align: center; 
            padding: 20px; 
            color: #6c757d; 
            font-size: 14px; 
        }
        .medical-note {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            padding: 15px;
            border-radius: 8px;
            margin: 15px 0;
        }
        .medical-note h4 {
            margin-top: 0;
            color: #856404;
        }
        @media (max-width: 600px) {
            .container { margin: 10px; }
            .content { padding: 20px 15px; }
            .detail-row { flex-direction: column; }
            .detail-label { margin-bottom: 5px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧘‍♀️ Booking Confirmed!</h1>
            <p>Your Pilates session is all set</p>
        </div>
        
        <div class="content">
            <p>Dear ${booking.fullName},</p>
            
            <p>Thank you for choosing Pilates Studio! We're excited to see you for your upcoming session.</p>
            
            <div class="booking-card">
                <h3>Your Booking Details</h3>
                <div class="detail-row">
                    <span class="detail-label">Session Type:</span>
                    <span class="detail-value">${
                      booking.session.sessionType.name
                    }</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Date:</span>
                    <span class="detail-value">${new Date(
                      booking.session.date
                    ).toLocaleDateString("id-ID", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Time:</span>
                    <span class="detail-value">${booking.session.time}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Duration:</span>
                    <span class="detail-value">${
                      booking.session.sessionType.duration
                    } minutes</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Booking ID:</span>
                    <span class="detail-value">${booking.id}</span>
                </div>
            </div>
            
            ${
              booking.medicalConditions
                ? `
            <div class="medical-note">
                <h4>⚠️ Medical Notes on File</h4>
                <p>${booking.medicalConditions}</p>
                <p><small>Our instructors have been notified of your medical considerations.</small></p>
            </div>
            `
                : ""
            }
            
            <div class="info-section">
                <h3>📋 What to Bring</h3>
                <ul>
                    <li>Comfortable, stretchy workout clothes</li>
                    <li>Water bottle to stay hydrated</li>
                    <li>Small towel</li>
                    <li>Yoga mat (we have extras if needed)</li>
                    <li>Positive attitude and willingness to learn!</li>
                </ul>
            </div>
            
            <div class="info-section">
                <h3>🕐 Important Reminders</h3>
                <ul>
                    <li><strong>Arrive 10 minutes early</strong> for check-in and setup</li>
                    <li><strong>Cancellation policy:</strong> Please cancel at least 24 hours in advance</li>
                    <li><strong>First time?</strong> Let your instructor know - they'll take extra care of you</li>
                    <li><strong>Questions?</strong> Don't hesitate to ask our friendly staff</li>
                </ul>
            </div>
            
            <p>We can't wait to help you on your wellness journey. See you soon!</p>
            
            <p>Warm regards,<br>
            <strong>The Pilates Studio Team</strong></p>
        </div>
        
        <div class="footer">
            <p><strong>Pilates Studio</strong></p>
            <p>📍 123 Wellness Street, Health City, HC 12345</p>
            <p>📞 (555) 123-4567 | ✉️ info@pilatesstudio.com</p>
            <p style="margin-top: 15px; font-size: 12px; color: #adb5bd;">
                This email was sent to ${
                  booking.email
                }. If you have any questions, please contact us.
            </p>
        </div>
    </div>
</body>
</html>
  `;
}

export function generateAdminNotificationEmail(
  booking: BookingEmailData
): string {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Booking Alert - Pilates Studio Admin</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0; 
            padding: 0; 
            background-color: #f8f9fa;
        }
        .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background: white; 
            border-radius: 8px; 
            overflow: hidden; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header { 
            background: linear-gradient(135deg, #28a745 0%, #20c997 100%); 
            color: white; 
            padding: 25px 20px; 
            text-align: center; 
        }
        .content { padding: 25px 20px; }
        .alert-badge {
            background: #28a745;
            color: white;
            padding: 5px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            display: inline-block;
            margin-bottom: 15px;
        }
        .booking-summary { 
            background: #f8f9fa; 
            padding: 20px; 
            border-radius: 8px; 
            margin: 20px 0; 
            border-left: 4px solid #28a745;
        }
        .customer-info { 
            background: #e9ecef; 
            padding: 20px; 
            border-radius: 8px; 
            margin: 20px 0; 
        }
        .detail-grid {
            display: grid;
            grid-template-columns: 1fr 2fr;
            gap: 10px;
            margin: 10px 0;
        }
        .detail-label { font-weight: 600; color: #6c757d; }
        .detail-value { color: #495057; }
        .medical-alert {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            padding: 15px;
            border-radius: 8px;
            margin: 15px 0;
        }
        .medical-alert h4 {
            margin-top: 0;
            color: #856404;
        }
        @media (max-width: 600px) {
            .detail-grid { grid-template-columns: 1fr; gap: 5px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧘‍♀️ New Booking Alert</h1>
            <p>A new Pilates session has been booked</p>
        </div>
        
        <div class="content">
            <div class="alert-badge">NEW BOOKING</div>
            
            <div class="booking-summary">
                <h3>📅 Session Details</h3>
                <div class="detail-grid">
                    <span class="detail-label">Session:</span>
                    <span class="detail-value"><strong>${
                      booking.session.sessionType.name
                    }</strong></span>
                    
                    <span class="detail-label">Date:</span>
                    <span class="detail-value">${new Date(
                      booking.session.date
                    ).toLocaleDateString("id-ID", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}</span>
                    
                    <span class="detail-label">Time:</span>
                    <span class="detail-value">${booking.session.time}</span>
                    
                    <span class="detail-label">Duration:</span>
                    <span class="detail-value">${
                      booking.session.sessionType.duration
                    } minutes</span>
                    
                    <span class="detail-label">Booking ID:</span>
                    <span class="detail-value">${booking.id}</span>
                    
                    <span class="detail-label">Booked At:</span>
                    <span class="detail-value">${new Date().toLocaleString()}</span>
                </div>
            </div>
            
            <div class="customer-info">
                <h3>👤 Customer Information</h3>
                <div class="detail-grid">
                    <span class="detail-label">Name:</span>
                    <span class="detail-value"><strong>${
                      booking.fullName
                    }</strong></span>
                    
                    <span class="detail-label">Email:</span>
                    <span class="detail-value">${booking.email}</span>
                    
                    <span class="detail-label">Phone:</span>
                    <span class="detail-value">${booking.email}</span>
                </div>
            </div>
            
            ${
              booking.medicalConditions
                ? `
            <div class="medical-alert">
                <h4>⚠️ Medical Conditions</h4>
                <p><strong>Important:</strong> This customer has indicated medical conditions that require attention:</p>
                <p style="font-style: italic;">"${booking.medicalConditions}"</p>
                <p><small>Please ensure the instructor is aware before the session begins.</small></p>
            </div>
            `
                : ""
            }
            
            ${
              booking.specialRequests
                ? `
            <div style="background: #d1ecf1; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <h4 style="margin-top: 0; color: #0c5460;">💬 Special Requests</h4>
                <p style="font-style: italic;">"${booking.specialRequests}"</p>
            </div>
            `
                : ""
            }
            
            <div style="background: #d4edda; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
                <p style="margin: 0; color: #155724;"><strong>✅ Customer confirmation email has been sent automatically.</strong></p>
            </div>
        </div>
    </div>
</body>
</html>
  `;
}
