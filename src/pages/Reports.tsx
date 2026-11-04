import { useState, useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, TrendingUp, FileText, Calendar, Download } from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { demoInvoices, demoStats, demoTaxSummary, demoQuotes } from "@/data/demoData";
import { DemoModeNotice } from "@/components/DemoModeNotice";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getDemoData, setDemoData } from "@/utils/demoMode";
import { Footer } from "@/components/Footer";

const Reports = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isDemo = searchParams.get("demo") === "true";
  const [invoices, setInvoices] = useState<any[]>([]);
  const [stats, setStats] = useState({ revenue: 0, taxCollected: 0, outstanding: 0 });
  const [brandSettings, setBrandSettings] = useState<any>(null);
  const [pdfTemplate, setPdfTemplate] = useState<"minimalist" | "modern" | "classic">("minimalist");

  useEffect(() => {
    if (isDemo) {
      // Load demo data from localStorage or defaults
      const saved = getDemoData();
      if (saved?.invoices && saved?.stats) {
        setInvoices(saved.invoices);
        setStats(saved.stats);
      } else {
        setInvoices(demoInvoices);
        setStats(demoStats);
        setDemoData({ quotes: demoQuotes, invoices: demoInvoices, stats: demoStats });
      }
    } else {
      loadData();
      loadBrandSettings();
      loadPdfTemplate();
    }
  }, [isDemo]);

  const loadBrandSettings = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('brand_settings')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    setBrandSettings(data);
  };

  const loadPdfTemplate = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('app_settings')
      .select('pdf_theme')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data?.pdf_theme) {
      setPdfTemplate(data.pdf_theme as "minimalist" | "modern" | "classic");
    }
  };

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: invoicesData } = await supabase
      .from('invoices')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    setInvoices(invoicesData || []);

    // Calculate stats from paid invoices
    const paidInvoices = invoicesData?.filter(inv => inv.status === 'Paid') || [];
    const revenue = paidInvoices.reduce((sum, inv) => sum + inv.total, 0);
    const taxCollected = paidInvoices.reduce((sum, inv) => sum + inv.tax, 0);
    const unpaidInvoices = invoicesData?.filter(inv => inv.status !== 'Paid') || [];
    const outstanding = unpaidInvoices.reduce((sum, inv) => sum + inv.total, 0);

    setStats({ revenue, taxCollected, outstanding });
  };

  const handleDownloadReport = async () => {
    if (isDemo) {
      toast.error("Report export is not available in demo mode", {
        description: "Subscribe to Quotable Pro to export professional tax reports",
        action: {
          label: "Sign Up",
          onClick: () => navigate("/auth")
        }
      });
      return;
    }

    if (!invoices || invoices.length === 0) {
      toast.error("No data to export");
      return;
    }

    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      
      const pageWidth = 210;
      const margin = 20;
      let yPos = margin;

      // Header
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(41, 98, 255);
      doc.text('TAX SUMMARY REPORT', margin, yPos);
      yPos += 10;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(`Tax Year: 2025`, margin, yPos);
      yPos += 5;
      doc.text(`Generated: ${new Date().toLocaleDateString('en-GB')}`, margin, yPos);
      yPos += 12;

      // Annual Summary Box
      doc.setFillColor(41, 98, 255);
      doc.rect(margin, yPos, pageWidth - (margin * 2), 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('ANNUAL SUMMARY', margin + 2, yPos + 6);
      yPos += 12;

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      // Calculate user's actual tax data
      const paidInvoices = invoices.filter(inv => inv.status === 'Paid');
      const totalRevenue = paidInvoices.reduce((sum, inv) => sum + inv.total, 0);
      const totalTaxCollected = paidInvoices.reduce((sum, inv) => sum + inv.tax, 0);
      const totalTaxableIncome = totalRevenue - totalTaxCollected;

      const annualData = [
        ['Total Revenue (Paid):', `£${totalRevenue.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`],
        ['VAT Collected (20%):', `£${totalTaxCollected.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`],
        ['Taxable Income:', `£${totalTaxableIncome.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`],
      ];

      annualData.forEach(([label, value]) => {
        doc.text(label, margin + 2, yPos);
        doc.setFont('helvetica', 'bold');
        doc.text(value, pageWidth - margin - 2, yPos, { align: 'right' });
        doc.setFont('helvetica', 'normal');
        yPos += 6;
      });
      yPos += 8;

      // Quarterly Breakdown
      doc.setFillColor(41, 98, 255);
      doc.rect(margin, yPos, pageWidth - (margin * 2), 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('QUARTERLY BREAKDOWN', margin + 2, yPos + 6);
      yPos += 12;

      // Calculate quarterly breakdown from user's invoices
      const calculateQuarter = (quarter: number) => {
        const quarterInvoices = paidInvoices.filter(inv => {
          const date = new Date(inv.date);
          const month = date.getMonth() + 1;
          return month >= (quarter - 1) * 3 + 1 && month <= quarter * 3;
        });
        const revenue = quarterInvoices.reduce((sum, inv) => sum + inv.total, 0);
        const taxCollected = quarterInvoices.reduce((sum, inv) => sum + inv.tax, 0);
        return {
          revenue,
          taxCollected,
          taxableIncome: revenue - taxCollected
        };
      };

      const quarters = [
        { name: 'Q1 (Jan - Mar)', data: calculateQuarter(1) },
        { name: 'Q2 (Apr - Jun)', data: calculateQuarter(2) },
        { name: 'Q3 (Jul - Sep)', data: calculateQuarter(3) },
        { name: 'Q4 (Oct - Dec)', data: calculateQuarter(4) },
      ];

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);

      quarters.forEach(({ name, data }) => {
        if (yPos > 260) {
          doc.addPage();
          yPos = margin;
        }

        doc.setFont('helvetica', 'bold');
        doc.text(name, margin + 2, yPos);
        yPos += 6;

        doc.setFont('helvetica', 'normal');
        doc.text(`Revenue:`, margin + 5, yPos);
        doc.text(`£${data.revenue.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`, pageWidth - margin - 2, yPos, { align: 'right' });
        yPos += 5;

        doc.text(`VAT Collected:`, margin + 5, yPos);
        doc.text(`£${data.taxCollected.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`, pageWidth - margin - 2, yPos, { align: 'right' });
        yPos += 5;

        doc.text(`Taxable Income:`, margin + 5, yPos);
        doc.text(`£${data.taxableIncome.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`, pageWidth - margin - 2, yPos, { align: 'right' });
        yPos += 8;
      });

      // Invoice Details
      if (yPos > 220) {
        doc.addPage();
        yPos = margin;
      }

      doc.setFillColor(41, 98, 255);
      doc.rect(margin, yPos, pageWidth - (margin * 2), 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('INVOICE DETAILS', margin + 2, yPos + 6);
      yPos += 12;

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(9);

      invoices.forEach((inv) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = margin;
        }

        doc.setFont('helvetica', 'bold');
        doc.text(`${inv.invoice_number} - ${inv.title}`, margin + 2, yPos);
        yPos += 5;

        doc.setFont('helvetica', 'normal');
        doc.text(`Client: ${inv.client}`, margin + 5, yPos);
        doc.text(`Date: ${inv.date}`, margin + 80, yPos);
        doc.text(`£${inv.total.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`, pageWidth - margin - 2, yPos, { align: 'right' });
        yPos += 4;

        doc.setTextColor(100, 100, 100);
        doc.text(`VAT: £${inv.tax.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`, margin + 5, yPos);
        doc.text(`Status: ${inv.status}`, margin + 80, yPos);
        doc.setTextColor(0, 0, 0);
        yPos += 7;
      });

      // Footer
      yPos += 5;
      if (yPos > 260) {
        doc.addPage();
        yPos = margin;
      }

      doc.setDrawColor(200, 200, 200);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 6;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Outstanding Invoices: £${stats.outstanding.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`, margin + 2, yPos);
      yPos += 5;
      doc.text('Next VAT Payment Due: 31 March 2025', margin + 2, yPos);
      yPos += 8;

      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.setFont('helvetica', 'italic');
      doc.text('Generated by Quotable - AI-Powered Business Management System', margin + 2, yPos);

      const fileName = `Tax_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      toast.success("Tax summary exported as PDF!");
    } catch (error) {
      console.error("PDF export error:", error);
      toast.error("Failed to export PDF. Please try again.", {
        description: error instanceof Error ? error.message : "Unknown error",
        action: {
          label: "Retry",
          onClick: () => handleDownloadReport()
        }
      });
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
              <h1 className="font-heading text-2xl">Tax & Reports</h1>
            </div>
          </header>

          <div className="p-6 space-y-6">
            {isDemo && <DemoModeNotice />}
            
            {/* Tax Summary Cards */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="shadow-smooth">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue (Paid)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-accent" />
                    <p className="text-2xl font-bold">£{stats.revenue.toLocaleString()}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-smooth">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">VAT Collected (20%)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-accent" />
                    <p className="text-2xl font-bold">£{stats.taxCollected.toLocaleString()}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-smooth">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Outstanding Invoices</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-accent" />
                    <p className="text-2xl font-bold">£{stats.outstanding.toLocaleString()}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-smooth">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Next VAT Payment</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-accent" />
                    <p className="text-2xl font-bold">Mar 31</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quarterly Tax Summary - Always show for both demo and real users */}
            <Card className="shadow-smooth">
              <CardHeader>
                <CardTitle className="font-heading">Quarterly Tax Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {(() => {
                    const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
                    const periods = ['Jan - Mar', 'Apr - Jun', 'Jul - Sep', 'Oct - Dec'];
                    const currentYear = new Date().getFullYear();
                    
                    return quarters.map((quarter, index) => {
                      const quarterStart = new Date(currentYear, index * 3, 1);
                      const quarterEnd = new Date(currentYear, (index + 1) * 3, 0);
                      
                      const quarterInvoices = invoices.filter(inv => {
                        const invDate = new Date(inv.date);
                        return invDate >= quarterStart && invDate <= quarterEnd && inv.status === 'Paid';
                      });
                      
                      const quarterRevenue = quarterInvoices.reduce((sum, inv) => sum + inv.amount, 0);
                      const quarterVAT = quarterInvoices.reduce((sum, inv) => sum + inv.tax, 0);
                      const quarterTaxable = quarterRevenue - quarterVAT;
                      
                      return (
                        <div key={quarter} className="p-4 bg-secondary/30 rounded-lg">
                          <h3 className="font-semibold mb-2">{quarter} ({periods[index]})</h3>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Revenue:</span>
                              <span className="font-medium">£{quarterRevenue.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">VAT Collected:</span>
                              <span className="font-medium">£{quarterVAT.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between pt-2 border-t border-border">
                              <span className="text-muted-foreground font-semibold">Taxable Income:</span>
                              <span className="font-semibold">£{quarterTaxable.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </CardContent>
            </Card>

            {/* Export Section */}
            <Card className="shadow-smooth">
              <CardHeader>
                <CardTitle className="font-heading">Export Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    Download comprehensive tax reports for your accounting records
                  </p>
                  <Button variant="default" onClick={handleDownloadReport}>
                    <Download className="mr-2 h-4 w-4" />
                    Download Tax Summary (PDF)
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Income Breakdown */}
            <Card className="shadow-smooth">
              <CardHeader>
                <CardTitle className="font-heading">Income Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                {invoices.length > 0 ? (
                  <div className="space-y-3">
                    {invoices.map((invoice) => (
                      <div key={invoice.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                        <div>
                          <p className="font-medium">{invoice.title}</p>
                          <p className="text-sm text-muted-foreground">{invoice.date}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">£{invoice.total.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">VAT: £{invoice.tax.toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No income data yet</p>
                )}
              </CardContent>
            </Card>
          </div>
          <Footer />
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Reports;
