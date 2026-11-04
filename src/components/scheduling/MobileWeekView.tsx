import { useState } from "react";
import { format, startOfWeek, addDays, isSameDay, isToday, addWeeks, subWeeks, startOfDay, endOfDay } from "date-fns";
import { Button } from "@/components/ui/button";
import { MobileAgendaList } from "./MobileAgendaList";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface MobileWeekViewProps {
  currentWeek: Date;
  schedules: any[];
  quotes: any[];
  onScheduleClick: (schedule: any) => void;
}

export const MobileWeekView = ({ currentWeek: propCurrentWeek, schedules, quotes, onScheduleClick }: MobileWeekViewProps) => {
  const [currentWeek, setCurrentWeek] = useState(propCurrentWeek);
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const [selectedDay, setSelectedDay] = useState(new Date());

  const handlePreviousWeek = () => setCurrentWeek(subWeeks(currentWeek, 1));
  const handleNextWeek = () => setCurrentWeek(addWeeks(currentWeek, 1));
  const handleToday = () => {
    setCurrentWeek(new Date());
    setSelectedDay(new Date());
  };

  const getSchedulesForDay = (day: Date) => {
    const dayStart = startOfDay(day);
    const dayEnd = endOfDay(day);
    
    return schedules.filter((schedule: any) => {
      const startDate = new Date(schedule.start_date || schedule.startDate);
      const endDate = new Date(schedule.end_date || schedule.endDate);
      return startDate <= dayEnd && endDate >= dayStart;
    });
  };

  const selectedDaySchedules = getSchedulesForDay(selectedDay);

  return (
    <div className="flex flex-col h-full pb-20">
      {/* Navigation Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-background sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePreviousWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleToday}>
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={handleNextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <h2 className="text-sm font-semibold">
          {format(weekStart, "MMM d")} - {format(addDays(weekStart, 6), "d, yyyy")}
        </h2>
      </div>

      {/* Horizontal Day Selector - Larger touch targets */}
      <div className="grid grid-cols-7 gap-2 px-3 py-4 border-b bg-background">
        {weekDays.map((day) => {
          const daySchedules = getSchedulesForDay(day);
          const hasEvents = daySchedules.length > 0;
          const isSelected = isSameDay(day, selectedDay);
          const isTodayDate = isToday(day);

          return (
            <button
              key={day.toISOString()}
              className={cn(
                "flex flex-col items-center justify-center py-3 min-h-[72px] gap-1.5 rounded-lg transition-all",
                isSelected && "bg-primary text-primary-foreground shadow-md",
                !isSelected && isTodayDate && "ring-2 ring-primary",
                !isSelected && !isTodayDate && "hover:bg-accent active:scale-95"
              )}
              onClick={() => setSelectedDay(day)}
            >
              <span className="text-xs font-medium uppercase tracking-wide">
                {format(day, "EEE")}
              </span>
              <span className="text-xl font-bold">
                {format(day, "d")}
              </span>
              {hasEvents && (
                <div className="flex gap-1">
                  {daySchedules.slice(0, 3).map((_, i) => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-current" />
                  ))}
                  {daySchedules.length > 3 && (
                    <div className="w-1.5 h-1.5 rounded-full bg-current opacity-50" />
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Day Header */}
      <div className="px-4 py-3 border-b bg-muted/30">
        <h3 className="font-semibold text-lg">
          {format(selectedDay, "EEEE, MMMM d")}
        </h3>
      </div>

      {/* Agenda List */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <MobileAgendaList
          schedules={selectedDaySchedules}
          quotes={quotes}
          onScheduleClick={onScheduleClick}
        />
      </div>
    </div>
  );
};
