import { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from "date-fns";
import { ChevronLeft, ChevronRight, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useSchedules } from "@/hooks/useSchedules";
import { useQuotes } from "@/hooks/useQuotes";
import { useInvoices } from "@/hooks/useInvoices";
import { getDemoSchedules } from "@/data/demoSchedules";
import { demoQuotes, demoInvoices } from "@/data/demoData";
import { JobDetailsDrawer } from "./JobDetailsDrawer";
import { PaymentWindowTooltip } from "./PaymentWindowTooltip";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileMonthView } from "./MobileMonthView";

interface MonthViewProps {
  isDemo: boolean;
  schedules?: any[];
  quotes?: any[];
  invoices?: any[];
  onQuoteDrop?: (quote: any, date: Date) => void;
}

export const MonthView = ({ isDemo, schedules: propSchedules, quotes: propQuotes, invoices: propInvoices, onQuoteDrop }: MonthViewProps) => {
  const isMobile = useIsMobile();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedSchedule, setSelectedSchedule] = useState<any>(null);
  const [isDetailsDrawerOpen, setIsDetailsDrawerOpen] = useState(false);
  const [hoveredDay, setHoveredDay] = useState<Date | null>(null);

  const { data: dbSchedules = [] } = useSchedules(!isDemo && !propSchedules);
  const { data: dbQuotes = [] } = useQuotes(!isDemo && !propQuotes);
  const { data: dbInvoices = [] } = useInvoices(!isDemo && !propInvoices);

  const schedules = propSchedules || (isDemo ? getDemoSchedules() : dbSchedules);
  const quotes = propQuotes || (isDemo ? demoQuotes : dbQuotes);
  const invoices = propInvoices || (isDemo ? demoInvoices : dbInvoices);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const handlePreviousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const handleToday = () => setCurrentMonth(new Date());

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, date: Date) => {
    e.preventDefault();
    const quoteData = e.dataTransfer.getData("quote");
    if (quoteData && onQuoteDrop) {
      const quote = JSON.parse(quoteData);
      onQuoteDrop(quote, date);
    }
  };

  const getSchedulesForDay = (day: Date) => {
    return schedules.filter((s: any) => {
      const startDate = new Date(s.start_date || s.startDate);
      const endDate = new Date(s.end_date || s.endDate);
      return day >= startDate && day <= endDate;
    });
  };

  const getPaymentWindowForDay = (day: Date) => {
    return invoices.filter((inv: any) => {
      if (inv.status?.toLowerCase() === "paid") return false;
      
      const invoiceDate = new Date(inv.date);
      const dueDate = new Date(inv.due_date);
      
      return day >= invoiceDate && day <= dueDate;
    });
  };

  const getDayBackgroundColor = (day: Date, hasPaymentWindow: boolean, paymentWindows: any[]) => {
    if (!hasPaymentWindow) return "";
    
    const invoice = paymentWindows[0];
    const daysUntilDue = Math.ceil((new Date(invoice.due_date).getTime() - day.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilDue <= 3) return "bg-red-500/20";
    if (daysUntilDue <= 7) return "bg-orange-500/15";
    if (daysUntilDue <= 14) return "bg-yellow-500/10";
    return "bg-blue-500/5";
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "draft": return "bg-blue-500/20 text-blue-700 dark:text-blue-300";
      case "pending": return "bg-yellow-500/20 text-yellow-700 dark:text-yellow-300";
      case "approved": return "bg-green-500/20 text-green-700 dark:text-green-300";
      case "completed": return "bg-teal-500/20 text-teal-700 dark:text-teal-300";
      case "overdue": return "bg-red-500/20 text-red-700 dark:text-red-300";
      default: return "bg-gray-500/20 text-gray-700 dark:text-gray-300";
    }
  };

  if (isMobile) {
    return (
      <>
        <MobileMonthView
          currentMonth={currentMonth}
          schedules={schedules}
          quotes={quotes}
          invoices={invoices}
          onScheduleClick={(schedule) => {
            setSelectedSchedule(schedule);
            setIsDetailsDrawerOpen(true);
          }}
        />
        <JobDetailsDrawer
          open={isDetailsDrawerOpen}
          onOpenChange={setIsDetailsDrawerOpen}
          schedule={selectedSchedule}
          isDemo={isDemo}
        />
      </>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-240px)]">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={handleToday}>
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <h2 className="text-lg font-semibold">
          {format(currentMonth, "MMMM yyyy")}
        </h2>
      </div>

      <div className="flex-1 border border-border rounded-lg overflow-hidden bg-card">
        <div className="grid grid-cols-7 border-b border-border">
          {weekDays.map((day) => (
            <div key={day} className="p-3 text-center text-sm font-semibold text-muted-foreground border-r last:border-r-0 border-border">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 auto-rows-fr" style={{ gridTemplateRows: `repeat(${Math.ceil(calendarDays.length / 7)}, 1fr)` }}>
          {calendarDays.map((day, idx) => {
            const daySchedules = getSchedulesForDay(day);
            const paymentWindows = getPaymentWindowForDay(day);
            const hasPaymentWindow = paymentWindows.length > 0;
            const isToday = isSameDay(day, new Date());
            const isCurrentMonth = isSameMonth(day, currentMonth);

            return (
              <div
                key={idx}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, day)}
                onMouseEnter={() => setHoveredDay(day)}
                onMouseLeave={() => setHoveredDay(null)}
                className={cn(
                  "border-r border-b last:border-r-0 border-border p-2 min-h-[120px] relative cursor-pointer",
                  !isCurrentMonth && "bg-muted/30",
                  isToday && "bg-accent/10",
                  getDayBackgroundColor(day, hasPaymentWindow, paymentWindows)
                )}
              >
                <div className={cn(
                  "text-sm font-medium mb-2 flex items-center justify-between",
                  isToday && "text-accent",
                  !isCurrentMonth && "text-muted-foreground"
                )}>
                  <span>{format(day, "d")}</span>
                  {hasPaymentWindow && (
                    <DollarSign className="h-3 w-3 text-green-600 dark:text-green-400" />
                  )}
                </div>
                <div className="space-y-1">
                  {daySchedules.slice(0, 3).map((schedule: any) => {
                    const quote = quotes.find((q: any) => q.id === (schedule.quote_id || schedule.quoteId));
                    if (!quote) return null;
                    const hasPaymentWindow = paymentWindows.some((pw: any) => pw.quote_id === quote.id);
                    const startTime = schedule.start_time || schedule.startTime;
                    const displayTime = startTime ? startTime.substring(0, 5) : '';

                    return (
                      <Badge
                        key={schedule.id}
                        className={cn(
                          "w-full text-xs cursor-pointer truncate relative flex items-center justify-between gap-1",
                          getStatusColor(quote.status)
                        )}
                        onClick={() => {
                          setSelectedSchedule(schedule);
                          setIsDetailsDrawerOpen(true);
                        }}
                      >
                        <span className="truncate flex items-center gap-1">
                          {hasPaymentWindow && (
                            <DollarSign className="h-2 w-2 inline-block flex-shrink-0" />
                          )}
                          {quote.title}
                        </span>
                        {displayTime && (
                          <span className="text-[10px] opacity-80 flex-shrink-0">
                            {displayTime}
                          </span>
                        )}
                      </Badge>
                    );
                  })}
                  {daySchedules.length > 3 && (
                    <div className="text-xs text-muted-foreground">
                      +{daySchedules.length - 3} more
                    </div>
                  )}
                </div>

                {/* Show tooltip on hover if there's a payment window */}
                {hoveredDay && isSameDay(hoveredDay, day) && hasPaymentWindow && (
                  <PaymentWindowTooltip
                    paymentWindows={paymentWindows}
                    quotes={quotes}
                  />
                )}
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
