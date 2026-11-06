import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { StatsCard } from "@/components/StatsCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Receipt, 
  DollarSign, 
  TrendingUp,
  Plus,
  Download,
  Trash2
} from "lucide-react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardSkeleton } from "@/components/skeletons/DashboardSkeleton";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { SetupChecklist } from "@/components/onboarding/SetupChecklist";
import { WelcomeTour } from "@/components/onboarding/WelcomeTour";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Footer } from "@/components/Footer";
import { demoQuotes, demoInvoices, demoStats } from "@/data/demoData";
import { DemoModeNotice } from "@/components/DemoModeNotice";
import { getDemoData, setDemoData, isDemoMode } from "@/utils/demoMode";
import { DemoModeBanner } from "@/components/DemoModeBanner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const Dashboard = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isFirstLogin, completeOnboarding } = useAuth();
  const isDemo = isDemoMode(searchParams);
  const isMobile = useIsMobile();
  const [quotes, setQuotes] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalQuotes: 0, totalInvoices: 0, revenue: 0, outstanding: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [setupChecklist, setSetupChecklist] = useState({
    brand_added: false,
    quote_created: false,
    invoice_created: false,
    job_scheduled: false,
  });
  const [brandSettings, setBrandSettings] = useState<any>(null);
  const [showChecklist, setShowChecklist] = useState(true);
  
  const [deleteQuoteId, setDeleteQuoteId] = useState<string | null>(null);
  const [deleteInvoiceId, setDeleteInvoiceId] = useState<string | null>(null);

  useEffect(() => {
    const initData = async () => {
      if (isDemo) {
        const saved = getDemoData();
        if (saved) {
          setQuotes(saved.quotes);
          setInvoices(saved.invoices);
          setStats(saved.stats);
        } else {
          setQuotes(demoQuotes);
          setInvoices(demoInvoices);
          setStats(demoStats);
          setDemoData({ quotes: demoQuotes, invoices: demoInvoices, stats: demoStats });
        }
        setIsLoading(false);
      } else {
        await loadData();
      }
    };
    initData();
  }, [isDemo]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      // Load app settings for checklist
      const { data: appSettings } = await supabase
        .from('app_settings')
        .select('onboarding_completed, setup_checklist')
        .eq('user_id', user.id)
        .maybeSingle();

      if (appSettings?.setup_checklist) {
        const checklist = appSettings.setup_checklist as any;
        setSetupChecklist({
          brand_added: checklist.brand_added || false,
          quote_created: checklist.quote_created || false,
          invoice_created: checklist.invoice_created || false,
          job_scheduled: checklist.job_scheduled || false,
        });
        setShowChecklist(!appSettings.onboarding_completed);
      }

      // Load quotes
      const { data: quotesData, error: quotesError } = await supabase
        .from('quotes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (quotesError) throw quotesError;

      // Load invoices
      const { data: invoicesData, error: invoicesError } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (invoicesError) throw invoicesError;

      // Load schedules for checklist
      const { data: schedulesData } = await supabase
        .from('schedules')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      // Load brand settings for checklist (more fields for completeness check)
      const { data: brandData } = await supabase
        .from('brand_settings')
        .select('company_name, email, phone, address, logo_url, bank_name, account_number, vat_number')
        .eq('user_id', user.id)
        .maybeSingle();

      setBrandSettings(brandData);

      // Update checklist based on actual data
      const updatedChecklist = {
        brand_added: !!brandData?.company_name,
        quote_created: (quotesData?.length || 0) > 0,
        invoice_created: (invoicesData?.length || 0) > 0,
        job_scheduled: (schedulesData?.length || 0) > 0,
      };

      setSetupChecklist(updatedChecklist);

      // Update checklist in database if changed
      if (JSON.stringify(updatedChecklist) !== JSON.stringify(appSettings?.setup_checklist)) {
        await supabase
          .from('app_settings')
          .update({ setup_checklist: updatedChecklist })
          .eq('user_id', user.id);
      }

      setQuotes(quotesData || []);
      setInvoices(invoicesData || []);

      // Calculate stats
      const totalQuotes = quotesData?.length || 0;
      const totalInvoices = invoicesData?.length || 0;
      const revenue = invoicesData?.filter(inv => inv.status === 'Paid').reduce((sum, inv) => sum + inv.total, 0) || 0;
      const outstanding = invoicesData?.filter(inv => inv.status !== 'Paid').reduce((sum, inv) => sum + inv.total, 0) || 0;

      setStats({ totalQuotes, totalInvoices, revenue, outstanding });
    } catch (err: any) {
      console.error('Error loading dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteQuote = async () => {
    if (!deleteQuoteId) return;

    const { error } = await supabase
      .from('quotes')
      .delete()
      .eq('id', deleteQuoteId);

    if (error) {
      toast.error("Failed to delete quote");
      return;
    }

    toast.success("Quote deleted successfully");
    setDeleteQuoteId(null);
    loadData();
  };

  const handleDeleteInvoice = async () => {
    if (!deleteInvoiceId) return;

    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', deleteInvoiceId);

    if (error) {
      toast.error("Failed to delete invoice");
      return;
    }

    toast.success("Invoice deleted successfully");
    setDeleteInvoiceId(null);
    loadData();
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'draft': return 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200';
      case 'sent': return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-200';
      case 'accepted': return 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-200';
      case 'rejected': return 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-200';
      case 'paid': return 'bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-200';
      case 'pending': return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-200';
      case 'overdue': return 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-200';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <SidebarProvider>
      <WelcomeTour open={isFirstLogin && !isDemo} onComplete={completeOnboarding} />
      <div className="min-h-screen flex w-full overflow-x-hidden">
        <AppSidebar />
        <main className="flex-1 overflow-auto w-full">
          <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
            <div className={`flex items-center gap-4 ${isMobile ? 'p-3 h-14' : 'p-4 h-16'}`}>
              <SidebarTrigger />
              <h1 className={`font-heading ${isMobile ? 'text-xl' : 'text-2xl'}`}>Dashboard</h1>
            </div>
          </header>

          <div className={`space-y-6 max-w-full ${isMobile ? 'p-4' : 'p-6'}`}>
            {isDemo && <DemoModeBanner />}
            
            {/* Setup Checklist */}
            {!isDemo && showChecklist && !isLoading && (
              <SetupChecklist 
                checklist={setupChecklist}
                brandSettings={brandSettings}
                onDismiss={() => setShowChecklist(false)} 
              />
            )}

            {/* Loading State */}
            {isLoading && <DashboardSkeleton />}

            {/* Error State */}
            {error && <ErrorState message={error} onRetry={loadData} />}

            {/* Content */}
            {!isLoading && !error && (
              <>
            {/* Stats Grid */}
            <div className={`grid gap-4 ${isMobile ? 'grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-4'}`}>
              <StatsCard
                icon={FileText}
                title="Total Quotes"
                value={stats.totalQuotes.toString()}
                trend={isDemo ? "12% from last month" : "No data yet"}
                trendUp={true}
                onClick={() => navigate(`/quotes${isDemo ? '?demo=true' : ''}`)}
              />
              <StatsCard
                icon={Receipt}
                title="Total Invoices"
                value={stats.totalInvoices.toString()}
                trend={isDemo ? "8% from last month" : "No data yet"}
                trendUp={true}
                onClick={() => navigate(`/invoices${isDemo ? '?demo=true' : ''}`)}
              />
              <StatsCard
                icon={DollarSign}
                title="Revenue"
                value={`£${stats.revenue.toLocaleString()}`}
                trend={isDemo ? "23% from last month" : "No data yet"}
                trendUp={true}
                onClick={() => navigate(`/invoices${isDemo ? '?demo=true' : ''}`)}
              />
              <StatsCard
                icon={TrendingUp}
                title="Outstanding"
                value={`£${stats.outstanding.toLocaleString()}`}
                trend={isDemo ? "5% from last month" : "No data yet"}
                trendUp={false}
                onClick={() => navigate(`/invoices${isDemo ? '?demo=true' : ''}`)}
              />
            </div>

            {/* Recent Activity */}
            <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'lg:grid-cols-2'}`}>
              <Card className="shadow-smooth">
                <CardHeader>
                  <CardTitle className={`font-heading ${isMobile ? 'text-base' : ''}`}>Recent Quotes</CardTitle>
                </CardHeader>
                <CardContent>
                  {quotes.length > 0 ? (
                    <div className={isMobile ? 'space-y-3' : 'space-y-4'}>
                      {quotes.slice(0, 3).map((quote) => (
                        isMobile ? (
                          <div key={quote.id} className="p-3 rounded-lg border bg-card space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{quote.title}</p>
                                <p className="text-xs text-muted-foreground truncate">{quote.client}</p>
                              </div>
                              <Badge variant="secondary" className={`text-xs shrink-0 ${getStatusColor(quote.status)}`}>
                                {quote.status}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <p className="font-semibold text-sm">£{(quote.grand_total || quote.total || 0).toLocaleString()}</p>
                              {!isDemo && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() => setDeleteQuoteId(quote.id)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div key={quote.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-smooth group">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{quote.title}</p>
                              <p className="text-sm text-muted-foreground truncate">{quote.client}</p>
                            </div>
                            <div className="text-right flex items-center gap-2">
                              <div>
                                <p className="font-semibold">£{(quote.grand_total || quote.total || 0).toLocaleString()}</p>
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  quote.status === "Approved" ? "bg-green-100 text-green-700" :
                                  quote.status === "Pending" ? "bg-yellow-100 text-yellow-700" :
                                  "bg-gray-100 text-gray-700"
                                }`}>
                                  {quote.status}
                                </span>
                              </div>
                              {!isDemo && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => setDeleteQuoteId(quote.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              )}
                            </div>
                          </div>
                        )
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      icon={FileText}
                      title="No quotes yet"
                      description="Create your first AI-powered quote to get started"
                      primaryAction={{
                        label: "Create Quote",
                        onClick: () => navigate(`/quotes${isDemo ? '?demo=true' : ''}`)
                      }}
                    />
                  )}
                </CardContent>
              </Card>

              <Card className="shadow-smooth">
                <CardHeader>
                  <CardTitle className={`font-heading ${isMobile ? 'text-base' : ''}`}>Recent Invoices</CardTitle>
                </CardHeader>
                <CardContent>
                  {invoices.length > 0 ? (
                    <div className={isMobile ? 'space-y-3' : 'space-y-4'}>
                      {invoices.slice(0, 3).map((invoice) => (
                        isMobile ? (
                          <div key={invoice.id} className="p-3 rounded-lg border bg-card space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{invoice.title || invoice.client}</p>
                                <p className="text-xs text-muted-foreground truncate">{invoice.invoice_number}</p>
                              </div>
                              <Badge variant="secondary" className={`text-xs shrink-0 ${getStatusColor(invoice.status)}`}>
                                {invoice.status}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <p className="font-semibold text-sm">£{invoice.total.toLocaleString()}</p>
                              {!isDemo && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() => setDeleteInvoiceId(invoice.id)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div key={invoice.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-smooth group">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{invoice.title || invoice.client}</p>
                              <p className="text-sm text-muted-foreground truncate">{invoice.invoice_number}</p>
                            </div>
                            <div className="text-right flex items-center gap-2">
                              <div>
                                <p className="font-semibold">£{invoice.total.toLocaleString()}</p>
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  invoice.status === "Paid" ? "bg-green-100 text-green-700" :
                                  invoice.status === "Pending" ? "bg-yellow-100 text-yellow-700" :
                                  "bg-red-100 text-red-700"
                                }`}>
                                  {invoice.status}
                                </span>
                              </div>
                              {!isDemo && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => setDeleteInvoiceId(invoice.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              )}
                            </div>
                          </div>
                        )
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      icon={Receipt}
                      title="No invoices yet"
                      description="Convert a quote or create a standalone invoice to start tracking payments"
                      primaryAction={{
                        label: "Create Invoice",
                        onClick: () => navigate(`/invoices${isDemo ? '?demo=true' : ''}`)
                      }}
                    />
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'md:grid-cols-3'}`}>
              <Link to={isDemo ? "/quotes?demo=true" : "/quotes"} className="w-full">
                <Button variant="outline" size="lg" className={`w-full flex gap-2 hover:bg-accent/10 transition-smooth ${isMobile ? 'h-12 justify-start px-4' : 'h-24 flex-col'}`}>
                  <Plus className={isMobile ? 'h-5 w-5' : 'h-6 w-6'} />
                  <span className="font-medium">New Quote</span>
                </Button>
              </Link>
              <Link to={isDemo ? "/invoices?demo=true" : "/invoices"} className="w-full">
                <Button variant="outline" size="lg" className={`w-full flex gap-2 hover:bg-accent/10 transition-smooth ${isMobile ? 'h-12 justify-start px-4' : 'h-24 flex-col'}`}>
                  <Receipt className={isMobile ? 'h-5 w-5' : 'h-6 w-6'} />
                  <span className="font-medium">New Invoice</span>
                </Button>
              </Link>
              <Link to={isDemo ? "/reports?demo=true" : "/reports"} className="w-full">
                <Button variant="outline" size="lg" className={`w-full flex gap-2 hover:bg-accent/10 transition-smooth ${isMobile ? 'h-12 justify-start px-4' : 'h-24 flex-col'}`}>
                  <Download className={isMobile ? 'h-5 w-5' : 'h-6 w-6'} />
                  <span className="font-medium">View Reports</span>
                </Button>
              </Link>
            </div>
              </>
            )}
          </div>


          {/* Delete Quote Confirmation */}
          <AlertDialog open={!!deleteQuoteId} onOpenChange={(open) => !open && setDeleteQuoteId(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Quote</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this quote? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteQuote} className="bg-destructive text-destructive-foreground">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Delete Invoice Confirmation */}
          <AlertDialog open={!!deleteInvoiceId} onOpenChange={(open) => !open && setDeleteInvoiceId(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this invoice? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteInvoice} className="bg-destructive text-destructive-foreground">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Footer />
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
