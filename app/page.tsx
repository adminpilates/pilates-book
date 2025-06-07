"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  Clock,
  Users,
  Phone,
  Loader2,
  Search,
  Filter,
  X,
} from "lucide-react";
import { BookingModal } from "@/components/booking-modal";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function HomePage() {
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    sessionType: "all",
    search: "",
  });
  const { toast } = useToast();

  // Set default date range to this week
  const getThisWeekDates = () => {
    const today = new Date();
    const todayPlus7 = new Date();
    todayPlus7.setDate(today.getDate() + 7);

    return {
      start: today.toISOString().split("T")[0],
      end: todayPlus7.toISOString().split("T")[0],
    };
  };

  // Initialize with this week's dates
  useState(() => {
    const thisWeek = getThisWeekDates();
    setFilters((prev) => ({
      ...prev,
      startDate: thisWeek.start,
      endDate: thisWeek.end,
    }));
  });

  // Fetch session types
  const { data: sessionTypes = [], isLoading: sessionTypesLoading } = useQuery({
    queryKey: ["sessionTypes"],
    queryFn: async () => {
      const response = await fetch("/api/session-types");
      if (!response.ok) throw new Error("Failed to fetch session types");
      return response.json();
    },
  });

  // Fetch sessions with filters
  const {
    data: sessions = [],
    isLoading: sessionsLoading,
    refetch: refetchSessions,
  } = useQuery({
    queryKey: ["sessions", filters.startDate, filters.endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.startDate) params.append("fromDate", filters.startDate);
      if (filters.endDate) params.append("toDate", filters.endDate);

      const response = await fetch(`/api/sessions?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch sessions");
      return response.json();
    },
    enabled: !!filters.startDate && !!filters.endDate,
  });

  // Filter sessions based on search and session type
  const filteredSessions = useMemo(() => {
    return sessions.filter((session: any) => {
      const matchesType =
        filters.sessionType === "all" ||
        session.sessionType.name === filters.sessionType;
      const matchesSearch =
        filters.search === "" ||
        session.sessionType.name
          .toLowerCase()
          .includes(filters.search.toLowerCase()) ||
        session.sessionType.description
          .toLowerCase()
          .includes(filters.search.toLowerCase());

      return matchesType && matchesSearch;
    });
  }, [sessions, filters.sessionType, filters.search]);

  const handleBookSession = (session: any) => {
    if (session.availableSlots > 0) {
      setSelectedSession(session);
      setIsBookingModalOpen(true);
    } else {
      toast({
        title: "Session Full",
        description:
          "This session is fully booked. Please choose another time.",
        variant: "destructive",
      });
    }
  };

  const handleBookingSuccess = () => {
    setIsBookingModalOpen(false);
    setSelectedSession(null);
    refetchSessions();
    toast({
      title: "Booking Confirmed!",
      description:
        "Your Pilates session has been booked successfully. You'll receive a confirmation email shortly.",
    });
  };

  const clearFilters = () => {
    const thisWeek = getThisWeekDates();
    setFilters({
      startDate: thisWeek.start,
      endDate: thisWeek.end,
      sessionType: "all",
      search: "",
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const groupedSessions = filteredSessions.reduce(
    (acc: Record<string, any[]>, session: any) => {
      const key = session.date.split("T")[0];
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(session);
      return acc;
    },
    {}
  );

  const sortedDates = Object.keys(groupedSessions).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );

  if (sessionTypesLoading || sessionsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading sessions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Pilates Studio
              </h1>
              <p className="text-gray-600">Book your perfect session</p>
            </div>
            <Button variant="outline" asChild>
              <a href="/admin">Admin Dashboard</a>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Session Types Overview */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Our Session Types
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {sessionTypes.map((type: any) => (
              <Card key={type.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl">{type.name}</CardTitle>
                    <div className="text-right">
                      <Badge className={type.color}>{type.duration} min</Badge>
                      {type.price && (
                        <div className="text-lg font-bold text-green-600 mt-1">
                          {formatPrice(type.price)}
                        </div>
                      )}
                    </div>
                  </div>
                  <CardDescription>{type.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="h-4 w-4" />
                    <span>Max {type.capacity} participants</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Filters Section */}
        <section className="mb-8">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  <CardTitle>Filter Sessions</CardTitle>
                </div>
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="search">Search Sessions</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Search by name or description..."
                      value={filters.search}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          search: e.target.value,
                        }))
                      }
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={filters.startDate}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        startDate: e.target.value,
                      }))
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={filters.endDate}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        endDate: e.target.value,
                      }))
                    }
                    min={filters.startDate}
                  />
                </div>

                <div>
                  <Label htmlFor="sessionType">Session Type</Label>
                  <Select
                    value={filters.sessionType}
                    onValueChange={(value) =>
                      setFilters((prev) => ({ ...prev, sessionType: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All session types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Session Types</SelectItem>
                      {sessionTypes.map((type: any) => (
                        <SelectItem key={type.id} value={type.name}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Filter Summary */}
              <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                <span>Showing {filteredSessions.length} sessions</span>
                {filters.search && (
                  <Badge variant="secondary">Search: "{filters.search}"</Badge>
                )}
                {filters.sessionType !== "all" && (
                  <Badge variant="secondary">Type: {filters.sessionType}</Badge>
                )}
                <Badge variant="outline">
                  {filters.startDate &&
                    format(new Date(filters.startDate), "dd MMM yyyy")}{" "}
                  to{" "}
                  {filters.endDate &&
                    format(new Date(filters.endDate), "dd MMM yyyy")}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Available Sessions */}
        <section>
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Available Sessions
          </h2>
          {sortedDates.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    No sessions found
                  </h3>
                  <p className="text-gray-600">
                    Try adjusting your filters or check back later for new
                    sessions.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-8">
              {sortedDates.map((date) => (
                <div key={date}>
                  <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    {formatDate(date)}
                  </h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {groupedSessions[date]
                      .sort((a: any, b: any) => a.time.localeCompare(b.time))
                      .map((session: any) => {
                        const isFullyBooked = session.availableSlots === 0;

                        return (
                          <Card
                            key={session.id}
                            className={`hover:shadow-md transition-shadow ${
                              isFullyBooked ? "opacity-60" : ""
                            }`}
                          >
                            <CardHeader className="pb-3">
                              <div className="flex justify-between items-start">
                                <CardTitle className="text-lg">
                                  {session.sessionType.name}
                                </CardTitle>
                                <div className="text-right">
                                  <Badge className={session.sessionType.color}>
                                    {session.sessionType.duration} min
                                  </Badge>
                                  {session.sessionType.price && (
                                    <div className="text-sm font-semibold text-green-600 mt-1">
                                      {formatPrice(session.sessionType.price)}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Clock className="h-4 w-4" />
                                <span>{session.time}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <Users className="h-4 w-4" />
                                <span
                                  className={
                                    session.availableSlots <= 2 &&
                                    session.availableSlots > 0
                                      ? "text-orange-600 font-medium"
                                      : session.availableSlots === 0
                                      ? "text-red-600 font-medium"
                                      : "text-gray-600"
                                  }
                                >
                                  {session.availableSlots}{" "}
                                  {session.availableSlots === 1
                                    ? "spot"
                                    : "spots"}{" "}
                                  available
                                </span>
                              </div>
                              <Button
                                className="w-full"
                                onClick={() => handleBookSession(session)}
                                disabled={isFullyBooked}
                              >
                                {isFullyBooked
                                  ? "Fully Booked"
                                  : "Book Session"}
                              </Button>
                            </CardContent>
                          </Card>
                        );
                      })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Contact Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Need Help?
            </h3>
            <div className="flex items-center justify-center gap-2 text-gray-600">
              <Phone className="h-4 w-4" />
              <span>Call us at (555) 123-4567</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Booking Modal */}
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        session={selectedSession}
        onBookingSuccess={handleBookingSuccess}
      />
    </div>
  );
}
