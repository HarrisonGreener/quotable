import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useIsMobile } from "@/hooks/use-mobile";

const CommonIssues = () => {
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
                Common Issues
              </h1>

              <Accordion type="single" collapsible className="space-y-4">
                <AccordionItem value="item-1" className="border rounded-lg px-4">
                  <AccordionTrigger className="text-left">
                    My quote total doesn't match what I expected
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    Check that tax is being applied correctly in Settings. Verify that labour, materials, and overheads are calculated properly. Make sure you haven't accidentally included the same item twice. Use the AI summary to review all included items and spot any errors.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2" className="border rounded-lg px-4">
                  <AccordionTrigger className="text-left">
                    I can't edit or delete a saved quote
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    Make sure you're logged in and not in demo mode. Only quotes you created can be edited or deleted. If the quote has been converted to an invoice, you may need to edit the invoice instead. Try refreshing the page if buttons aren't responding.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3" className="border rounded-lg px-4">
                  <AccordionTrigger className="text-left">
                    PDF exports aren't working or look wrong
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    Ensure your brand information is filled out in Settings—especially your business name and logo. Check that your browser allows pop-ups from Quotable. Try a different PDF template in Settings. If the layout looks broken, make sure all required fields (client name, job description, items) are completed.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4" className="border rounded-lg px-4">
                  <AccordionTrigger className="text-left">
                    My data disappeared after logging out
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    If you were in demo mode, your data won't save—that's by design. Create an account to save your quotes, invoices, and schedules permanently. If you had an account and data is missing, make sure you're logged into the correct email address.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-5" className="border rounded-lg px-4">
                  <AccordionTrigger className="text-left">
                    The site is slow or not loading properly
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    Clear your browser cache and cookies, then refresh. Check your internet connection. Try using a different browser or device. If the issue persists, it may be a temporary server problem—wait a few minutes and try again.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-6" className="border rounded-lg px-4">
                  <AccordionTrigger className="text-left">
                    I'm not receiving email notifications
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    Check your spam/junk folder. Verify that email notifications are enabled in Settings. Make sure the email address on your account is correct. Add Quotable to your email contacts or safe senders list to prevent future emails from being blocked.
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

export default CommonIssues;
