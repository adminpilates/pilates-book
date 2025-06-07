import type {
  SessionType,
  Session,
  Booking,
  ExperienceLevel,
} from "@prisma/client";

export type SessionWithType = Session & {
  sessionType: SessionType;
  _count: {
    bookings: number;
  };
};

export type BookingWithSession = Booking & {
  session: Session & {
    sessionType: SessionType;
  };
};

export interface CreateBookingData {
  sessionId: number;
  fullName: string;
  email: string;
  phone: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  medicalConditions?: string;
  experience: ExperienceLevel;
  specialRequests?: string;
}

export interface SessionStats {
  totalSessions: number;
  totalBookings: number;
  availableSlots: number;
  averageUtilization: number;
}

export interface DashboardStats {
  totalBookings: number;
  todayBookings: number;
  weeklyRevenue: number;
  averageCapacity: number;
}
