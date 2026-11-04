import { ArrowLeft, Mail, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";

const Contact = () => {
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
                Contact Support
              </h1>

              <p className="text-muted-foreground mb-8 leading-relaxed">
                Can't find what you're looking for? Our support team is here to help. Choose the best way to reach us below.
              </p>

              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-lg bg-accent/10">
                        <Mail className="h-5 w-5 text-accent" />
                      </div>
                      <CardTitle>Email Support</CardTitle>
                    </div>
                    <CardDescription className="leading-relaxed">
                      For general inquiries, billing questions, or technical issues that aren't urgent.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <a 
                      href="mailto:support@quotable-it.co.uk" 
                      className="text-accent hover:underline font-medium"
                    >
                      support@quotable-it.co.uk
                    </a>
                    <p className="text-sm text-muted-foreground mt-3">
                      Response time: Within 24-48 hours
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-lg bg-accent/10">
                        <MessageCircle className="h-5 w-5 text-accent" />
                      </div>
                      <CardTitle>Live Chat</CardTitle>
                    </div>
                    <CardDescription className="leading-relaxed">
                      For urgent issues or if you need immediate assistance with the app.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-3">
                      Available Monday - Friday, 9am - 5pm GMT
                    </p>
                    <Button variant="accent" disabled>
                      Coming Soon
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <Card className="mt-8">
                <CardHeader>
                  <CardTitle>Before You Contact Us</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-accent mt-1">•</span>
                      <span>Check if your question is answered in the Help sections above</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent mt-1">•</span>
                      <span>Try basic troubleshooting steps like clearing your cache or refreshing the page</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent mt-1">•</span>
                      <span>Include details like browser type, device, and screenshots when reporting issues</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent mt-1">•</span>
                      <span>Provide your account email so we can look up your account details</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Contact;
