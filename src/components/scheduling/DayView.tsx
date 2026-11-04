import { useState } from "react";
import { format, addDays, subDays, isSameDay, addHours, startOfDay } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { JobDetailsDrawer } from "./JobDetailsDrawer";
import { ScheduleJobDialog } from "./ScheduleJobDialog";
import { PaymentWindowTooltip } from "./PaymentWindowTooltip";
import { useIsMobile } from "@/hooks/use-mobile";

interface DayViewProps {
  isDemo: boolean;
  schedules: any[];
  quotes: any[];
  invoices: any[];
  onQuoteDrop: (quote: any, date: Date) => void;
}

export const DayView = ({ isDemo, schedules, quotes, invoices, onQuoteDrop }: DayViewProps) => {
  const isMobile = useIsMobile();
  const [currentDay, setCurrentDay] = useState(new Date());
  const [selectedSchedule, setSelectedSchedule] = useState<any>(null);
  const [isDetailsDrawerOpen, setIsDetailsDrawerOpen] = useState(false);
  const [hoveredCell, setHoveredCell] = useState<number | null>(null);

  const hours = Array.from({ length: 24 }, (_, i) => i);

  const handlePreviousDay = () => setCurrentDay(subDays(currentDay, 1));
  const handleNextDay = () => setCurrentDay(addDays(currentDay, 1));
  const handleToday = () => setCurrentDay(new Date());

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, hour: number) => {
    e.preventDefault();
    const quoteData = e.dataTransfer.getData("quote");
    if (quoteData) {
      const quote = JSON.parse(quoteData);
      const dateWithTime = addHours(startOfDay(currentDay), hour);
      onQuoteDrop(quote, dateWithTime);
    }
  };

  const formatTimeBlock = (schedule: any) => {
    const startTime = schedule.start_time || schedule.startTime || "09:00";
    const [hours, minutes] = startTime.split(':').map(Number);
    const durationHours = schedule.duration_hours || schedule.durationHours || 0;
    
    if (durationHours > 0) {
      const endHours = hours + durationHours;
      const formatTime = (h: number, m: number) => {
        const period = h >= 12 ? 'PM' : 'AM';
        const displayHour = h % 12 || 12;
        return `${displayHour}:${m.toString().padStart(2, '0')} ${period}`;
      };
      return `${formatTime(hours, minutes)} - ${formatTime(endHours, minutes)}`;
    }
    return null;
  };

  const getSchedulesForHour = (hour: number) => {
    return schedules.filter((s: any) => {
      const startDate = new Date(s.start_date || s.startDate);
      const endDate = new Date(s.end_date || s.endDate);
      
      // Check if the current day falls within the schedule's date range
      if (!isSameDay(currentDay, startDate) && !(currentDay >= startDate && currentDay <= endDate)) {
        return false;
      }
      
      const durationHours = s.duration_hours || s.durationHours || 0;
      const durationDays = s.duration_days || s.durationDays || 0;
      
      // For day-based schedules (duration_days > 0 and no hours), show in all hours of matching days
      if (durationDays > 0 && durationHours === 0) {
        return isSameDay(currentDay, startDate) || (currentDay >= startDate && currentDay <= endDate);
      }
      
      // For hour-based schedules, check if this hour falls within the time range
      if (durationHours > 0) {
        // Only show on the start date for hour-based schedules
        if (!isSameDay(currentDay, startDate)) return false;
        
        const startTime = s.start_time || s.startTime || "09:00";
        const [startHour] = startTime.split(':').map(Number);
        const endHour = startHour + durationHours;
        
        // Check if this hour is within the scheduled time block
        return hour >= startHour && hour < endHour;
      }
      
      // Fallback for schedules without proper duration data
      return isSameDay(currentDay, startDate);
    });
  };

  const getPaymentWindowForDay = () => {
    return invoices.filter((inv: any) => {
      if (inv.status?.toLowerCase() === "paid") return false;
      const invoiceDate = new Date(inv.date);
      const dueDate = new Date(inv.due_date);
      return currentDay >= invoiceDate && currentDay <= dueDate;
    });
  };

  const paymentWindows = getPaymentWindowForDay();
  const hasPaymentWindow = paymentWindows.length > 0;

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "draft": return "bg-blue-500 border-blue-600 hover:bg-blue-600";
      case "pending": return "bg-yellow-500 border-yellow-600 hover:bg-yellow-600";
      case "approved": return "bg-green-500 border-green-600 hover:bg-green-600";
      case "completed": return "bg-teal-500 border-teal-600 hover:bg-teal-600";
      case "overdue": return "bg-red-500 border-red-600 hover:bg-red-600";
      default: return "bg-gray-500 border-gray-600 hover:bg-gray-600";
    }
  };

  const getPaymentShading = () => {
    if (!hasPaymentWindow) return "";
    const invoice = paymentWindows[0];
    const daysUntilDue = Math.ceil((new Date(invoice.due_date).getTime() - currentDay.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilDue <= 3) return "bg-red-500/20";
    if (daysUntilDue <= 7) return "bg-orange-500/15";
    if (daysUntilDue <= 14) return "bg-yellow-500/10";
    return "bg-blue-500/5";
  };

  return (
    <div className="flex flex-col h-full">
      <div className={cn("mb-4", isMobile ? "flex flex-col gap-2" : "flex items-center justify-between")}>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePreviousDay}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={handleToday}>
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={handleNextDay}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <h2 className="text-lg font-semibold">
          {format(currentDay, isMobile ? "EEE, MMM d" : "EEEE, MMMM d, yyyy")}
        </h2>
      </div>

      <div className={cn(
        "flex-1 border border-border rounded-lg overflow-auto bg-card",
        hasPaymentWindow && getPaymentShading()
      )}>
        <div className={isMobile ? "w-full" : "min-w-[600px]"}>
          {hours.map((hour) => {
            const hourSchedules = getSchedulesForHour(hour);
            const isHovered = hoveredCell === hour;

            return (
              <div
                key={hour}
                className={cn(
                  "border-b border-border flex hover:bg-muted/50 transition-colors",
                  hour === new Date().getHours() && isSameDay(currentDay, new Date()) && "bg-primary/5"
                )}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, hour)}
                onMouseEnter={() => setHoveredCell(hour)}
                onMouseLeave={() => setHoveredCell(null)}
              >
                <div className={cn("flex-shrink-0 p-3 text-sm text-muted-foreground border-r border-border", isMobile ? "w-14 p-2" : "w-20")}>
                  {format(addHours(startOfDay(currentDay), hour), isMobile ? "h a" : "h:mm a")}
                </div>
                <div className={cn("flex-1 p-2 relative", isMobile ? "min-h-[70px]" : "min-h-[60px]")}>
                  {hourSchedules.map((schedule: any) => {
                    const quote = quotes.find((q: any) => q.id === (schedule.quote_id || schedule.quoteId));
                    const status = quote?.status || "draft";

                    return (
                      <div
                        key={schedule.id}
                        onClick={() => {
                          setSelectedSchedule(schedule);
                          setIsDetailsDrawerOpen(true);
                        }}
                        className={cn(
                          "mb-1 p-2 rounded border-l-4 cursor-pointer text-white text-xs transition-all",
                          getStatusColor(status)
                        )}
                      >
                        <div className="font-medium truncate">{quote?.client}</div>
                        <div className="text-white/80 truncate">{quote?.title}</div>
                        {formatTimeBlock(schedule) && (
                          <div className="text-white/90 text-[10px] mt-1 font-medium">
                            {formatTimeBlock(schedule)} ({schedule.duration_hours || schedule.durationHours}h)
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {isHovered && hasPaymentWindow && (
                    <PaymentWindowTooltip
                      paymentWindows={paymentWindows}
                      quotes={quotes}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <JobDetailsDrawer
        open={isDetailsDrawerOpen}
        onOpenChange={setIsDetailsDrawerOpen}
        schedule={selectedSchedule}
        isDemo={isDemo}
      />
    </div>
  );
};
