"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Calendar, TrendingUp, Clock, Loader2 } from "lucide-react";
import { format } from "date-fns";

export default function AdminDashboard() {
  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboardStats"],
    queryFn: async () => {
      const response = await fetch("/api/dashboard/stats");
      if (!response.ok) throw new Error("Failed to fetch stats");
      return response.json();
    },
  });
  const today = new Date();

  const startOfWeek = new Date(today);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 6);

  // Fetch recent bookings
  const { data: recentBookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: ["recentBookings"],
    queryFn: async () => {
      const response = await fetch("/api/dashboard/recent-bookings");
      if (!response.ok) throw new Error("Failed to fetch recent bookings");
      return response.json();
    },
  });

  // Fetch today's sessions
  const { data: todaySessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ["todaySessions"],
    queryFn: async () => {
      const today = format(new Date(), "yyyy-MM-dd");

      const response = await fetch(
        `/api/sessions?fromDate=${today}&toDate=${today}`
      );
      if (!response.ok) throw new Error("Failed to fetch sessions");
      return response.json();
    },
  });

  const thisWeekDate = `${new Date(
    format(startOfWeek, "yyyy-MM-dd")
  ).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })} - ${new Date(format(endOfWeek, "yyyy-MM-dd")).toLocaleDateString(
    "id-ID",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  )}`;

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your Pilates studio</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Bookings
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.totalBookings || 0}
            </div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Today's Bookings
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.todayBookings || 0}
            </div>
            <p className="text-xs text-muted-foreground">Sessions scheduled</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Weekly Revenue
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {/* rupiah */}
              {stats?.weeklyRevenue.toLocaleString("id-ID", {
                style: "currency",
                currency: "IDR",
              })}
            </div>
            <p className="text-xs text-muted-foreground">{thisWeekDate}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Capacity</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.averageCapacity || 0}%
            </div>
            <p className="text-xs text-muted-foreground">{thisWeekDate}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Bookings */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Bookings</CardTitle>
            <CardDescription>Latest session reservations</CardDescription>
          </CardHeader>
          <CardContent>
            {bookingsLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : recentBookings.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No recent bookings
              </p>
            ) : (
              <div className="space-y-4">
                {recentBookings.slice(0, 5).map((booking: any) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium">{booking.fullName}</p>
                      <p className="text-sm text-muted-foreground">
                        {booking.session.sessionType.name} •{" "}
                        {new Date(booking.session.date).toLocaleDateString()} at{" "}
                        {booking.session.time}
                      </p>
                    </div>
                    <Badge
                      variant={
                        booking.status === "CONFIRMED" ? "default" : "secondary"
                      }
                    >
                      {booking.status.toLowerCase()}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Today's Sessions */}
        <Card>
          <CardHeader>
            <CardTitle>Today's Sessions</CardTitle>
            <CardDescription>Session capacity overview</CardDescription>
          </CardHeader>
          <CardContent>
            {sessionsLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : todaySessions.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No sessions scheduled for today
              </p>
            ) : (
              <div className="space-y-4">
                {todaySessions.map((session: any) => (
                  <div key={session.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          {session.sessionType.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(session.date), "dd MMM yyyy")} at{" "}
                          {session.time}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {session.bookedSlots}/{session.sessionType.capacity}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {session.utilizationRate}% full
                        </p>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full"
                        style={{ width: `${session.utilizationRate}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
