"use client";

import DateRangePreview from "@/components/date-range-preview";
import SummaryStats from "@/components/summary-stats";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  CalendarDays,
  CalendarIcon,
  Clock,
  Edit,
  Filter,
  Loader2,
  Plus,
  Search,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";

const daysOfWeek = [
  { id: "senin", label: "Senin" },
  { id: "selasa", label: "Selasa" },
  { id: "rabu", label: "Rabu" },
  { id: "kamis", label: "Kamis" },
  { id: "jumat", label: "Jumat" },
  { id: "sabtu", label: "Sabtu" },
  { id: "minggu", label: "Minggu" },
];

export default function SessionsPage() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<any>(null);
  const [filters, setFilters] = useState({
    search: "",
    sessionType: "all",
    startDate: "",
    endDate: "",
  });
  const [newSession, setNewSession] = useState({
    sessionTypeId: "",
    startDate: "",
    endDate: "",
    excludeDate: [] as Date[],
    time: "",
    selectedDays: [] as string[],
    useDateRange: false,
  });
  const [editSession, setEditSession] = useState({
    sessionTypeId: "",
    date: "",
    time: "",
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Set default date range to this week
  const getThisWeekDates = () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    return {
      start: today.toISOString().split("T")[0],
      end: tomorrow.toISOString().split("T")[0],
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

  // Fetch sessions with filters
  const {
    data: allSessions = [],
    isLoading: sessionsLoading,
    error: sessionsError,
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
  const sessions = allSessions.filter((session: any) => {
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

  // Fetch session types
  const { data: sessionTypes = [] } = useQuery({
    queryKey: ["sessionTypes"],
    queryFn: async () => {
      const response = await fetch("/api/session-types");
      if (!response.ok) throw new Error("Failed to fetch session types");
      return response.json();
    },
  });

  // Create sessions mutation (bulk)
  const createSessionsMutation = useMutation({
    mutationFn: async (sessionsData: any[]) => {
      const results = await Promise.allSettled(
        sessionsData.map(async (sessionData) => {
          const response = await fetch("/api/sessions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(sessionData),
          });
          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Failed to create session");
          }
          return response.json();
        })
      );

      const successful = results.filter(
        (result) => result.status === "fulfilled"
      ).length;
      const failed = results.filter(
        (result) => result.status === "rejected"
      ).length;

      return { successful, failed, results };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      setNewSession({
        sessionTypeId: "",
        startDate: "",
        endDate: "",
        time: "",
        excludeDate: [],
        selectedDays: [],
        useDateRange: false,
      });
      setIsAddDialogOpen(false);

      if (data.failed > 0) {
        toast({
          title: "Partial Success",
          description: `${data.successful} sessions created, ${data.failed} failed (possibly duplicates).`,
        });
      } else {
        toast({
          title: "Sessions Created",
          description: `${data.successful} sessions have been added successfully.`,
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update session mutation
  const updateSessionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await fetch(`/api/sessions/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update session");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      setIsEditDialogOpen(false);
      setEditingSession(null);
      toast({
        title: "Session Updated",
        description: "The session has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete session mutation
  const deleteSessionMutation = useMutation({
    mutationFn: async (sessionId: number) => {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete session");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      toast({
        title: "Session Deleted",
        description: "The session has been removed successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const generateSessionsData = () => {
    const sessionsData = [];

    if (newSession.useDateRange && newSession.startDate && newSession.endDate) {
      // Generate sessions for date range
      const startDate = new Date(newSession.startDate);
      const endDate = new Date(newSession.endDate);
      const currentDate = new Date(startDate);

      while (currentDate <= endDate) {
        const dayName = currentDate
          .toLocaleDateString("id-ID", { weekday: "long" })
          .toLowerCase();

        console.log(dayName);

        if (newSession.selectedDays.includes(dayName)) {
          const curr = format(currentDate, "yyyy-MM-dd");
          const excludeDate = newSession.excludeDate.map((date) =>
            format(date, "yyyy-MM-dd")
          );

          console.log(curr);
          console.log(excludeDate);

          if (!excludeDate.includes(curr)) {
            sessionsData.push({
              sessionTypeId: Number.parseInt(newSession.sessionTypeId),
              date: curr,
              time: newSession.time,
            });
          }
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }
    } else if (newSession.startDate) {
      // Single session
      sessionsData.push({
        sessionTypeId: Number.parseInt(newSession.sessionTypeId),
        date: newSession.startDate,
        time: newSession.time,
      });
    }
    return sessionsData;
  };
  console.log(generateSessionsData());
  const handleAddSessions = () => {
    if (
      !newSession.sessionTypeId ||
      !newSession.startDate ||
      !newSession.time
    ) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (newSession.useDateRange) {
      if (!newSession.endDate || newSession.selectedDays.length === 0) {
        toast({
          title: "Missing Information",
          description:
            "Please select end date and days of the week for bulk creation.",
          variant: "destructive",
        });
        return;
      }
    }

    const sessionsData = generateSessionsData();

    if (sessionsData.length === 0) {
      toast({
        title: "No Sessions to Create",
        description: "Please check your date range and selected days.",
        variant: "destructive",
      });
      return;
    }

    createSessionsMutation.mutate(sessionsData);
  };

  const handleEditSession = (session: any) => {
    setEditingSession(session);
    setEditSession({
      sessionTypeId: session.sessionType.id.toString(),
      date: session.date.split("T")[0],
      time: session.time,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateSession = () => {
    if (!editSession.sessionTypeId || !editSession.date || !editSession.time) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    updateSessionMutation.mutate({
      id: editingSession.id,
      data: {
        sessionTypeId: Number.parseInt(editSession.sessionTypeId),
        date: editSession.date,
        time: editSession.time,
      },
    });
  };

  const handleDayToggle = (dayId: string) => {
    setNewSession((prev) => ({
      ...prev,
      selectedDays: prev.selectedDays.includes(dayId)
        ? prev.selectedDays.filter((d) => d !== dayId)
        : [...prev.selectedDays, dayId],
    }));
  };

  const clearFilters = () => {
    const thisWeek = getThisWeekDates();
    setFilters({
      search: "",
      sessionType: "all",
      startDate: thisWeek.start,
      endDate: thisWeek.end,
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

  const groupedSessions = sessions.reduce(
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

  if (sessionsError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Sessions Management</h1>
          <p className="text-muted-foreground">
            Schedule and manage Pilates sessions
          </p>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <p className="text-red-600 mb-2">Failed to load sessions</p>
              <p className="text-muted-foreground">
                Please try refreshing the page
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Sessions Management</h1>
          <p className="text-muted-foreground">
            Schedule and manage Pilates sessions
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Session(s)
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Session(s)</DialogTitle>
              <DialogDescription>
                Schedule new Pilates sessions for your studio.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="sessionType">Session Type</Label>
                <Select
                  value={newSession.sessionTypeId}
                  onValueChange={(value) =>
                    setNewSession((prev) => ({ ...prev, sessionTypeId: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select session type" />
                  </SelectTrigger>
                  <SelectContent>
                    {sessionTypes.map((type: any) => (
                      <SelectItem key={type.id} value={type.id.toString()}>
                        {type.name} ({type.duration} min, max {type.capacity}{" "}
                        people)
                        {type.price && ` - ${formatPrice(type.price)}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="useDateRange"
                  checked={newSession.useDateRange}
                  onCheckedChange={(checked) =>
                    setNewSession((prev) => ({
                      ...prev,
                      useDateRange: checked as boolean,
                    }))
                  }
                />
                <Label htmlFor="useDateRange" className="text-sm font-medium">
                  Create multiple sessions (date range)
                </Label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">
                    {newSession.useDateRange ? "Start Date" : "Date"}
                  </Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={newSession.startDate}
                    onChange={(e) =>
                      setNewSession((prev) => ({
                        ...prev,
                        startDate: e.target.value,
                      }))
                    }
                  />
                </div>
                {newSession.useDateRange && (
                  <div>
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={newSession.endDate}
                      onChange={(e) =>
                        setNewSession((prev) => ({
                          ...prev,
                          endDate: e.target.value,
                        }))
                      }
                      min={newSession.startDate}
                    />
                  </div>
                )}
              </div>

              {newSession.useDateRange && (
                <div>
                  <div className="flex items-center justify-between space-x-2">
                    <Label className="text-sm font-medium">
                      Days of the Week
                    </Label>
                    {/* Select All Checkbox */}
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="selectAllDays"
                        checked={
                          newSession.selectedDays.length === daysOfWeek.length
                        }
                        onCheckedChange={() => {
                          if (
                            newSession.selectedDays.length === daysOfWeek.length
                          ) {
                            setNewSession((prev) => ({
                              ...prev,
                              selectedDays: [],
                            }));
                          } else {
                            setNewSession((prev) => ({
                              ...prev,
                              selectedDays: daysOfWeek.map((day) => day.id),
                            }));
                          }
                        }}
                      />
                      <Label htmlFor="selectAllDays" className="text-sm">
                        Select All
                      </Label>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {daysOfWeek.map((day) => (
                      <div key={day.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={day.id}
                          checked={newSession.selectedDays.includes(day.id)}
                          onCheckedChange={() => handleDayToggle(day.id)}
                        />
                        <Label htmlFor={day.id} className="text-sm">
                          {day.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="time">Time</Label>
                <Input
                  id="time"
                  type="time"
                  value={newSession.time}
                  onChange={(e) =>
                    setNewSession((prev) => ({ ...prev, time: e.target.value }))
                  }
                />
              </div>

              {newSession.useDateRange &&
                newSession.selectedDays.length > 0 &&
                newSession.startDate &&
                newSession.endDate && (
                  <div className="flex justify-between items-center bg-blue-50 p-3 rounded-lg">
                    <div>
                      <div className="flex items-center gap-2 text-blue-700 mb-1">
                        <CalendarDays className="h-4 w-4" />
                        <span className="text-sm font-medium">Preview</span>
                      </div>
                      <p className="text-sm text-blue-600">
                        Will create approximately{" "}
                        {generateSessionsData().length} sessions
                      </p>
                    </div>

                    <DateRangePreview
                      selectedDays={generateSessionsData().map(
                        (session) => new Date(session.date)
                      )}
                      onSelect={(days, selectedDay) => {
                        // if already in excludeDate, remove it, else add it
                        const formattedSelectedDay = format(
                          selectedDay,
                          "yyyy-MM-dd"
                        );
                        const formattedExcludeDate = newSession.excludeDate.map(
                          (date) => format(date, "yyyy-MM-dd")
                        );
                        if (
                          formattedExcludeDate.includes(formattedSelectedDay)
                        ) {
                          const currentExcludeDate = [
                            ...newSession.excludeDate,
                          ];
                          currentExcludeDate.splice(
                            currentExcludeDate.indexOf(selectedDay),
                            1
                          );
                          setNewSession((prev) => ({
                            ...prev,
                            excludeDate: currentExcludeDate,
                          }));
                        } else {
                          const currentExcludeDate = [
                            ...newSession.excludeDate,
                          ];
                          currentExcludeDate.push(selectedDay);
                          setNewSession((prev) => ({
                            ...prev,
                            excludeDate: currentExcludeDate,
                          }));
                        }
                      }}
                    />
                  </div>
                )}

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddSessions}
                  disabled={createSessionsMutation.isPending}
                  className="flex-1"
                >
                  {createSessionsMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    `Create Session${newSession.useDateRange ? "s" : ""}`
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
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
                    setFilters((prev) => ({ ...prev, search: e.target.value }))
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
                  setFilters((prev) => ({ ...prev, startDate: e.target.value }))
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
                  setFilters((prev) => ({ ...prev, endDate: e.target.value }))
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
            <span>Showing {sessions.length} sessions</span>
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

      {/* Edit Session Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Session</DialogTitle>
            <DialogDescription>Update the session details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editSessionType">Session Type</Label>
              <Select
                value={editSession.sessionTypeId}
                onValueChange={(value) =>
                  setEditSession((prev) => ({ ...prev, sessionTypeId: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select session type" />
                </SelectTrigger>
                <SelectContent>
                  {sessionTypes.map((type: any) => (
                    <SelectItem key={type.id} value={type.id.toString()}>
                      {type.name} ({type.duration} min, max {type.capacity}{" "}
                      people)
                      {type.price && ` - ${formatPrice(type.price)}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="editDate">Date</Label>
              <Input
                id="editDate"
                type="date"
                value={editSession.date}
                onChange={(e) =>
                  setEditSession((prev) => ({ ...prev, date: e.target.value }))
                }
              />
            </div>

            <div>
              <Label htmlFor="editTime">Time</Label>
              <Input
                id="editTime"
                type="time"
                value={editSession.time}
                onChange={(e) =>
                  setEditSession((prev) => ({ ...prev, time: e.target.value }))
                }
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateSession}
                disabled={updateSessionMutation.isPending}
                className="flex-1"
              >
                {updateSessionMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Session"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sessions by Date */}
      {sessionsLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin mb-4" />
              <p className="text-muted-foreground">Loading sessions...</p>
            </div>
          </CardContent>
        </Card>
      ) : sortedDates.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <CalendarIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No sessions found</h3>
              <p className="text-muted-foreground">
                Try adjusting your filters or create your first session.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {sortedDates.map((date) => (
            <div key={date}>
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                {formatDate(date)}
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupedSessions[date]
                  .sort((a: any, b: any) => a.time.localeCompare(b.time))
                  .map((session: any) => {
                    const utilizationRate = session.utilizationRate || 0;

                    return (
                      <Card
                        key={session.id}
                        className="hover:shadow-md transition-shadow"
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
                        <CardContent className="space-y-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock className="h-4 w-4" />
                            <span>{session.time}</span>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                <span>Capacity</span>
                              </div>
                              <span className="font-medium">
                                {session.bookedSlots}/
                                {session.sessionType.capacity}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  utilizationRate >= 90
                                    ? "bg-red-500"
                                    : utilizationRate >= 70
                                    ? "bg-yellow-500"
                                    : "bg-green-500"
                                }`}
                                style={{ width: `${utilizationRate}%` }}
                              ></div>
                            </div>
                            <div className="text-xs text-gray-500 text-center">
                              {utilizationRate}% utilized •{" "}
                              {session.availableSlots} spots available
                            </div>
                          </div>

                          <div className="flex gap-2 pt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => handleEditSession(session)}
                              disabled={updateSessionMutation.isPending}
                            >
                              <Edit className="mr-2 h-3 w-3" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                deleteSessionMutation.mutate(session.id)
                              }
                              className="text-red-600 hover:text-red-700"
                              disabled={
                                session.bookedSlots > 0 ||
                                deleteSessionMutation.isPending
                              }
                            >
                              {deleteSessionMutation.isPending ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Trash2 className="h-3 w-3" />
                              )}
                            </Button>
                          </div>

                          {session.bookedSlots > 0 && (
                            <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                              ⚠️ {session.bookedSlots} booking
                              {session.bookedSlots > 1 ? "s" : ""} - cannot
                              delete
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      <SummaryStats sessions={sessions} />
    </div>
  );
}
