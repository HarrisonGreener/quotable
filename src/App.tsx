import { Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { CookieConsent } from "@/components/CookieConsent";
import { ThemeManager } from "@/components/ThemeManager";
import { GlobalErrorBoundary } from "@/components/GlobalErrorBoundary";
import { QuotableLoader } from "@/components/Logo";
import { toast } from "sonner";
import {
  Index,
  Auth,
  Dashboard,
  Quotes,
  Invoices,
  Reports,
  Account,
  AppSettings,
  Help,
  Scheduling,
  Terms,
  Privacy,
  Clients,
  Inventory,
  Analytics,
  AdminDashboard,
  Subscribe,
  SubscriptionSuccess,
  Onboarding,
  TemplateDesigner,
  NotFound,
  HelpDemoMode,
  HelpAccurateQuotes,
  HelpCommonIssues,
  HelpTemplates,
  HelpTaxPricing,
  HelpScheduling,
  HelpClients,
  HelpInventoryPricing,
  HelpQuoteTemplates,
  HelpTroubleshooting,
  HelpContact,
  PublicQuote,
  PublicInvoice,
  TradesIndex,
  TradePage,
  GuidesIndex,
  GuidePage,
  TemplatesIndex,
  TemplatePage,
} from "@/routes";

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <QuotableLoader />
  </div>
);

const Protected = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>{children}</ProtectedRoute>
);

const UnhandledRejectionGuard = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    const handler = (event: PromiseRejectionEvent) => {
      console.error("Unhandled promise rejection:", event.reason);
      event.preventDefault();
      toast.error("Something went wrong. Please try again.");
    };
    window.addEventListener("unhandledrejection", handler);
    return () => window.removeEventListener("unhandledrejection", handler);
  }, []);
  return <>{children}</>;
};

const App = () => (
  <GlobalErrorBoundary>
    <UnhandledRejectionGuard>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, "") || undefined}>
            <AuthProvider>
              <CookieConsent />
              <ThemeManager>
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/terms" element={<Suspense fallback={<PageLoader />}><Terms /></Suspense>} />
                    <Route path="/privacy" element={<Suspense fallback={<PageLoader />}><Privacy /></Suspense>} />
                    <Route path="/subscribe" element={<Suspense fallback={<PageLoader />}><Subscribe /></Suspense>} />
                    <Route path="/onboarding" element={<Suspense fallback={<PageLoader />}><Onboarding /></Suspense>} />
                    <Route path="/q/:token" element={<Suspense fallback={<PageLoader />}><PublicQuote /></Suspense>} />
                    <Route path="/i/:token" element={<Suspense fallback={<PageLoader />}><PublicInvoice /></Suspense>} />
                    <Route path="/trades" element={<Suspense fallback={<PageLoader />}><TradesIndex /></Suspense>} />
                    <Route path="/guides" element={<Suspense fallback={<PageLoader />}><GuidesIndex /></Suspense>} />
                    <Route path="/guides/:slug" element={<Suspense fallback={<PageLoader />}><GuidePage /></Suspense>} />
                    <Route path="/quote-templates" element={<Suspense fallback={<PageLoader />}><TemplatesIndex /></Suspense>} />
                    <Route path="/quote-templates/:slug" element={<Suspense fallback={<PageLoader />}><TemplatePage /></Suspense>} />
                    <Route path="/trades/:slug" element={<Suspense fallback={<PageLoader />}><TradePage /></Suspense>} />

                    <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
                    <Route path="/quotes" element={<Protected><Quotes /></Protected>} />
                    <Route path="/invoices" element={<Protected><Invoices /></Protected>} />
                    <Route path="/scheduling" element={<Protected><Scheduling /></Protected>} />
                    <Route path="/inventory" element={<Protected><Inventory /></Protected>} />
                    <Route path="/clients" element={<Protected><Clients /></Protected>} />
                    <Route path="/analytics" element={<Protected><Analytics /></Protected>} />
                    <Route path="/reports" element={<Protected><Reports /></Protected>} />
                    <Route path="/account" element={<Protected><Account /></Protected>} />
                    <Route path="/settings" element={<Protected><AppSettings /></Protected>} />
                    <Route path="/help" element={<Protected><Help /></Protected>} />
                    <Route path="/admin" element={<Protected><AdminDashboard /></Protected>} />
                    <Route path="/templates" element={<Protected><TemplateDesigner /></Protected>} />
                    <Route path="/subscription-success" element={<Protected><SubscriptionSuccess /></Protected>} />

                    <Route path="/help/accurate-quotes" element={<Protected><HelpAccurateQuotes /></Protected>} />
                    <Route path="/help/common-issues" element={<Protected><HelpCommonIssues /></Protected>} />
                    <Route path="/help/scheduling" element={<Protected><HelpScheduling /></Protected>} />
                    <Route path="/help/tax-pricing" element={<Protected><HelpTaxPricing /></Protected>} />
                    <Route path="/help/templates" element={<Protected><HelpTemplates /></Protected>} />
                    <Route path="/help/demo-mode" element={<Protected><HelpDemoMode /></Protected>} />
                    <Route path="/help/troubleshooting" element={<Protected><HelpTroubleshooting /></Protected>} />
                    <Route path="/help/contact" element={<Protected><HelpContact /></Protected>} />
                    <Route path="/help/clients" element={<Protected><HelpClients /></Protected>} />
                    <Route path="/help/inventory-pricing" element={<Protected><HelpInventoryPricing /></Protected>} />
                    <Route path="/help/quote-templates" element={<Protected><HelpQuoteTemplates /></Protected>} />

                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </ThemeManager>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </UnhandledRejectionGuard>
  </GlobalErrorBoundary>
);

export default App;
