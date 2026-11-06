import { useState, useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileDown, CheckCircle, Clock, ArrowRight, Trash2, Search, Filter } from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { demoInvoices, demoQuotes, demoStats } from "@/data/demoData";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { generateInvoicePDF, generateInvoicePDFBlob, isBrandComplete } from "@/utils/pdfTemplates";
import { PDFPreviewShareDialog } from "@/components/PDFPreviewShareDialog";
import { SendLinkButton } from "@/components/SendLinkButton";
import { AccountingExportMenu } from "@/components/AccountingExportMenu";
import { BrandCompletionNotice } from "@/components/BrandCompletionNotice";
import { DemoModeNotice } from "@/components/DemoModeNotice";
import { getDemoData, isDemoMode, setDemoData } from "@/utils/demoMode";
import { DemoModeBanner } from "@/components/DemoModeBanner";
import { useIsMobile } from "@/hooks/use-mobile";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Footer } from "@/components/Footer";
import { CreateInvoiceForm } from "@/components/CreateInvoiceForm";
import { useAppSettings } from "@/hooks/useAppSettings";
import { SaveAsClientButton } from "@/components/SaveAsClientButton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const Invoices = () => {
  const { settings: appSettings } = useAppSettings();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isDemo = isDemoMode(searchParams);
  const isMobile = useIsMobile();
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(true);
  const [isLoadingQuotes, setIsLoadingQuotes] = useState(true);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [deleteInvoiceId, setDeleteInvoiceId] = useState<string | null>(null);
  const [brandSettings, setBrandSettings] = useState<any>(null);
  const [pdfTemplate, setPdfTemplate] = useState<"minimalist" | "modern" | "classic">("minimalist");
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  
  // PDF Preview & Share state
  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const [pdfPreviewData, setPdfPreviewData] = useState<{
    blobUrl: string;
    blob: Blob;
    fileName: string;
    documentType: "Quote" | "Invoice";
    client: string;
    total: number;
    date: string;
    invoiceData?: any;
  } | null>(null);
  useEffect(() => {
    const getUser = async () => {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      setUser(user);
      if (isDemo) {
        // Load demo data from localStorage or defaults
        const saved = getDemoData();
        if (saved?.invoices) {
          setInvoices(saved.invoices);
          // Load quotes from saved data or demo defaults
          setQuotes(saved.quotes?.filter((q: any) => q.status === 'Draft' || q.status === 'Accepted') || 
                    demoQuotes.filter(q => q.status === 'Draft' || q.status === 'Accepted'));
        } else {
          setInvoices(demoInvoices);
          // Set demo quotes
          setQuotes(demoQuotes.filter(q => q.status === 'Draft' || q.status === 'Accepted'));
          setDemoData({
            quotes: demoQuotes,
            invoices: demoInvoices,
            stats: demoStats
          });
        }
        setIsLoadingInvoices(false);
        setIsLoadingQuotes(false);
      } else if (user) {
        loadInvoices();
        loadQuotes();
        loadBrandSettings();
        loadPdfTemplate();
      }
    };
    getUser();
  }, [isDemo]);

  // Real-time subscription for quote updates
  useEffect(() => {
    if (isDemo || !user) return;

    const channel = supabase
      .channel('invoices-quotes-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'quotes'
        },
        () => {
          loadQuotes(); // Refetch quotes when changes occur
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isDemo, user]);
  const loadBrandSettings = async () => {
    const {
      data: {
        user
      }
    } = await supabase.auth.getUser();
    if (!user) return;
    const {
      data
    } = await supabase.from('brand_settings').select('*').eq('user_id', user.id).maybeSingle();
    setBrandSettings(data);
  };
  const loadPdfTemplate = async () => {
    const {
      data: {
        user
      }
    } = await supabase.auth.getUser();
    if (!user) return;
    const {
      data
    } = await supabase.from('app_settings').select('pdf_theme').eq('user_id', user.id).maybeSingle();
    if (data?.pdf_theme) setPdfTemplate(data.pdf_theme as "minimalist" | "modern" | "classic");
  };
  const loadInvoices = async () => {
    const {
      data: {
        user
      }
    } = await supabase.auth.getUser();
    if (!user) return;
    const {
      data,
      error
    } = await supabase.from('invoices').select('*').eq('user_id', user.id).order('created_at', {
      ascending: false
    });
    if (error) {
      console.error("Error loading invoices:", error);
      return;
    }
    setInvoices(data || []);
  };
  const loadQuotes = async () => {
    const {
      data: {
        user
      }
    } = await supabase.auth.getUser();
    if (!user) return;
    const {
      data,
      error
    } = await supabase.from('quotes').select('*').eq('user_id', user.id).in('status', ['Draft', 'Accepted']).order('created_at', {
      ascending: false
    });
    if (error) {
      console.error("Error loading quotes:", error);
      return;
    }
    setQuotes(data || []);
    setIsLoadingQuotes(false);
  };
  
  // Filter invoices based on search and status
  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch = 
      invoice.client?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.invoice_number?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });
  
  const displayInvoices = filteredInvoices;
  const handleMarkAsPaid = async (id: string) => {
    if (isDemo) {
      toast.error("Please sign up or log in to modify invoices", {
        description: "Demo mode is view-only",
        action: {
          label: "Sign Up",
          onClick: () => navigate("/auth")
        }
      });
      return;
    }
    const {
      error
    } = await supabase.from('invoices').update({
      status: 'Paid',
      updated_at: new Date().toISOString()
    }).eq('id', id);
    if (error) {
      toast.error("Failed to update invoice");
      return;
    }
    toast.success("Invoice marked as paid - tax summary updated");
    await loadInvoices(); // Reload to trigger UI update
  };
  const handleExportPDF = async (invoice: any) => {
    if (isDemo) {
      toast.error("PDF export is not available in demo mode", {
        description: "Subscribe to Quotable Pro to save and export professional PDFs",
        action: {
          label: "Sign Up",
          onClick: () => navigate("/auth")
        }
      });
      return;
    }
    try {
      // Fetch quote details if linked
      let quoteDetails = null;
      if (invoice.quote_id) {
        const { data } = await supabase
          .from('quotes')
          .select('job_description, category, location')
          .eq('id', invoice.quote_id)
          .single();
        quoteDetails = data;
      }

      const invoiceData = {
        invoiceNumber: invoice.invoice_number,
        date: new Date(invoice.date).toLocaleDateString('en-GB'),
        dueDate: new Date(invoice.due_date).toLocaleDateString('en-GB'),
        client: invoice.client,
        title: invoice.title,
        amount: invoice.amount,
        tax: invoice.tax,
        total: invoice.total,
        status: invoice.status,
        summary: invoice.summary,
        paymentTerms: appSettings.payment_terms,
        quoteDetails
      };

      // Generate PDF as blob for preview
      const { blob } = generateInvoicePDFBlob(invoiceData, brandSettings, pdfTemplate);
      const blobUrl = URL.createObjectURL(blob);
      const fileName = `Invoice_${invoice.invoice_number}_${invoice.client.replace(/\s+/g, '_')}.pdf`;
      
      // Open preview dialog
      setPdfPreviewData({
        blobUrl,
        blob,
        fileName,
        documentType: "Invoice",
        client: invoice.client,
        total: invoice.total,
        date: new Date(invoice.date).toLocaleDateString("en-GB"),
        invoiceData,
      });
      setShowPDFPreview(true);

      if (!isBrandComplete(brandSettings)) {
        toast.success("Invoice generated! Complete your brand details for professional PDFs.");
      }
    } catch (error) {
      console.error("PDF export error:", error);
      toast.error("Failed to export PDF. Please try again.");
    }
  };
  const handleConvertToInvoice = async (quote: any) => {
    if (isDemo) {
      toast.error("Please sign up or log in to convert quotes", {
        description: "Demo mode is view-only",
        action: {
          label: "Sign Up",
          onClick: () => navigate("/auth")
        }
      });
      return;
    }
    if (!user) {
      toast.error("Please log in to convert quotes");
      return;
    }
    const tax = appSettings.include_vat ? quote.grand_total * 0.20 : 0;
    const total = quote.grand_total + tax;
    const today = new Date();
    const dueDate = new Date(today);
    dueDate.setDate(dueDate.getDate() + (appSettings.payment_terms || 30));
    const {
      error
    } = await supabase.from('invoices').insert([{
      user_id: user.id,
      quote_id: quote.id,
      invoice_number: `INV-${Date.now()}`,
      title: quote.title,
      client: quote.client,
      date: today.toISOString().split('T')[0],
      due_date: dueDate.toISOString().split('T')[0],
      amount: quote.grand_total,
      tax: tax,
      total: total,
      status: 'Pending',
      summary: quote.job_description || quote.summary
    }]);
    if (error) {
      console.error("Error creating invoice:", error);
      toast.error("Failed to create invoice");
      return;
    }

    // Update quote status to Sent
    await supabase.from('quotes').update({
      status: 'Sent'
    }).eq('id', quote.id);
    toast.success("Quote converted to invoice!");
    await loadInvoices(); // Reload to trigger UI update
    await loadQuotes();
  };
  const handleDeleteInvoice = async () => {
    if (!deleteInvoiceId) return;
    if (isDemo) {
      toast.error("Cannot delete invoices in demo mode", {
        description: "Subscribe to Quotable Pro to manage your invoices",
        action: {
          label: "Sign Up",
          onClick: () => navigate("/auth")
        }
      });
      setDeleteInvoiceId(null);
      return;
    }
    const {
      error
    } = await supabase.from('invoices').delete().eq('id', deleteInvoiceId);
    if (error) {
      toast.error("Failed to delete invoice");
      return;
    }
    toast.success("Invoice deleted successfully");
    setDeleteInvoiceId(null);
    await loadInvoices();
  };
  return <SidebarProvider>
      <div className="min-h-screen flex w-full overflow-x-hidden">
        <AppSidebar />
        <main className="flex-1 overflow-auto w-full">
          <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
            <div className={`flex items-center gap-4 ${isMobile ? 'p-3 h-14' : 'p-4 h-16'}`}>
              <SidebarTrigger />
              <h1 className={`font-heading ${isMobile ? 'text-xl' : 'text-2xl'}`}>Invoices</h1>
            </div>
            <div className="ml-auto">
              <AccountingExportMenu invoices={invoices} disabled={!invoices.length} />
            </div>
          </header>

          <div className={`max-w-full ${isMobile ? 'p-3 space-y-4 pb-24' : 'p-6 space-y-8 pb-12'}`}>
            {isDemo && <DemoModeBanner />}
            {!isDemo && !isBrandComplete(brandSettings) && <BrandCompletionNotice brandSettings={brandSettings} />}
            
            <Tabs defaultValue="invoices" className="w-full mb-16 md:mb-10">
              <TabsList className={isMobile ? 'mb-6 h-auto p-1' : ''}>
                <TabsTrigger value="invoices" className={isMobile ? 'py-3 px-4 text-sm' : ''}>Invoices</TabsTrigger>
                <TabsTrigger value="create" className={isMobile ? 'py-3 px-4 text-sm' : ''}>Create Invoice</TabsTrigger>
                <TabsTrigger value="quotes" className={isMobile ? 'py-3 px-4 text-sm' : ''}>Quotes to Convert</TabsTrigger>
              </TabsList>

              <TabsContent value="invoices" className={isMobile ? 'mt-8' : ''}>
                {/* Search and Filters */}
                <Card className="shadow-smooth mb-4">
                  <CardContent className="pt-6">
                    {/* Desktop: Search and Filters side by side */}
                    <div className="hidden md:flex gap-4 items-center">
                      <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search invoices by client, title, or number..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="Draft">Draft</SelectItem>
                          <SelectItem value="Pending">Pending</SelectItem>
                          <SelectItem value="Paid">Paid</SelectItem>
                          <SelectItem value="Overdue">Overdue</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Mobile: Collapsible Search + Filter Button */}
                    <div className="md:hidden space-y-3">
                      <div className="flex gap-2">
                        <div className="flex-1 relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search invoices..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 h-12"
                          />
                        </div>
                        <Button 
                          variant="outline" 
                          size="icon"
                          className="h-12 w-12"
                          onClick={() => setShowMobileFilters(!showMobileFilters)}
                        >
                          <Filter className="h-5 w-5" />
                        </Button>
                      </div>
                      
                      {showMobileFilters && (
                        <div className="p-3 border rounded-lg bg-muted/30">
                          <Label className="text-sm mb-2 block">Status</Label>
                          <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="h-12">
                              <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all" className="py-3">All</SelectItem>
                              <SelectItem value="Draft" className="py-3">Draft</SelectItem>
                              <SelectItem value="Pending" className="py-3">Pending</SelectItem>
                              <SelectItem value="Paid" className="py-3">Paid</SelectItem>
                              <SelectItem value="Overdue" className="py-3">Overdue</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className={`shadow-smooth ${isMobile ? 'mx-0' : ''}`}>
                  <CardHeader>
                    <CardTitle className="font-heading">All Invoices</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {displayInvoices.length > 0 ? <div className={isMobile ? 'space-y-8' : 'space-y-4'}>
                        {displayInvoices.map(invoice => <div key={invoice.id} className={`border border-border rounded-lg hover:border-accent transition-smooth ${isMobile ? 'p-5' : 'p-4'}`}>
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <h3 className="font-semibold text-lg">{invoice.title}</h3>
                                <p className="text-sm text-muted-foreground">{invoice.invoice_number}</p>
                              </div>
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${invoice.status === "Paid" ? "bg-green-100 text-green-700" : invoice.status === "Pending" ? "bg-yellow-100 text-yellow-700" : invoice.status === "Overdue" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"}`}>
                                {invoice.status}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                              <div>
                                <p className="text-muted-foreground">Client</p>
                                <p className="font-medium">{invoice.client}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Date</p>
                                <p className="font-medium">{new Date(invoice.date).toLocaleDateString('en-GB')}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Due Date</p>
                                <p className="font-medium">{new Date(invoice.due_date).toLocaleDateString('en-GB')}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Amount</p>
                                <p className="font-medium">£{invoice.amount.toLocaleString()}</p>
                              </div>
                            </div>
                            <div className={`flex items-center pt-3 border-t border-border ${isMobile ? 'flex-col gap-3' : 'justify-between'}`}>
                              <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">Tax (20%): £{invoice.tax.toLocaleString()}</p>
                                <p className="font-semibold text-lg">Total: £{invoice.total.toLocaleString()}</p>
                              </div>
                              <div className={`flex gap-2 ${isMobile ? 'flex-col w-full' : 'flex-wrap'}`}>
                                {invoice.status !== "Paid" && <Button variant="default" size="sm" onClick={() => handleMarkAsPaid(invoice.id)} className={isMobile ? 'w-full justify-start' : ''}>
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Mark as Paid
                                  </Button>}
                                 <Button variant="outline" size="sm" onClick={() => handleExportPDF(invoice)} className={isMobile ? 'w-full justify-start' : ''}>
                                   <FileDown className="mr-2 h-4 w-4" />
                                   Export PDF
                                 </Button>
                                 {!isDemo && (
                                   <>
                                     <SendLinkButton
                                       type="invoice"
                                       record={invoice as any}
                                       businessName={brandSettings?.company_name}
                                       onUpdated={loadInvoices}
                                       className={isMobile ? 'w-full justify-start' : ''}
                                     />
                                     <Button variant="ghost" size="sm" onClick={() => setDeleteInvoiceId(invoice.id)} className={isMobile ? 'w-full justify-start' : ''}>
                                       <Trash2 className="mr-2 h-4 w-4" />
                                       Delete
                                     </Button>
                                     {!invoice.client_id && (
                                       <SaveAsClientButton
                                         clientName={invoice.client}
                                         invoiceId={invoice.id}
                                         onClientSaved={loadInvoices}
                                       />
                                     )}
                                   </>
                                 )}
                              </div>
                            </div>
                          </div>)}
                      </div> : <div className="text-center py-12">
                        <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">
                          {searchQuery || statusFilter !== "all" ? "No invoices found" : "No invoices yet"}
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">
                          {searchQuery || statusFilter !== "all" 
                            ? "Try adjusting your search or filters" 
                            : "Convert quotes to invoices to get started"}
                        </p>
                      </div>}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="create" className={isMobile ? 'mt-8' : ''}>
                {isDemo ? (
                  <Card className={`shadow-smooth ${isMobile ? 'mx-0' : ''}`}>
                    <CardContent className="py-12 text-center">
                      <p className="text-muted-foreground mb-4">Invoice creation is not available in demo mode</p>
                      <Button onClick={() => navigate("/auth")}>
                        Sign Up to Create Invoices
                      </Button>
                    </CardContent>
                  </Card>
                ) : user ? (
                  <CreateInvoiceForm userId={user.id} onSuccess={loadInvoices} isMobile={isMobile} />
                ) : (
                  <Card className={`shadow-smooth ${isMobile ? 'mx-0' : ''}`}>
                    <CardContent className="py-12 text-center">
                      <p className="text-muted-foreground mb-4">Please log in to create invoices</p>
                      <Button onClick={() => navigate("/auth")}>
                        Log In
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="quotes" className={isMobile ? 'mt-8' : ''}>
                <Card className={`shadow-smooth ${isMobile ? 'mx-0' : ''}`}>
                  <CardHeader className="my-[22px]">
                    <CardTitle className="font-heading">Quotes Ready to Convert</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {quotes.length > 0 ? <div className={isMobile ? 'space-y-8' : 'space-y-4'}>
                        {quotes.map(quote => <div key={quote.id} className={`border border-border rounded-lg hover:border-accent transition-smooth ${isMobile ? 'p-5' : 'p-4'}`}>
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <h3 className="font-semibold text-lg">{quote.title}</h3>
                                <p className="text-sm text-muted-foreground">{quote.client} • {quote.location}</p>
                              </div>
                              <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700">
                                {quote.status}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4 text-sm">
                              <div>
                                <p className="text-muted-foreground">Category</p>
                                <p className="font-medium">{quote.category}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Created</p>
                                <p className="font-medium">{new Date(quote.created_at).toLocaleDateString('en-GB')}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Total</p>
                                <p className="font-medium text-primary text-lg">£{quote.grand_total.toLocaleString()}</p>
                              </div>
                            </div>
                            <div className={`pt-3 border-t border-border ${isMobile ? '' : 'flex justify-end'}`}>
                              <Button variant="default" onClick={() => handleConvertToInvoice(quote)} className={isMobile ? 'w-full' : ''}>
                                <ArrowRight className="mr-2 h-4 w-4" />
                                Convert to Invoice
                              </Button>
                            </div>
                          </div>)}
                      </div> : <div className="text-center py-12">
                        <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No quotes to convert</p>
                        <p className="text-sm text-muted-foreground mt-2">Create and save quotes in the Quotes section</p>
                      </div>}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
            
            <div className="h-6 md:h-4" aria-hidden />
          </div>

          {/* Delete Invoice Confirmation */}
          <AlertDialog open={!!deleteInvoiceId} onOpenChange={open => !open && setDeleteInvoiceId(null)}>
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

          {/* PDF Preview & Share Dialog */}
          {pdfPreviewData && (
            <PDFPreviewShareDialog
              open={showPDFPreview}
              onOpenChange={setShowPDFPreview}
              blobUrl={pdfPreviewData.blobUrl}
              blob={pdfPreviewData.blob}
              fileName={pdfPreviewData.fileName}
              documentType={pdfPreviewData.documentType}
              client={pdfPreviewData.client}
              total={pdfPreviewData.total}
              date={pdfPreviewData.date}
              invoiceData={pdfPreviewData.invoiceData}
              brandSettings={brandSettings}
              pdfTemplate={pdfTemplate}
            />
          )}

          <Footer />
        </main>
      </div>
    </SidebarProvider>;
};
export default Invoices;