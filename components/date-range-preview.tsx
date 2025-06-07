import React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Button } from "./ui/button";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "./ui/calendar";

type Props = {
  selectedDays: Date[];
  onSelect?: (days: Date[], selectedDay: Date) => void;
};

const DateRangePreview = ({ selectedDays, onSelect }: Props) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="ml-auto">
          <CalendarIcon className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0">
        <Calendar
          mode="multiple"
          selected={selectedDays}
          onSelect={(days, selectedDay) => {
            onSelect?.(days || [], selectedDay);
          }}
          showOutsideDays={true}
          fixedWeeks
        />
      </PopoverContent>
    </Popover>
  );
};

export default DateRangePreview;
