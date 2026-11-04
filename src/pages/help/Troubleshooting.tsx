import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useIsMobile } from "@/hooks/use-mobile";

const Troubleshooting = () => {
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
                Troubleshooting
              </h1>

              <Accordion type="single" collapsible className="space-y-4">
                <AccordionItem value="item-1" className="border rounded-lg px-4">
                  <AccordionTrigger className="text-left">
                    The app isn't loading or shows a blank screen
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    Clear your browser cache and cookies, then refresh the page. Try opening Quotable in a private/incognito window. If that works, the issue is with cached data. Check your internet connection and make sure JavaScript is enabled in your browser settings.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2" className="border rounded-lg px-4">
                  <AccordionTrigger className="text-left">
                    Buttons or links aren't responding when I click them
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    Refresh the page and try again. Disable browser extensions (especially ad blockers) to see if they're interfering. Try a different browser. If the issue persists on mobile, restart your device and ensure you're using the latest version of your browser.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3" className="border rounded-lg px-4">
                  <AccordionTrigger className="text-left">
                    My data isn't syncing across devices
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    Make sure you're logged into the same account on all devices. Check your internet connection—data syncs require a stable connection. If you made changes on one device, wait a few seconds and refresh the other device. Log out and back in if the issue continues.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4" className="border rounded-lg px-4">
                  <AccordionTrigger className="text-left">
                    I'm getting error messages when creating quotes or invoices
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    Check that all required fields are filled out—client name, job description, and at least one item. Make sure numbers are formatted correctly (no letters in quantity or price fields). If you're copying and pasting, remove any extra characters or formatting. Try creating a simpler version first to isolate the problem.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-5" className="border rounded-lg px-4">
                  <AccordionTrigger className="text-left">
                    The site looks broken or text is overlapping
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    This is usually a browser caching issue. Clear your cache and hard refresh (Ctrl+Shift+R on Windows, Cmd+Shift+R on Mac). If you're on mobile, try rotating your device or zooming in/out. Update your browser to the latest version.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-6" className="border rounded-lg px-4">
                  <AccordionTrigger className="text-left">
                    I forgot my password and can't log in
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    Click "Forgot Password" on the login page and follow the email instructions to reset it. Check your spam folder if you don't receive the email. If you signed up with Google, use "Continue with Google" instead of entering a password. If you can't remember your email, contact support.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-7" className="border rounded-lg px-4">
                  <AccordionTrigger className="text-left">
                    The PDF I downloaded is corrupted or won't open
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    Try downloading the PDF again—it may have been interrupted. Check that your PDF viewer is up to date (Adobe Reader, browser PDF viewer, etc.). Try opening it in a different program. If the problem persists, generate the PDF again from the quote or invoice page.
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

export default Troubleshooting;
