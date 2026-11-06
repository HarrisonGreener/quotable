import { HelpCircle, DollarSign, Calendar, FileText, AlertCircle, Settings, PlayCircle, Mail, Users, Package, Copy } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useIsMobile } from "@/hooks/use-mobile";

const helpSections = [
  {
    title: "Getting the Most Accurate Quote",
    description: "Learn how to create detailed quotes that reflect the true cost of your work",
    icon: FileText,
    href: "/help/accurate-quotes"
  },
  {
    title: "Client Management",
    description: "Manage your client database, view job histories, and track revenue per client",
    icon: Users,
    href: "/help/clients"
  },
  {
    title: "Inventory & Pricing",
    description: "Store your parts with prices and understand how dynamic pricing works",
    icon: Package,
    href: "/help/inventory-pricing"
  },
  {
    title: "Quote Templates",
    description: "Save and reuse common job configurations for faster quoting",
    icon: Copy,
    href: "/help/quote-templates"
  },
  {
    title: "Scheduling & Calendar",
    description: "Master the drag-and-drop calendar and track job timelines",
    icon: Calendar,
    href: "/help/scheduling"
  },
  {
    title: "Tax & Pricing",
    description: "Understand how taxes are calculated and applied to your quotes and invoices",
    icon: DollarSign,
    href: "/help/tax-pricing"
  },
  {
    title: "PDF Templates",
    description: "Customize PDF templates and manage your document branding",
    icon: Settings,
    href: "/help/templates"
  },
  {
    title: "Common Issues",
    description: "Quick fixes for the most frequent problems users encounter",
    icon: AlertCircle,
    href: "/help/common-issues"
  },
  {
    title: "Demo Mode",
    description: "Learn what demo mode is and why it can't save data",
    icon: PlayCircle,
    href: "/help/demo-mode"
  },
  {
    title: "Troubleshooting",
    description: "Detailed guides for fixing technical issues and errors",
    icon: HelpCircle,
    href: "/help/troubleshooting"
  },
  {
    title: "Contact Support",
    description: "Get in touch with our team for personalized assistance",
    icon: Mail,
    href: "/help/contact"
  }
];

const Help = () => {
  const isMobile = useIsMobile();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <SidebarInset className="flex-1">
          {/* Sticky Header with Hamburger */}
          <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className={`flex items-center gap-4 ${isMobile ? 'p-3 h-14' : 'p-4 h-16'}`}>
              <SidebarTrigger />
              <h1 className={`font-heading text-foreground ${isMobile ? 'text-xl' : 'text-2xl'}`}>
                Help & Support
              </h1>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto">
            <div className="container mx-auto p-4 sm:p-6 md:p-8 max-w-7xl">
              {/* Intro */}
              <div className="mb-8">
                <p className="text-muted-foreground text-base sm:text-lg max-w-2xl">
                  Find answers to common questions and get the most out of Quotable.
                </p>
              </div>

              {/* Help Sections Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {helpSections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <Link key={section.title} to={section.href} className="group">
                      <Card className="h-full transition-all hover:shadow-lg hover:border-accent/50 cursor-pointer">
                        <CardHeader className="space-y-3">
                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-accent/10 group-hover:bg-accent/20 transition-colors">
                              <Icon className="h-5 w-5 text-accent" />
                            </div>
                          </div>
                          <CardTitle className="text-lg group-hover:text-accent transition-colors">
                            {section.title}
                          </CardTitle>
                          <CardDescription className="text-sm leading-relaxed">
                            {section.description}
                          </CardDescription>
                        </CardHeader>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Help;
