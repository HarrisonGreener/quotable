import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useIsMobile } from "@/hooks/use-mobile";

const AccurateQuotes = () => {
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
                Getting the Most Accurate Quote
              </h1>

              <Accordion type="single" collapsible className="space-y-4">
                <AccordionItem value="item-1" className="border rounded-lg px-4">
                  <AccordionTrigger className="text-left">
                    How do I break down labour costs properly?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    Labour costs should reflect the actual time and number of workers needed. Be specific about tasks—for example, "Demolition (2 workers, 4 hours)" is clearer than just "Labour." Include your hourly rate and multiply by hours worked. Don't forget to account for setup and cleanup time.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2" className="border rounded-lg px-4">
                  <AccordionTrigger className="text-left">
                    What should I include in materials?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    List every material needed with accurate quantities and unit prices. Include consumables like screws, adhesive, and paint. Add a small buffer (5-10%) for waste or mistakes. If you're uncertain about prices, check recent invoices or supplier websites to get current rates.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3" className="border rounded-lg px-4">
                  <AccordionTrigger className="text-left">
                    Should I include overheads in my quotes?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    Yes. Overheads like travel, fuel, equipment rental, permits, and disposal fees should be itemized separately. This transparency shows clients exactly what they're paying for and helps justify your total price. Don't hide these costs—clients appreciate clarity.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4" className="border rounded-lg px-4">
                  <AccordionTrigger className="text-left">
                    How do I avoid underquoting a job?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    Always visit the job site before quoting. Take measurements, photos, and notes. Ask questions about the client's expectations. Include contingency time (10-15%) for unexpected issues. Review similar past jobs to check if your estimates are realistic. If in doubt, slightly overestimate—it's easier to come in under budget than over.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-5" className="border rounded-lg px-4">
                  <AccordionTrigger className="text-left">
                    What if my quote total seems too high or too low?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    If it seems too high, double-check your quantities and rates. Compare with industry standards. If it's too low, you may have missed materials, underestimated time, or forgotten overheads. Use Quotable's AI summary to review what's included—it can catch missing items or calculation errors.
                  </AccordionContent>
                </AccordionItem>

              <AccordionItem value="item-6" className="border rounded-lg px-4">
                <AccordionTrigger className="text-left">
                  Can I save quote templates for repeat jobs?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  Yes, use the Templates section in Settings to save frequently used items and rates. This speeds up quoting and ensures consistency across similar jobs. You can adjust quantities and descriptions for each new quote while keeping your pricing accurate.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-7" className="border rounded-lg px-4">
                <AccordionTrigger className="text-left">
                  How do I use the Manual Edit feature to adjust my quote?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  After generating a quote, click the edit icon (pencil) in the quote breakdown. This opens a dialog where you can manually adjust any line item—change quantities, costs, add or remove items from materials, labour, or overheads. Changes update the total in real-time. Click "Revert" to undo changes, or "Save Changes" to apply them. This is perfect for fine-tuning quotes based on supplier pricing or client negotiations.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-8" className="border rounded-lg px-4">
                <AccordionTrigger className="text-left">
                  What is the AI Adjuster and how does it work?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  The AI Adjuster (lightning bolt icon) lets you adjust your quote using natural language. Instead of manually editing each item, simply describe what you want—for example, "Reduce labour by 10%", "Add 15% contingency buffer", or "Increase material costs by 5% due to supplier changes". The AI will intelligently apply these adjustments across your quote. This is ideal for quick percentage changes, adding buffers, or making proportional adjustments to multiple line items at once.
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

export default AccurateQuotes;
