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

const InventoryPricingHelp = () => {
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
                Inventory & Pricing
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
                    What is the inventory system?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    The inventory lets you store commonly-used parts with your actual prices. When generating quotes, the AI checks your inventory first and uses your prices for matching items. This ensures consistent, accurate pricing.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2" className="border rounded-lg px-4">
                  <AccordionTrigger className="text-left">
                    How do I add items to inventory?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Go to Inventory in the sidebar and click "Add Item". Enter the item name, unit (each, metre, pack, etc.), unit price, and optionally a category and description. You can also save items directly from generated quotes using the "Save" button next to each material.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3" className="border rounded-lg px-4">
                  <AccordionTrigger className="text-left">
                    Where do the material prices come from?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Prices are sourced from UK merchants including Toolstation, Screwfix, City Plumbing, and trade suppliers. Prices are refreshed nightly, and anything we could not match to a real product is marked as an estimate. Look for the source badge on each item (e.g., "Toolstation", "Inventory", "Estimated") to see where the price originated.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4" className="border rounded-lg px-4">
                  <AccordionTrigger className="text-left">
                    What do the confidence badges mean?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Green (≥85%) = Verified price from a supplier. Yellow (70-84%) = Estimated based on similar products. Red (&lt;70%) = Market average, less reliable. Inventory items always show 100% confidence since they're your actual prices.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-5" className="border rounded-lg px-4">
                  <AccordionTrigger className="text-left">
                    How do preferred suppliers work?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    In Account Settings, you can select preferred suppliers based on your trade. The quote generator will prioritise prices from your preferred suppliers when available. This helps ensure quotes reflect where you actually buy materials.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-6" className="border rounded-lg px-4">
                  <AccordionTrigger className="text-left">
                    Why is a price showing as "Estimated"?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    If we can't find an exact match in our database or your inventory, we estimate the price based on similar products and market data. These items are included to ensure your quote is complete. Consider adding accurate prices to your inventory for frequently-used items.
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

export default InventoryPricingHelp;
