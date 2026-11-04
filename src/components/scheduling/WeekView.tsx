import { useState, useEffect } from "react";
import { format, startOfWeek, addDays, isSameDay, addWeeks, subWeeks } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UnscheduledQuotes } from "./UnscheduledQuotes";
import { ScheduleJobDialog } from "./ScheduleJobDialog";
import { JobDetailsDrawer } from "./JobDetailsDrawer";
import { CalendarGrid } from "./CalendarGrid";
import { useSchedules } from "@/hooks/useSchedules";
import { useQuotes } from "@/hooks/useQuotes";
import { useInvoices } from "@/hooks/useInvoices";
import { getDemoSchedules } from "@/data/demoSchedules";
import { demoQuotes, demoInvoices } from "@/data/demoData";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileWeekView } from "./MobileWeekView";

interface WeekViewProps {
  isDemo: boolean;
  schedules?: any[];
  quotes?: any[];
  invoices?: any[];
  onQuoteDrop?: (quote: any, date: Date) => void;
  hideUnscheduledQuotes?: boolean;
}

export const WeekView = ({ isDemo, schedules: propSchedules, quotes: propQuotes, invoices: propInvoices, onQuoteDrop: propOnQuoteDrop, hideUnscheduledQuotes = false }: WeekViewProps) => {
  const isMobile = useIsMobile();
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedQuote, setSelectedQuote] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<any>(null);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [isDetailsDrawerOpen, setIsDetailsDrawerOpen] = useState(false);

  const { data: dbSchedules = [] } = useSchedules(!isDemo && !propSchedules);
  const { data: dbQuotes = [] } = useQuotes(!isDemo && !propQuotes);
  const { data: dbInvoices = [] } = useInvoices(!isDemo && !propInvoices);

  const schedules = propSchedules || (isDemo ? getDemoSchedules() : dbSchedules);
  const quotes = propQuotes || (isDemo ? demoQuotes : dbQuotes);
  const invoices = propInvoices || (isDemo ? demoInvoices : dbInvoices);

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const handlePreviousWeek = () => setCurrentWeek(subWeeks(currentWeek, 1));
  const handleNextWeek = () => setCurrentWeek(addWeeks(currentWeek, 1));
  const handleToday = () => setCurrentWeek(new Date());

  const handleQuoteDrop = (quote: any, date: Date) => {
    if (propOnQuoteDrop) {
      propOnQuoteDrop(quote, date);
    } else {
      setSelectedQuote(quote);
      setSelectedDate(date);
      setIsScheduleDialogOpen(true);
    }
  };

  const handleScheduleClick = (schedule: any) => {
    setSelectedSchedule(schedule);
    setIsDetailsDrawerOpen(true);
  };

  const scheduledQuoteIds = schedules.map((s: any) => s.quote_id || s.quoteId);
  const unscheduledQuotes = quotes.filter((q: any) => 
    !scheduledQuoteIds.includes(q.id)
  );

  if (isMobile) {
    return (
      <>
        <MobileWeekView
          currentWeek={currentWeek}
          schedules={schedules}
          quotes={quotes}
          onScheduleClick={handleScheduleClick}
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
    <div className="flex gap-6 h-full">
      {!hideUnscheduledQuotes && (
        <UnscheduledQuotes 
          quotes={unscheduledQuotes} 
          onQuoteDrop={handleQuoteDrop}
          isDemo={isDemo}
        />
      )}

      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handlePreviousWeek}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={handleToday}>
              Today
            </Button>
            <Button variant="outline" size="icon" onClick={handleNextWeek}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <h2 className="text-lg font-semibold">
            {format(weekStart, "MMM d")} - {format(addDays(weekStart, 6), "MMM d, yyyy")}
          </h2>
        </div>

        <CalendarGrid
          weekDays={weekDays}
          schedules={schedules}
          quotes={quotes}
          invoices={invoices}
          onScheduleClick={handleScheduleClick}
          onDayClick={(date) => {
            setSelectedDate(date);
            if (selectedQuote) setIsScheduleDialogOpen(true);
          }}
          onQuoteDrop={handleQuoteDrop}
        />
      </div>

      <ScheduleJobDialog
        open={isScheduleDialogOpen}
        onOpenChange={setIsScheduleDialogOpen}
        selectedQuote={selectedQuote}
        selectedDate={selectedDate}
        isDemo={isDemo}
      />

      <JobDetailsDrawer
        open={isDetailsDrawerOpen}
        onOpenChange={setIsDetailsDrawerOpen}
        schedule={selectedSchedule}
        isDemo={isDemo}
      />
    </div>
  );
};
