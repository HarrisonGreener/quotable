import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useIsMobile } from "@/hooks/use-mobile";

const TaxPricing = () => {
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
                Tax & Pricing
              </h1>

              <Accordion type="single" collapsible className="space-y-4">
                <AccordionItem value="item-1" className="border rounded-lg px-4">
                  <AccordionTrigger className="text-left">
                    How is tax calculated on quotes and invoices?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    Tax is calculated based on the rate you set in Settings (e.g., 20% for UK VAT). It's applied to the subtotal (labour + materials + overheads) to give your grand total. The tax rate is shown clearly on all quotes and invoices. Make sure to set the correct rate for your region.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2" className="border rounded-lg px-4">
                  <AccordionTrigger className="text-left">
                    Can I change the tax rate for specific jobs?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    Currently, the tax rate is set globally in Settings and applies to all quotes and invoices. If you need to charge a different rate for a specific client or job type, you'll need to adjust it manually in Settings before creating that quote, then change it back afterward.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3" className="border rounded-lg px-4">
                  <AccordionTrigger className="text-left">
                    Where can I see my total tax collected?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    Go to the Tax & Reports page to see a summary of total tax collected, revenue, and outstanding invoices. You can filter by date range and export reports as PDFs for your accountant or tax filing. This helps you stay on top of your tax obligations throughout the year.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4" className="border rounded-lg px-4">
                  <AccordionTrigger className="text-left">
                    Why is my total different from what I quoted the client?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    Check if you've accidentally changed quantities, rates, or the tax rate since creating the quote. Verify that all materials, labour, and overheads are included correctly. If you edited the quote after sending it, make sure you sent the updated version to the client.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-5" className="border rounded-lg px-4">
                  <AccordionTrigger className="text-left">
                    Do I need to register for VAT or sales tax?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    This depends on your country and annual revenue. In the UK, you must register for VAT if your taxable turnover exceeds £85,000 per year. In the US, sales tax rules vary by state. Consult a local accountant or tax advisor to understand your specific obligations.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-6" className="border rounded-lg px-4">
                  <AccordionTrigger className="text-left">
                    How do I avoid double-charging for labour or materials?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    When creating a quote, separate labour and materials into distinct line items. Don't include material costs in your labour hourly rate. List each material individually with its own price. Review the AI-generated summary to ensure nothing is listed twice. This keeps pricing transparent and accurate.
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

export default TaxPricing;
