import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Props = {
  sessions: any[];
};

const SummaryStats = ({ sessions }: Props) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Session Overview</CardTitle>
        <CardDescription>Summary of all scheduled sessions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold">{sessions.length}</div>
            <div className="text-sm text-muted-foreground">Total Sessions</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              {sessions.reduce(
                (sum: number, session: any) => sum + (session.bookedSlots || 0),
                0
              )}
            </div>
            <div className="text-sm text-muted-foreground">Total Bookings</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600">
              {sessions.reduce(
                (sum: number, session: any) =>
                  sum + (session.availableSlots || 0),
                0
              )}
            </div>
            <div className="text-sm text-muted-foreground">Available Spots</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">
              {sessions.length > 0
                ? Math.round(
                    sessions.reduce(
                      (sum: number, session: any) =>
                        sum + (session.utilizationRate || 0),
                      0
                    ) / sessions.length
                  )
                : 0}
              %
            </div>
            <div className="text-sm text-muted-foreground">
              Avg. Utilization
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SummaryStats;
