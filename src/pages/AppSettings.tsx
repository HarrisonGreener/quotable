import { useState, useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, Moon, Sun } from "lucide-react";
import { toast } from "sonner";
import { useUserTheme } from "@/hooks/useUserTheme";
import { supabase } from "@/integrations/supabase/client";
import { useSearchParams } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { Footer } from "@/components/Footer";

const AppSettings = () => {
  const [searchParams] = useSearchParams();
  const isDemo = searchParams.get("demo") === "true";
  const { theme, selectedPalette, updateTheme, palettes } = useUserTheme();
  const [currency, setCurrency] = useState("GBP");
  const [language, setLanguage] = useState("en");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [invoiceReminders, setInvoiceReminders] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!isDemo) {
      loadSettings();
    }
  }, [isDemo]);

  const loadSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      setUserId(user.id);

      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setCurrency(data.currency || "GBP");
        setLanguage(data.language || "en");
        setEmailNotifications(data.email_notifications ?? true);
        setInvoiceReminders(data.invoice_reminders ?? true);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleExportData = () => {
    toast.info("Data export feature coming soon");
  };

  const handleSaveSettings = async () => {
    if (isDemo) {
      toast.error("Settings can't be saved in demo mode");
      return;
    }

    if (!userId) {
      toast.error("Please log in to save settings");
      return;
    }

    try {
      const { error } = await supabase
        .from('app_settings')
        .upsert({
          user_id: userId,
          currency,
          language,
          email_notifications: emailNotifications,
          invoice_reminders: invoiceReminders,
        }, { onConflict: 'user_id' });

      if (error) throw error;

      toast.success("Settings saved successfully");
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error("Failed to save settings. Please try again.");
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full overflow-x-hidden">
        <AppSidebar />
        <main className="flex-1 overflow-auto w-full">
          <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
            <div className="flex items-center gap-4 p-4 h-16">
              <SidebarTrigger />
              <h1 className="font-heading text-2xl">Settings</h1>
            </div>
          </header>

          <div className="p-6 space-y-6 max-w-3xl">
            {isDemo && (
              <Alert className="border-accent bg-accent/10">
                <Info className="h-4 w-4 text-accent" />
                <AlertDescription>
                  <strong>Demo Mode:</strong> Settings can't be saved in demo mode. Create an account to customize your preferences.
                </AlertDescription>
              </Alert>
            )}

            {/* Appearance */}
            <Card className="shadow-smooth">
              <CardHeader>
                <CardTitle className="font-heading">Appearance</CardTitle>
                <CardDescription>Customize how Quotable looks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="theme">Color Mode</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={theme === "light" ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateTheme("light")}
                      disabled={isDemo}
                    >
                      <Sun className="h-4 w-4 mr-2" />
                      Light
                    </Button>
                    <Button
                      variant={theme === "dark" ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateTheme("dark")}
                      disabled={isDemo}
                    >
                      <Moon className="h-4 w-4 mr-2" />
                      Dark
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card className="shadow-smooth">
              <CardHeader>
                <CardTitle className="font-heading">Notifications</CardTitle>
                <CardDescription>Manage notification preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="email-notifications">Email Notifications</Label>
                  <Switch
                    id="email-notifications"
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="invoice-reminders">Invoice Payment Reminders</Label>
                  <Switch
                    id="invoice-reminders"
                    checked={invoiceReminders}
                    onCheckedChange={setInvoiceReminders}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Data Export */}
            <Card className="shadow-smooth">
              <CardHeader>
                <CardTitle className="font-heading">Data Export</CardTitle>
                <CardDescription>Export all your data</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" onClick={handleExportData}>
                  <Download className="mr-2 h-4 w-4" />
                  Export All Data (CSV)
                </Button>
              </CardContent>
            </Card>

            <Button onClick={handleSaveSettings} disabled={isDemo} className="w-full md:w-auto">
              Save Settings
            </Button>
          </div>
          <Footer compact />
        </main>
      </div>
    </SidebarProvider>
  );
};

export default AppSettings;
