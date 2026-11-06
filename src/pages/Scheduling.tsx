import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarDays, CalendarRange, Calendar as CalendarIcon, ClipboardList, GanttChart } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { DemoModeNotice } from "@/components/DemoModeNotice";
import { isDemoMode } from "@/utils/demoMode";
import { useSchedules } from "@/hooks/useSchedules";
import { useQuotes } from "@/hooks/useQuotes";
import { Footer } from "@/components/Footer";
import { useInvoices } from "@/hooks/useInvoices";
import { getDemoSchedules } from "@/data/demoSchedules";
import { demoQuotes, demoInvoices } from "@/data/demoData";
import { WeekView } from "@/components/scheduling/WeekView";
import { MonthView } from "@/components/scheduling/MonthView";
import { DayView } from "@/components/scheduling/DayView";
import { TimelineView } from "@/components/scheduling/TimelineView";
import { UnscheduledQuotes } from "@/components/scheduling/UnscheduledQuotes";
import { MobileUnscheduledQuotes } from "@/components/scheduling/MobileUnscheduledQuotes";
import { ScheduleJobDialog } from "@/components/scheduling/ScheduleJobDialog";
import { SchedulingFilters } from "@/components/scheduling/SchedulingFilters";
import { ColorLegend } from "@/components/scheduling/ColorLegend";
import { useIsMobile } from "@/hooks/use-mobile";

