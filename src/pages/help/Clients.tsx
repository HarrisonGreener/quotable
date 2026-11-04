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

const ClientsHelp = () => {
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
                Client Management
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
                    How do I add a new client?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Go to Clients in the sidebar and click "Add Client". Enter the company name (required), contact name, email, phone, address, and any notes. You can also add clients directly when creating quotes or invoices.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2" className="border rounded-lg px-4">
                  <AccordionTrigger className="text-left">
                    How do I view a client's job history?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Click on any client card to open their details drawer. You'll see all quotes and invoices associated with that client, along with total revenue and job counts. Click on any quote or invoice to view its details.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3" className="border rounded-lg px-4">
                  <AccordionTrigger className="text-left">
                    Can I import clients from existing quotes?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Yes! On the Clients page, look for the "Import from Quotes/Invoices" button (shows a badge with the count). Click it to see client names from your quotes that aren't saved yet. Click "+" to add them as contacts.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4" className="border rounded-lg px-4">
                  <AccordionTrigger className="text-left">
                    How do I use saved clients in new quotes?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    When creating a quote, start typing the client name and you'll see matching saved clients. Select one to auto-fill their details (address, email, phone). You can also click the dropdown to browse all clients.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-5" className="border rounded-lg px-4">
                  <AccordionTrigger className="text-left">
                    How do I edit or delete a client?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Click on the client card, then use the Edit or Delete buttons in the details drawer. Note: deleting a client doesn't delete their associated quotes or invoices - those remain in your records.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-6" className="border rounded-lg px-4">
                  <AccordionTrigger className="text-left">
                    What does the revenue stat show?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    The revenue shown on each client card is the total from all paid invoices for that client. It helps you identify your most valuable customers and track business relationships over time.
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

export default ClientsHelp;
