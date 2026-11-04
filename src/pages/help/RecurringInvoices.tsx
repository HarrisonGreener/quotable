import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const RecurringInvoicesHelp = () => {
  const isMobile = useIsMobile();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <SidebarInset className="flex-1">
          <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className={`flex items-center gap-4 ${isMobile ? 'p-3 h-14' : 'p-4 h-16'}`}>
              <SidebarTrigger />
              <h1 className={`font-heading text-foreground ${isMobile ? 'text-xl' : 'text-2xl'}`}>
                Recurring Invoices
              </h1>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto">
            <div className="container mx-auto p-4 sm:p-6 md:p-8 max-w-4xl">
              <Link to="/help">
                <Button variant="ghost" size="sm" className="mb-6">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Help
                </Button>
              </Link>

              <Accordion type="single" collapsible className="w-full space-y-4">
                <AccordionItem value="item-1" className="border rounded-lg px-4">
                  <AccordionTrigger className="text-left">
                    What are recurring invoices?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Recurring invoices automatically generate on a schedule you set. Perfect for maintenance contracts, monthly retainers, or regular service agreements. The system creates invoices automatically so you don't forget to bill.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2" className="border rounded-lg px-4">
                  <AccordionTrigger className="text-left">
                    How do I set up a recurring invoice?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Go to Invoices and click "Create Recurring Invoice". Select the client, enter the title and amount, choose a frequency (weekly, monthly, quarterly, annually), and set the start date. The system will generate invoices automatically from then on.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3" className="border rounded-lg px-4">
                  <AccordionTrigger className="text-left">
                    What frequencies are available?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    You can set recurring invoices to generate weekly, monthly, quarterly, or annually. Choose the frequency that matches your billing cycle with the client.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4" className="border rounded-lg px-4">
                  <AccordionTrigger className="text-left">
                    When do invoices get generated?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Invoices are generated automatically at 6 AM on their scheduled date. They appear in your Invoices list with "Pending" status. You can then review, send, or adjust them as needed.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-5" className="border rounded-lg px-4">
                  <AccordionTrigger className="text-left">
                    Can I pause or stop recurring invoices?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Yes, you can pause a recurring invoice at any time. Go to your recurring invoices list, click on the one you want to change, and toggle the Active status off. You can reactivate it later or delete it entirely.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-6" className="border rounded-lg px-4">
                  <AccordionTrigger className="text-left">
                    Can I change the amount or details?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Yes, you can edit a recurring invoice to change the amount, title, description, or frequency. Changes apply to future invoices - invoices already generated won't be affected.
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

export default RecurringInvoicesHelp;
