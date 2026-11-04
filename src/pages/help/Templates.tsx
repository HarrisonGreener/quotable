import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useIsMobile } from "@/hooks/use-mobile";

const Templates = () => {
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
                Templates & Items
              </h1>

              <Accordion type="single" collapsible className="space-y-4">
                <AccordionItem value="item-1" className="border rounded-lg px-4">
                  <AccordionTrigger className="text-left">
                    What are the different PDF templates?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    Quotable offers three PDF templates: Minimalist (clean and simple), Modern (bold and colorful), and Classic (traditional and professional). You can preview each template in Settings before choosing one. The template you select will be used for all quotes and invoices you export.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2" className="border rounded-lg px-4">
                  <AccordionTrigger className="text-left">
                    How do I customize my PDF template?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    Go to Settings and update your brand information—company name, logo, address, phone, email, and VAT number. This info appears on all PDFs. You can also choose which template style to use. Currently, the layout and colors of each template are fixed, but your branding is fully customizable.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3" className="border rounded-lg px-4">
                  <AccordionTrigger className="text-left">
                    Can I save frequently used items or rates?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    Yes, use the Templates section in Settings to save common items like materials, equipment, or standard labour rates. When creating a new quote, you can quickly add these saved items instead of retyping them each time. This speeds up quoting and ensures consistency.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4" className="border rounded-lg px-4">
                  <AccordionTrigger className="text-left">
                    Why can't I edit a locked template?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    Some templates are locked to preserve standard formatting. If you need more customization, try duplicating the template and editing the copy. Alternatively, create a new custom template from scratch. Locked templates ensure consistency and prevent accidental changes to default styles.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-5" className="border rounded-lg px-4">
                  <AccordionTrigger className="text-left">
                    How do I add my logo to quotes and invoices?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    Go to Settings → Brand Information and upload your logo. It will appear on all PDF exports automatically. Use a high-quality image (PNG or JPG) with a transparent background for best results. The logo is positioned in the header section of your PDFs.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-6" className="border rounded-lg px-4">
                  <AccordionTrigger className="text-left">
                    Can I have different templates for quotes vs invoices?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    Currently, the same template applies to both quotes and invoices. However, the document type (Quote or Invoice) is clearly labeled in the header, and invoice-specific fields like due date and payment status are automatically included. Future updates may allow separate template selection.
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

export default Templates;
