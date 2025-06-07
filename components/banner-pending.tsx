"use client";
import { X } from "lucide-react";
import React, { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";

type Props = {
  todayPendingBookingsCount: number;
  onClose: () => void;
};

const BannerPending = () => {
  const [showBanner, setShowBanner] = React.useState(false);
  // today pending bookings
  const { data: todayPendingBookings = [] } = useQuery({
    queryKey: ["todayPendingBookings"],
    queryFn: async () => {
      const today = format(new Date(), "yyyy-MM-dd");

      const response = await fetch(
        `/api/bookings?fromDate=${today}&toDate=${today}&status=PENDING`
      );
      if (!response.ok) throw new Error("Failed to fetch bookings");
      return response.json();
    },
  });

  const todayPendingBookingsCount = todayPendingBookings.length;

  useEffect(() => {
    if (todayPendingBookingsCount > 0) {
      setShowBanner(true);
    }
  }, [todayPendingBookingsCount]);

  if (!showBanner) return null;

  return (
    <div className="absolute w-full bg-primary top-0 z-10">
      <div className="flex items-center justify-between p-4">
        <div>
          <p className="text-primary-foreground">
            {todayPendingBookingsCount} pending bookings today
          </p>
        </div>
        <button
          onClick={() => setShowBanner(false)}
          className="text-primary-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default BannerPending;
