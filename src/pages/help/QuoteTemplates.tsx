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

const QuoteTemplatesHelp = () => {
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
                Quote Templates
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
                    What are quote templates?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Quote templates let you save common job configurations (materials, labour, overheads) for reuse. Instead of generating from scratch every time, you can load a template and just fill in the client details. Perfect for repeat jobs.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2" className="border rounded-lg px-4">
                  <AccordionTrigger className="text-left">
                    How do I save a quote as a template?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    After generating or editing a quote, click "Save as Template". Give it a name (e.g., "Standard Rewire - 3 Bed House") and the job details, materials, labour, and overheads will be saved. Client-specific info like name and address are not included.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3" className="border rounded-lg px-4">
                  <AccordionTrigger className="text-left">
                    How do I use a saved template?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    On the Quotes page, look for the Templates tab. Browse your saved templates and click "Use Template" to pre-fill a new quote form. Add the client details and make any adjustments needed, then save as a new quote.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4" className="border rounded-lg px-4">
                  <AccordionTrigger className="text-left">
                    Can I edit or delete templates?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Yes, in the Templates tab you can edit any template to update materials, labour, or overheads. You can also delete templates you no longer need. Changes to templates don't affect quotes already created from them.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-5" className="border rounded-lg px-4">
                  <AccordionTrigger className="text-left">
                    Do template prices update automatically?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    No, templates save the prices at the time they were created. When you use a template, you may want to regenerate prices using the AI or update them manually to reflect current market rates.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-6" className="border rounded-lg px-4">
                  <AccordionTrigger className="text-left">
                    What's the difference between templates and inventory?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Inventory stores individual items with prices (e.g., "15mm copper pipe - £2.50/m"). Templates store complete job configurations with all materials, labour, and overheads together (e.g., "Full bathroom refit"). Use both together for maximum efficiency.
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

export default QuoteTemplatesHelp;
