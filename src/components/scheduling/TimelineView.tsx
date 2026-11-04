import { useState, useMemo } from "react";
import { format, addDays, subDays, startOfDay, differenceInDays, isSameDay, addWeeks, subWeeks, startOfWeek } from "date-fns";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { JobDetailsDrawer } from "./JobDetailsDrawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface TimelineViewProps {
  isDemo: boolean;
  schedules: any[];
  quotes: any[];
  invoices: any[];
  onQuoteDrop?: (quote: any, date: Date) => void;
}

export const TimelineView = ({ isDemo, schedules, quotes, invoices, onQuoteDrop }: TimelineViewProps) => {
  const isMobile = useIsMobile();
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedSchedule, setSelectedSchedule] = useState<any>(null);
  const [isDetailsDrawerOpen, setIsDetailsDrawerOpen] = useState(false);

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const timelineStart = weekStart;
  const timelineDays = isMobile ? 7 : 14; // Show 1 week on mobile, 2 weeks on desktop
  const timelineEnd = addDays(timelineStart, timelineDays - 1);

  const handlePreviousWeek = () => setCurrentWeek(subWeeks(currentWeek, 1));
  const handleNextWeek = () => setCurrentWeek(addWeeks(currentWeek, 1));
  const handleToday = () => setCurrentWeek(new Date());

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, dayIndex: number) => {
    e.preventDefault();
    const quoteData = e.dataTransfer.getData("quote");
    if (quoteData && onQuoteDrop) {
      const quote = JSON.parse(quoteData);
      const dropDate = addDays(timelineStart, dayIndex);
      onQuoteDrop(quote, dropDate);
    }
  };

  // Get all unique clients/jobs in the timeline period
  const timelineJobs = useMemo(() => {
    const jobsInRange = schedules.filter((schedule: any) => {
      const startDate = new Date(schedule.start_date || schedule.startDate);
      const endDate = new Date(schedule.end_date || schedule.endDate);
      return (startDate <= timelineEnd && endDate >= timelineStart);
    });

    return jobsInRange.map((schedule: any) => {
      const quote = quotes.find((q: any) => q.id === (schedule.quote_id || schedule.quoteId));
      return { schedule, quote };
    }).sort((a, b) => {
      const aDate = new Date(a.schedule.start_date || a.schedule.startDate);
      const bDate = new Date(b.schedule.start_date || b.schedule.startDate);
      return aDate.getTime() - bDate.getTime();
    });
  }, [schedules, quotes, timelineStart, timelineEnd]);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "draft": return "bg-blue-500";
      case "pending": return "bg-yellow-500";
      case "approved": return "bg-green-500";
      case "completed": return "bg-teal-500";
      case "overdue": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const calculateJobPosition = (schedule: any) => {
    const startDate = new Date(schedule.start_date || schedule.startDate);
    const endDate = new Date(schedule.end_date || schedule.endDate);
    
    // Clamp to timeline boundaries
    const jobStart = startDate < timelineStart ? timelineStart : startDate;
    const jobEnd = endDate > timelineEnd ? timelineEnd : endDate;
    
    const startOffset = differenceInDays(jobStart, timelineStart);
    const duration = differenceInDays(jobEnd, jobStart) + 1;
    
    const left = (startOffset / timelineDays) * 100;
    const width = (duration / timelineDays) * 100;
    
    return { left: `${left}%`, width: `${Math.max(width, 2)}%` };
  };

  const formatJobDuration = (schedule: any) => {
    const durationHours = schedule.duration_hours || schedule.durationHours || 0;
    const durationDays = schedule.duration_days || schedule.durationDays || 0;
    
    if (durationHours > 0) {
      return `${durationHours}h`;
    }
    return `${durationDays}d`;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Navigation Header */}
      <div className={cn("mb-4 flex items-center justify-between", isMobile && "flex-col gap-2")}>
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
          {format(timelineStart, "MMM d")} - {format(timelineEnd, "MMM d, yyyy")}
        </h2>
      </div>

      {/* Timeline Container */}
      <ScrollArea className="flex-1 border border-border rounded-lg bg-card">
        <div className={cn("min-w-[800px]", isMobile && "min-w-[600px]")}>
          {/* Date Headers */}
          <div className="sticky top-0 z-10 bg-muted border-b border-border">
            <div className="flex h-12">
              <div className={cn("border-r border-border bg-muted font-medium text-sm flex items-center justify-center text-muted-foreground", isMobile ? "w-32" : "w-48")}>
                Job / Client
              </div>
              <div className="flex-1 flex">
                {Array.from({ length: timelineDays }, (_, i) => {
                  const day = addDays(timelineStart, i);
                  const isToday = isSameDay(day, new Date());
                  return (
                    <div
                      key={i}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, i)}
                      className={cn(
                        "flex-1 border-r border-border last:border-r-0 text-center py-2 text-xs",
                        isToday && "bg-primary/10 font-semibold text-primary"
                      )}
                    >
                      <div className={cn("font-medium", isMobile ? "text-[10px]" : "text-xs")}>
                        {format(day, isMobile ? "EEE" : "EEE")}
                      </div>
                      <div className={cn(isToday && "font-bold", isMobile ? "text-[10px]" : "text-xs")}>
                        {format(day, "d")}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Job Rows */}
          <div className="relative">
            {timelineJobs.length === 0 ? (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                <div className="text-center">
                  <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No jobs scheduled in this period</p>
                </div>
              </div>
            ) : (
              timelineJobs.map(({ schedule, quote }, index) => {
                const position = calculateJobPosition(schedule);
                const status = quote?.status || "draft";
                
                return (
                  <div
                    key={schedule.id}
                    className={cn(
                      "flex border-b border-border hover:bg-muted/50 transition-colors",
                      isMobile ? "min-h-[60px]" : "min-h-[70px]"
                    )}
                  >
                    {/* Job Info Column */}
                    <div className={cn("border-r border-border p-2 flex flex-col justify-center", isMobile ? "w-32" : "w-48")}>
                      <div className={cn("font-medium truncate", isMobile ? "text-xs" : "text-sm")}>
                        {quote?.client || "Unknown Client"}
                      </div>
                      <div className={cn("text-muted-foreground truncate", isMobile ? "text-[10px]" : "text-xs")}>
                        {quote?.title || "Untitled Job"}
                      </div>
                      <Badge variant="outline" className={cn("mt-1 w-fit text-[9px] py-0", isMobile && "text-[8px]")}>
                        {formatJobDuration(schedule)}
                      </Badge>
                    </div>

                    {/* Timeline Bar Column */}
                    <div className="flex-1 relative p-2">
                      <div
                        className={cn(
                          "absolute h-8 rounded cursor-pointer transition-all hover:shadow-lg hover:z-10 flex items-center px-2 gap-1 text-white font-medium",
                          getStatusColor(status),
                          isMobile && "h-6 text-[10px] px-1"
                        )}
                        style={{
                          left: position.left,
                          width: position.width,
                          top: "50%",
                          transform: "translateY(-50%)",
                        }}
                        onClick={() => {
                          setSelectedSchedule(schedule);
                          setIsDetailsDrawerOpen(true);
                        }}
                      >
                        <div className="truncate flex-1" title={quote?.title}>
                          {quote?.title || "Untitled"}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Today Indicator Line */}
          {(() => {
            const today = new Date();
            if (today >= timelineStart && today <= timelineEnd) {
              const offset = differenceInDays(today, timelineStart);
              const left = ((offset + 0.5) / timelineDays) * 100;
              return (
                <div
                  className="absolute top-12 bottom-0 w-0.5 bg-primary z-20 pointer-events-none"
                  style={{ left: `calc(${isMobile ? 32 : 48} + ${left}%)` }}
                >
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                  </div>
                </div>
              );
            }
            return null;
          })()}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Job Details Drawer */}
      <JobDetailsDrawer
        open={isDetailsDrawerOpen}
        onOpenChange={setIsDetailsDrawerOpen}
        schedule={selectedSchedule}
        isDemo={isDemo}
      />
    </div>
  );
};