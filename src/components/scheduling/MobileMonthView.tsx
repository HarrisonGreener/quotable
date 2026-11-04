import { useState } from "react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, isToday, addMonths, subMonths } from "date-fns";
import { MobileAgendaList } from "./MobileAgendaList";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface MobileMonthViewProps {
  currentMonth: Date;
  schedules: any[];
  quotes: any[];
  invoices: any[];
  onScheduleClick: (schedule: any) => void;
}

export const MobileMonthView = ({ currentMonth: propCurrentMonth, schedules, quotes, invoices, onScheduleClick }: MobileMonthViewProps) => {
  const [currentMonth, setCurrentMonth] = useState(propCurrentMonth);
  const [selectedDay, setSelectedDay] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const calendarDays: Date[] = [];
  let day = startDate;
  while (day <= endDate) {
    calendarDays.push(day);
    day = addDays(day, 1);
  }

  const handlePreviousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const handleToday = () => {
    setCurrentMonth(new Date());
    setSelectedDay(new Date());
  };

  const getSchedulesForDay = (day: Date) => {
    const dayStart = new Date(day);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(day);
    dayEnd.setHours(23, 59, 59, 999);
    
    return schedules.filter((schedule: any) => {
      const startDate = new Date(schedule.start_date || schedule.startDate);
      const endDate = new Date(schedule.end_date || schedule.endDate);
      return startDate <= dayEnd && endDate >= dayStart;
    });
  };

  const getPaymentWindowForDay = (day: Date) => {
    return invoices.filter((invoice: any) => {
      if (invoice.status?.toLowerCase() !== "sent") return false;
      const dueDate = new Date(invoice.due_date);
      const daysDiff = Math.ceil((dueDate.getTime() - day.getTime()) / (1000 * 60 * 60 * 24));
      return daysDiff >= 0 && daysDiff <= 30;
    });
  };

  const selectedDaySchedules = getSchedulesForDay(selectedDay);

  return (
    <div className="flex flex-col h-full pb-20">
      {/* Navigation Header */}
      <div className="flex flex-col gap-2 px-4 py-3 border-b bg-background sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handlePreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={handleToday}>
              Today
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <h2 className="text-xl font-bold">
          {format(currentMonth, "MMMM yyyy")}
        </h2>
      </div>

      {/* Mini Calendar */}
      <div className="px-4 py-4 border-b bg-background">
        <div className="grid grid-cols-7 gap-1">
          {/* Week day headers */}
          {["M", "T", "W", "T", "F", "S", "S"].map((day, i) => (
            <div key={i} className="text-center text-xs font-medium text-muted-foreground py-2">
              {day}
            </div>
          ))}

          {/* Calendar days */}
          {calendarDays.map((day) => {
            const daySchedules = getSchedulesForDay(day);
            const paymentWindows = getPaymentWindowForDay(day);
            const hasEvents = daySchedules.length > 0;
            const hasPayments = paymentWindows.length > 0;
            const isSelected = isSameDay(day, selectedDay);
            const isTodayDate = isToday(day);
            const isCurrentMonth = isSameMonth(day, currentMonth);

            return (
              <button
                key={day.toISOString()}
                className={cn(
                  "aspect-square min-h-[40px] rounded-md flex flex-col items-center justify-center relative transition-colors",
                  !isCurrentMonth && "text-muted-foreground/40",
                  isSelected && "bg-primary text-primary-foreground",
                  !isSelected && isTodayDate && "ring-2 ring-primary ring-inset",
                  !isSelected && !isTodayDate && "hover:bg-accent",
                  hasPayments && !isSelected && "bg-yellow-500/5"
                )}
                onClick={() => setSelectedDay(day)}
              >
                <span className={cn("text-sm", isSelected && "font-semibold")}>
                  {format(day, "d")}
                </span>
                <div className="flex gap-0.5 mt-0.5">
                  {hasEvents && (
                    <div className="w-1 h-1 rounded-full bg-blue-500" />
                  )}
                  {hasPayments && (
                    <div className="w-1 h-1 rounded-full bg-yellow-500" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
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
