import { format, isSameDay, isWithinInterval, addDays } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { DollarSign } from "lucide-react";
import { PaymentWindowTooltip } from "./PaymentWindowTooltip";
import { useState } from "react";

interface CalendarGridProps {
  weekDays: Date[];
  schedules: any[];
  quotes: any[];
  invoices?: any[];
  onScheduleClick: (schedule: any) => void;
  onDayClick: (date: Date) => void;
  onQuoteDrop?: (quote: any, date: Date) => void;
}

export const CalendarGrid = ({ 
  weekDays, 
  schedules, 
  quotes, 
  invoices = [],
  onScheduleClick,
  onDayClick,
  onQuoteDrop,
}: CalendarGridProps) => {
  const [hoveredDay, setHoveredDay] = useState<Date | null>(null);
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

const handleDrop = (e: React.DragEvent, date: Date) => {
  e.preventDefault();
  const quoteData = e.dataTransfer.getData("quote");
  if (quoteData) {
    const quote = JSON.parse(quoteData);
    if (onQuoteDrop) {
      onQuoteDrop(quote, date);
    } else {
      onDayClick(date);
    }
  }
};

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "draft": return "bg-blue-500 border-blue-600";
      case "pending": return "bg-yellow-500 border-yellow-600";
      case "approved": return "bg-green-500 border-green-600";
      case "completed": return "bg-teal-500 border-teal-600";
      case "overdue": return "bg-red-500 border-red-600";
      default: return "bg-gray-500 border-gray-600";
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
    // Find invoices that have a payment window covering this day
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

  const getDayHeaderColor = (hasPaymentWindow: boolean, paymentWindows: any[]) => {
    if (!hasPaymentWindow) return "";
    
    const invoice = paymentWindows[0];
    const quote = quotes.find((q: any) => q.id === invoice?.quote_id);
    const status = quote?.status || "draft";
    
    switch (status?.toLowerCase()) {
      case "draft": return "bg-blue-500/10";
      case "pending": return "bg-yellow-500/10";
      case "approved": return "bg-green-500/10";
      case "completed": return "bg-teal-500/10";
      case "overdue": return "bg-red-500/10";
      default: return "bg-gray-500/10";
    }
  };

  return (
    <div className="flex-1 border border-border rounded-lg overflow-hidden bg-card">
      <div className="grid grid-cols-7">
        {weekDays.map((day, idx) => {
          const isToday = isSameDay(day, new Date());
          const daySchedules = getSchedulesForDay(day);
          const paymentWindows = getPaymentWindowForDay(day);
          const hasPaymentWindow = paymentWindows.length > 0;

          return (
            <div
              key={idx}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, day)}
              onMouseEnter={() => setHoveredDay(day)}
              onMouseLeave={() => setHoveredDay(null)}
              className={cn(
                "border-r last:border-r-0 border-border flex flex-col relative cursor-pointer",
                isToday && "bg-accent/5",
                getDayBackgroundColor(day, hasPaymentWindow, paymentWindows)
              )}
            >
              <div className={cn(
                "p-3 border-b border-border text-center relative",
                isToday && "bg-accent text-accent-foreground font-semibold"
              )}>
                <div className="text-xs">{format(day, "EEE")}</div>
                <div className="text-lg">{format(day, "d")}</div>
                {hasPaymentWindow && (
                  <div className="absolute top-1 right-1">
                    <DollarSign className="h-3 w-3 text-green-600 dark:text-green-400" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 p-2 space-y-2 min-h-[200px] relative">
                {daySchedules.map((schedule: any) => {
                  const quote = quotes.find((q: any) => q.id === (schedule.quote_id || schedule.quoteId));
                  if (!quote) return null;

                  const startDate = new Date(schedule.start_date || schedule.startDate);
                  const isStartDay = isSameDay(startDate, day);
                  const hasPaymentWindow = paymentWindows.some((pw: any) => pw.quote_id === quote.id);
                  const startTime = schedule.start_time || schedule.startTime;
                  const displayTime = startTime ? startTime.substring(0, 5) : '';

                  return (
                    <div
                      key={schedule.id}
                      onClick={() => onScheduleClick(schedule)}
                      className={cn(
                        "p-2 rounded border-l-4 cursor-pointer hover:shadow-md transition-shadow bg-card/50 relative",
                        getStatusColor(quote.status)
                      )}
                    >
                      {hasPaymentWindow && (
                        <div className="absolute -top-1 -right-1">
                          <DollarSign className="h-3 w-3 text-green-600 dark:text-green-400 bg-background rounded-full p-0.5 border border-green-500" />
                        </div>
                      )}
                      {isStartDay && (
                        <>
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-xs font-semibold text-foreground truncate">
                              {quote.client}
                            </p>
                            {displayTime && (
                              <span className="text-xs text-foreground/80 bg-background/50 px-1.5 py-0.5 rounded">
                                {displayTime}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {quote.title}
                          </p>
                          <p className="text-xs font-medium text-foreground mt-1">
                            {(schedule.duration_hours || schedule.durationHours || 0) > 0 
                              ? `${schedule.duration_hours || schedule.durationHours}h`
                              : `${schedule.duration_days || schedule.durationDays}d`
                            }
                          </p>
                        </>
                      )}
                    </div>
                  );
                })}

                {/* Show tooltip on hover if there's a payment window */}
                {hoveredDay && isSameDay(hoveredDay, day) && hasPaymentWindow && (
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
  );
};