const Scheduling = () => {
  const [searchParams] = useSearchParams();
  const isDemo = isDemoMode(searchParams);
  const isMobile = useIsMobile();
  const [viewMode, setViewMode] = useState<"day" | "week" | "month" | "timeline">("week");
  const [selectedQuote, setSelectedQuote] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [showMobileQuotesSheet, setShowMobileQuotesSheet] = useState(false);
  
  // Filters
  const [selectedClient, setSelectedClient] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedPaymentFilter, setSelectedPaymentFilter] = useState("all");

  const { data: dbSchedules = [] } = useSchedules(!isDemo);
  const { data: dbQuotes = [] } = useQuotes(!isDemo);
  const { data: dbInvoices = [] } = useInvoices(!isDemo);

  const schedules = isDemo ? getDemoSchedules() : dbSchedules;
  const quotes = isDemo ? demoQuotes : dbQuotes;
  const invoices = isDemo ? demoInvoices : dbInvoices;

  const scheduledQuoteIds = schedules.map((s: any) => s.quote_id || s.quoteId);
  
  // Get unique clients
  const clients = useMemo(() => {
    const uniqueClients = new Set(quotes.map((q: any) => q.client));
    return Array.from(uniqueClients).sort();
  }, [quotes]);

  // Filter data based on selected filters
  const filteredQuotes = useMemo(() => {
    return quotes.filter((q: any) => {
      if (selectedClient !== "all" && q.client !== selectedClient) return false;
      if (selectedStatus !== "all" && q.status?.toLowerCase() !== selectedStatus) return false;
      return true;
    });
  }, [quotes, selectedClient, selectedStatus]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv: any) => {
      if (selectedPaymentFilter === "all") return true;
      
      const dueDate = new Date(inv.due_date);
      const today = new Date();
      const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      if (selectedPaymentFilter === "due-soon") return daysUntilDue <= 7 && daysUntilDue >= 0;
      if (selectedPaymentFilter === "due-this-month") return daysUntilDue <= 30 && daysUntilDue >= 0;
      if (selectedPaymentFilter === "overdue") return daysUntilDue < 0;
      
      return true;
    });
  }, [invoices, selectedPaymentFilter]);

  const unscheduledQuotes = filteredQuotes.filter((q: any) => 
    !scheduledQuoteIds.includes(q.id)
  );

  const handleQuoteDrop = (quote: any, date: Date) => {
    setSelectedQuote(quote);
    setSelectedDate(date);
    setIsScheduleDialogOpen(true);
  };

  const handleMobileScheduleClick = (quote: any) => {
    setSelectedQuote(quote);
    setSelectedDate(new Date());
    setIsScheduleDialogOpen(true);
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background overflow-x-hidden">
        <AppSidebar />
        <main className="flex-1 overflow-hidden flex flex-col w-full">
          {/* Sticky Header */}
          <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
            <div className="flex items-center px-4 md:px-6 h-16">
              <SidebarTrigger className="mr-4" />
              <h1 className="text-xl md:text-2xl font-heading font-semibold text-foreground">
                Smart Scheduling
              </h1>
            </div>
            
            {/* View Tabs */}
            <div className="border-t border-border">
              <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "day" | "week" | "month" | "timeline")} className="w-full">
                <TabsList className={`w-full justify-start rounded-none border-b h-auto p-0 bg-transparent ${isMobile ? 'overflow-x-auto' : ''}`}>
                  <TabsTrigger 
                    value="day" 
                    className={`rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent gap-2 ${isMobile ? 'px-4 py-4 min-h-[48px]' : 'px-6 py-3'}`}
                  >
                    <CalendarIcon className="h-4 w-4" />
                    {!isMobile && "Day"}
                  </TabsTrigger>
                  <TabsTrigger 
                    value="week" 
                    className={`rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent gap-2 ${isMobile ? 'px-4 py-4 min-h-[48px]' : 'px-6 py-3'}`}
                  >
                    <CalendarDays className="h-4 w-4" />
                    {!isMobile && "Week"}
                  </TabsTrigger>
                  <TabsTrigger 
                    value="month" 
                    className={`rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent gap-2 ${isMobile ? 'px-4 py-4 min-h-[48px]' : 'px-6 py-3'}`}
                  >
                    <CalendarRange className="h-4 w-4" />
                    {!isMobile && "Month"}
                  </TabsTrigger>
                  <TabsTrigger 
                    value="timeline" 
                    className={`rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent gap-2 ${isMobile ? 'px-4 py-4 min-h-[48px]' : 'px-6 py-3'}`}
                  >
                    <GanttChart className="h-4 w-4" />
                    {!isMobile && "Timeline"}
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </header>

          <div className="flex-1 overflow-auto">
            <div className={`${isMobile ? 'p-3 space-y-4 pb-24' : 'p-6 space-y-8 pb-12'}`}>
              {isDemo && <DemoModeNotice />}
              
              {/* Filters */}
              <SchedulingFilters
                clients={clients}
                selectedClient={selectedClient}
                onClientChange={setSelectedClient}
                selectedStatus={selectedStatus}
                onStatusChange={setSelectedStatus}
                selectedPaymentFilter={selectedPaymentFilter}
                onPaymentFilterChange={setSelectedPaymentFilter}
              />

              {/* Color Legend */}
              {!isMobile && <ColorLegend />}

              {/* Calendar Views */}
              <div className="flex gap-4 min-h-[calc(100vh-400px)]">
                {/* Unscheduled Quotes Sidebar */}
                {!isMobile && (
                  <UnscheduledQuotes 
                    quotes={unscheduledQuotes} 
                    onQuoteDrop={handleQuoteDrop}
                    isDemo={isDemo}
                  />
                )}

                {/* Calendar */}
                <div className="flex-1 overflow-hidden min-w-0">
                  {viewMode === "day" && (
                    <DayView 
                      isDemo={isDemo}
                      schedules={schedules}
                      quotes={filteredQuotes}
                      invoices={filteredInvoices}
                      onQuoteDrop={handleQuoteDrop}
                    />
                  )}
                  {viewMode === "week" && (
                    <WeekView 
                      isDemo={isDemo}
                      schedules={schedules}
                      quotes={filteredQuotes}
                      invoices={filteredInvoices}
                      onQuoteDrop={handleQuoteDrop}
                      hideUnscheduledQuotes={true}
                    />
                  )}
                  {viewMode === "month" && (
                    <MonthView 
                      isDemo={isDemo}
                      schedules={schedules}
                      quotes={filteredQuotes}
                      invoices={filteredInvoices}
                      onQuoteDrop={handleQuoteDrop}
                    />
                  )}
                  {viewMode === "timeline" && (
                    <TimelineView 
                      isDemo={isDemo}
                      schedules={schedules}
                      quotes={filteredQuotes}
                      invoices={filteredInvoices}
                      onQuoteDrop={handleQuoteDrop}
                    />
                  )}
                </div>
              </div>

            </div>
            
            <div className={`${isMobile ? 'h-6' : 'h-4'}`} aria-hidden />
          </div>
          <Footer compact />
        </main>
      </div>

      {isMobile && unscheduledQuotes.length > 0 && (
        <>
          <button
            onClick={() => setShowMobileQuotesSheet(true)}
            className="fixed bottom-4 right-4 z-50 h-14 px-6 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
          >
            <ClipboardList className="h-5 w-5" />
            <span className="font-semibold">Unscheduled ({unscheduledQuotes.length})</span>
          </button>

          <Sheet open={showMobileQuotesSheet} onOpenChange={setShowMobileQuotesSheet}>
            <SheetContent side="bottom" className="h-[80vh] p-0">
              <SheetHeader className="sr-only">
                <SheetTitle>Unscheduled Quotes</SheetTitle>
              </SheetHeader>
              <MobileUnscheduledQuotes
                quotes={unscheduledQuotes}
                onScheduleClick={(quote) => {
                  handleMobileScheduleClick(quote);
                  setShowMobileQuotesSheet(false);
                }}
              />
            </SheetContent>
          </Sheet>
        </>
      )}

      <ScheduleJobDialog
        open={isScheduleDialogOpen}
        onOpenChange={setIsScheduleDialogOpen}
        selectedQuote={selectedQuote}
        selectedDate={selectedDate}
        isDemo={isDemo}
      />
    </SidebarProvider>
  );
};

export default Scheduling;
