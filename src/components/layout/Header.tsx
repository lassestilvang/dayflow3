"use client";


import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCalendarStore, useSettingsStore } from "@/store";
import { formatDate } from "@/lib/dateUtils";

export function Header() {
  const {
    currentDate,
    view,
    setView,
    navigatePrevious,
    navigateNext,
    navigateToday,
    getWeekStart,
    getWeekEnd,
  } = useCalendarStore();
  const { settings } = useSettingsStore();

  const formatHeaderDate = () => {
    switch (view) {
      case "day":
        return formatDate(currentDate, settings);
      case "week":
        const weekStart = getWeekStart();
        const weekEnd = getWeekEnd();
        if (weekStart.getMonth() === weekEnd.getMonth()) {
          return (
            formatDate(weekStart, settings) + " – " + formatDate(weekEnd, settings)
          );
        } else {
          return (
            formatDate(weekStart, settings) +
            " – " +
            formatDate(weekEnd, settings)
          );
        }
      case "month":
        return formatDate(currentDate, settings);
      default:
        return "";
    }
  };

  return (
    <div className="h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="h-full px-6 flex items-center justify-between">
        {/* Navigation */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={navigatePrevious}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={navigateToday}>
            Today
          </Button>
          <Button variant="ghost" size="sm" onClick={navigateNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>

          {/* Current Date Display */}
          <h2 className="text-xl font-semibold ml-4">{formatHeaderDate()}</h2>
        </div>

        {/* View Switcher - aligned to right */}
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          <Button
            variant={view === "day" ? "default" : "ghost"}
            size="sm"
            onClick={() => setView("day")}
            className="h-8 px-3"
          >
            Day
          </Button>
          <Button
            variant={view === "week" ? "default" : "ghost"}
            size="sm"
            onClick={() => setView("week")}
            className="h-8 px-3"
          >
            Week
          </Button>
          <Button
            variant={view === "month" ? "default" : "ghost"}
            size="sm"
            onClick={() => setView("month")}
            className="h-8 px-3"
          >
            Month
          </Button>
        </div>
      </div>
    </div>
  );
}
