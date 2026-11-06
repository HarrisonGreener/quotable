import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { TemplateDesigner } from "@/components/pdf-designer/TemplateDesigner";
import { Footer } from "@/components/Footer";
import { useSearchParams } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, Palette } from "lucide-react";

const TemplateDesignerPage = () => {
  const [searchParams] = useSearchParams();
  const isDemo = searchParams.get("demo") === "true";

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full overflow-x-hidden">
        <AppSidebar />
        <main className="flex-1 overflow-auto w-full">
          <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
            <div className="flex items-center gap-4 p-4 h-16">
              <SidebarTrigger />
              <div className="flex items-center gap-2">
                <Palette className="w-6 h-6 text-primary" />
                <h1 className="font-heading text-2xl">PDF Template Designer</h1>
              </div>
            </div>
          </header>

          <div className="p-6 max-w-6xl mx-auto">
            {isDemo && (
              <Alert className="border-accent bg-accent/10 mb-6">
                <Info className="h-4 w-4 text-accent" />
                <AlertDescription>
                  <strong>Demo Mode:</strong> Templates can't be saved in demo mode. Create an account to save your custom templates.
                </AlertDescription>
              </Alert>
            )}

            <div className="mb-6">
              <p className="text-muted-foreground">
                Design professional, print-ready templates for your quotes and invoices. Customize colours, fonts, 
                layout, and section visibility. Each template can be configured differently for quotes and invoices 
                while maintaining consistent branding.
              </p>
            </div>

            <TemplateDesigner />
          </div>

          <Footer compact />
        </main>
      </div>
    </SidebarProvider>
  );
};

export default TemplateDesignerPage;
