import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useIsMobile } from "@/hooks/use-mobile";

const Scheduling = () => {
  const isMobile = useIsMobile();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <SidebarInset className="flex-1">
          <main className="flex-1 overflow-y-auto">
            <div className="container mx-auto p-4 sm:p-6 md:p-8 max-w-4xl">
              <Link to="/help">
                <Button variant="ghost" size={isMobile ? "sm" : "default"} className="mb-6">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Help
                </Button>
              </Link>

              <h1 className={`font-heading text-foreground mb-6 ${isMobile ? 'text-2xl' : 'text-3xl md:text-4xl'}`}>
                Scheduling & Calendar
              </h1>

              <Accordion type="single" collapsible className="space-y-4">
                <AccordionItem value="item-1" className="border rounded-lg px-4">
                  <AccordionTrigger className="text-left">
                    How do I add a job to the calendar?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    On desktop, drag an unscheduled quote from the left panel onto a date in the calendar. On mobile, tap the quote, select a start date, and set the duration. The job will appear on the calendar as a colored block spanning the days you specified.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2" className="border rounded-lg px-4">
                  <AccordionTrigger className="text-left">
                    What do the different colors mean?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    Blue = Quote (not yet confirmed), Yellow = Scheduled (confirmed job), Green = Completed, Red = Overdue, Teal = Paid. These colors help you quickly see the status of each job at a glance. You can check the color legend on the scheduling page for reference.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3" className="border rounded-lg px-4">
                  <AccordionTrigger className="text-left">
                    How do I change a job's duration or start date?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    Click or tap the job on the calendar to open its details. You can edit the start date, end date, or duration. On desktop, you can also drag the job to a new date or resize it by dragging the edges. Changes save automatically.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4" className="border rounded-lg px-4">
                  <AccordionTrigger className="text-left">
                    What are the shaded areas on the calendar?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    Shaded areas indicate payment windows—the 30-day period after an invoice is sent when payment is expected. The shading gets more intense as the due date approaches. This helps you track outstanding invoices and follow up on overdue payments.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-5" className="border rounded-lg px-4">
                  <AccordionTrigger className="text-left">
                    Can I see jobs in different views (day, week, month)?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    Yes. Use the view switcher at the top of the scheduling page to toggle between Day, Week, and Month views. Each view shows different levels of detail—Month is great for planning ahead, Week for current jobs, and Day for detailed time slots.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-6" className="border rounded-lg px-4">
                  <AccordionTrigger className="text-left">
                    How do I mark a job as completed or paid?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    Click the job on the calendar to open details, then use the "Mark Completed" or "Mark Paid" buttons. You can also update the status from the Invoices page. Once marked, the job's color will change to reflect its new status (green for completed, teal for paid).
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-7" className="border rounded-lg px-4">
                  <AccordionTrigger className="text-left">
                    Why can't I schedule a quote?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    Make sure the quote has been saved and isn't in draft mode. Check that you're logged in and not in demo mode. If the quote has already been scheduled, it won't appear in the unscheduled list—look for it on the calendar instead.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Scheduling;
