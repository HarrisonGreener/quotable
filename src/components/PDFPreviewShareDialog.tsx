import { useEffect, useState, useCallback } from "react";
import { Share2, Download, Mail, MessageCircle, FileText, ListTree, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { generateInvoicePDFBlob, generateQuotePDFBlob, PDFTemplate } from "@/utils/pdfTemplates";
import { BrandSettings } from "@/hooks/useBrandSettings";
import { PdfInlineViewer } from "@/components/pdf/PdfInlineViewer";
import { usePdfTemplates } from "@/hooks/usePdfTemplates";
import { PDFTemplateConfig } from "@/types/pdfTemplate";
interface QuoteDataForPDF {
  projectTitle: string;
  client: string;
  address: string;
  date: string;
  paymentType: string;
  summary?: string;
  materials: Array<{ name: string; quantity: number; unit: string; unitPrice: number; cost: number }>;
  labour: Array<{ name: string; hours?: number; rate?: number; cost: number }>;
  overheads: Array<{ name: string; cost: number }>;
  totals: {
    subtotal: number;
    vat: number;
    total: number;
  };
}

interface InvoiceDataForPDF {
  invoiceNumber: string;
  date: string;
  dueDate: string;
  client: string;
  title: string;
  summary?: string;
  amount: number;
  tax: number;
  total: number;
  status?: string;
  paymentTerms?: number;
  quoteDetails?: {
    job_description?: string;
    category?: string;
    location?: string;
  } | null;
}

interface PDFPreviewShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  blobUrl: string;
  blob: Blob;
  fileName: string;
  documentType: "Quote" | "Invoice";
  client: string;
  total: number;
  date: string;

  // Optional props for regeneration
  quoteData?: QuoteDataForPDF;
  invoiceData?: InvoiceDataForPDF;
  brandSettings?: BrandSettings | null;
  pdfTemplate?: PDFTemplate;
  includeVat?: boolean;
}

export function PDFPreviewShareDialog({
  open,
  onOpenChange,
  blobUrl: initialBlobUrl,
  blob: initialBlob,
  fileName,
  documentType,
  client,
  total,
  date,
  quoteData,
  invoiceData,
  brandSettings,
  pdfTemplate = "minimalist",
  includeVat = true,
}: PDFPreviewShareDialogProps) {
  const [condensedMaterials, setCondensedMaterials] = useState(false);
  const [condensedLabour, setCondensedLabour] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(pdfTemplate);
  const [currentBlobUrl, setCurrentBlobUrl] = useState(initialBlobUrl);
  const [currentBlob, setCurrentBlob] = useState(initialBlob);
  
  const { templates: savedTemplates, loading: templatesLoading } = usePdfTemplates();

  // Map selected template ID to actual PDFTemplate for generation
  const getTemplateForGeneration = useCallback((): { template: PDFTemplate; config?: PDFTemplateConfig } => {
    // Check if it's a built-in template
    if (['minimalist', 'modern', 'classic'].includes(selectedTemplateId)) {
      return { template: selectedTemplateId as PDFTemplate };
    }
    
    // Find saved template by ID
    const savedTemplate = savedTemplates.find(t => t.id === selectedTemplateId);
    if (savedTemplate) {
      // Map header_style to PDFTemplate
      const styleMap: Record<string, PDFTemplate> = {
        'minimal': 'minimalist',
        'banner': 'modern',
        'classic': 'classic',
        'modern': 'modern',
      };
      const template = styleMap[savedTemplate.header_style] || 'minimalist';
      return { template, config: savedTemplate };
    }
    
    return { template: 'minimalist' };
  }, [selectedTemplateId, savedTemplates]);

  // Regenerate PDF when settings change
  const regeneratePDF = useCallback(() => {
    const canRegenerateQuote = documentType === "Quote" && quoteData && brandSettings !== undefined;
    const canRegenerateInvoice = documentType === "Invoice" && invoiceData && brandSettings !== undefined;

    if (!canRegenerateQuote && !canRegenerateInvoice) return;

    try {
      const { template, config } = getTemplateForGeneration();
      
      // Use saved template's condensed settings if available, otherwise use local state
      const materialsCondensed = config?.quote_condensed_materials ?? condensedMaterials;
      const labourCondensed = config?.quote_condensed_labour ?? condensedLabour;

      let blob: Blob;

      if (canRegenerateQuote) {
        blob = generateQuotePDFBlob(
          quoteData,
          brandSettings,
          template,
          includeVat,
          { materials: materialsCondensed, labour: labourCondensed },
          config
        ).blob;
      } else {
        blob = generateInvoicePDFBlob(invoiceData, brandSettings, template, config).blob;
      }

      // Clean up old blob URL
      if (currentBlobUrl !== initialBlobUrl) {
        URL.revokeObjectURL(currentBlobUrl);
      }

      const newBlobUrl = URL.createObjectURL(blob);
      setCurrentBlobUrl(newBlobUrl);
      setCurrentBlob(blob);
    } catch (error) {
      console.error("PDF generation error:", error);
      // Keep the existing blob if regeneration fails
      toast.error("Failed to update preview. Using previous version.");
    }
  }, [
    documentType,
    quoteData,
    invoiceData,
    brandSettings,
    getTemplateForGeneration,
    includeVat,
    condensedMaterials,
    condensedLabour,
    currentBlobUrl,
    initialBlobUrl,
  ]);

  // Reset to initial values when dialog opens
  useEffect(() => {
    if (open) {
      setCondensedMaterials(false);
      setCondensedLabour(false);
      // Set to default saved template if available, otherwise fall back to pdfTemplate prop
      const defaultTemplate = savedTemplates.find(t => t.is_default);
      setSelectedTemplateId(defaultTemplate?.id || pdfTemplate);
      setCurrentBlobUrl(initialBlobUrl);
      setCurrentBlob(initialBlob);
    }
  }, [open, initialBlobUrl, initialBlob, pdfTemplate, savedTemplates]);

  // Regenerate when options change (quote condensed toggles / template selection)
  useEffect(() => {
    if (!open) return;

    if (documentType === "Quote" && quoteData) {
      regeneratePDF();
    }

    if (documentType === "Invoice" && invoiceData) {
      regeneratePDF();
    }
  }, [open, condensedMaterials, condensedLabour, selectedTemplateId]);
  
  // Clean up blob URL when dialog closes
  useEffect(() => {
    return () => {
      if (currentBlobUrl && currentBlobUrl !== initialBlobUrl) {
        URL.revokeObjectURL(currentBlobUrl);
      }
    };
  }, [currentBlobUrl, initialBlobUrl]);

  const handleShare = async () => {
    // Create a proper File object from the blob
    const file = new File([currentBlob], fileName, { 
      type: 'application/pdf',
      lastModified: Date.now()
    });

    // Try native Web Share API (works on mobile with file attachments)
    if (navigator.share) {
      try {
        // Check if we can share files
        const canShareFiles = navigator.canShare && navigator.canShare({ files: [file] });
        
        if (canShareFiles) {
          // Share with file attachment (works for WhatsApp, Messages, Email, etc.)
          await navigator.share({
            files: [file],
            title: `${documentType} for ${client}`,
            text: `${documentType} for ${client} - £${total.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`
          });
        } else {
          // Fallback: share without file (text only)
          await navigator.share({
            title: `${documentType} for ${client}`,
            text: `${documentType} for ${client}\nDate: ${date}\nTotal: £${total.toLocaleString('en-GB', { minimumFractionDigits: 2 })}\n\nNote: PDF attachment cannot be shared via this method. Please use the Download button and attach manually.`,
          });
        }
        toast.success("Shared successfully!");
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error("Share failed:", error);
          toast.error("Failed to share");
        }
      }
    } else {
      // Desktop fallback: download the file
      toast.info("Download the PDF and attach it manually when sharing");
      handleDownload();
    }
  };

  const handleWhatsApp = async () => {
    // On mobile, try native share first (this can attach the PDF to WhatsApp)
    const file = new File([currentBlob], fileName, { 
      type: 'application/pdf',
      lastModified: Date.now()
    });

    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: `${documentType} for ${client}`,
          text: `${documentType} for ${client} - £${total.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`
        });
        toast.success("Opening share options...");
        return;
      } catch (error) {
        if ((error as Error).name === 'AbortError') {
          return; // User cancelled
        }
        // Fall through to text-only WhatsApp
      }
    }
    
    // Fallback: text-only WhatsApp (no file attachment - WhatsApp URL scheme limitation)
    const message = encodeURIComponent(`${documentType} for ${client}\nDate: ${date}\nTotal: £${total.toLocaleString('en-GB', { minimumFractionDigits: 2 })}\n\nNote: Please download the PDF separately to view the full document.`);
    window.open(`https://wa.me/?text=${message}`, '_blank');
    toast.info("Note: PDF must be downloaded separately and attached manually in WhatsApp");
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(`${documentType} for ${client} - £${total.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`);
    const body = encodeURIComponent(`Please find attached ${documentType.toLowerCase()} dated ${date} for ${client}.\n\nTotal: £${total.toLocaleString('en-GB', { minimumFractionDigits: 2 })}\n\nThank you for your business.`);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = currentBlobUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("PDF downloaded!");
  };

  const canToggleCondensed = documentType === "Quote" && quoteData !== undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] p-0 gap-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <DialogTitle className="text-xl font-heading">
                {documentType} for {client}
              </DialogTitle>
              <p className="text-sm text-muted-foreground">
                £{total.toLocaleString("en-GB", { minimumFractionDigits: 2 })} · {date}
              </p>
            </div>
          </div>

          {/* Template Selection */}
          <div className="pt-4 mt-2 border-t flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Template</Label>
              <p className="text-xs text-muted-foreground">
                {savedTemplates.length > 0 ? "Choose from your saved templates" : "Choose a style for this PDF"}
              </p>
            </div>
            <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId} disabled={templatesLoading}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select template" />
              </SelectTrigger>
              <SelectContent>
                {/* Saved templates first */}
                {savedTemplates.length > 0 && (
                  <>
                    {savedTemplates.map((t) => (
                      <SelectItem key={t.id} value={t.id!}>
                        {t.name} {t.is_default && "(Default)"}
                      </SelectItem>
                    ))}
                    <div className="my-1 border-t" />
                  </>
                )}
                {/* Built-in templates as fallback */}
                <SelectItem value="minimalist">Minimalist (Built-in)</SelectItem>
                <SelectItem value="modern">Modern (Built-in)</SelectItem>
                <SelectItem value="classic">Classic (Built-in)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Condensed Mode Toggles - Only for Quotes */}
          {canToggleCondensed && (
            <div className="pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div className="space-y-0.5">
                    <Label htmlFor="condensed-materials" className="text-sm font-medium cursor-pointer">
                      Condense Materials
                    </Label>
                    <p className="text-xs text-muted-foreground">Hide unit prices & quantities</p>
                  </div>
                </div>
                <Switch id="condensed-materials" checked={condensedMaterials} onCheckedChange={setCondensedMaterials} />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ListTree className="h-4 w-4 text-muted-foreground" />
                  <div className="space-y-0.5">
                    <Label htmlFor="condensed-labour" className="text-sm font-medium cursor-pointer">
                      Condense Labour
                    </Label>
                    <p className="text-xs text-muted-foreground">Hide hours & rates</p>
                  </div>
                </div>
                <Switch id="condensed-labour" checked={condensedLabour} onCheckedChange={setCondensedLabour} />
              </div>
            </div>
          )}
        </DialogHeader>

        {/* PDF Preview */}
        <div className="flex-1 overflow-hidden p-6 bg-muted/30">
          <div className="h-full w-full bg-background rounded-lg shadow-sm overflow-hidden">
            <PdfInlineViewer blob={currentBlob} key={currentBlobUrl} />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 pt-4 border-t space-y-3">
          <div className="flex gap-2">
            <Button 
              onClick={handleShare} 
              className="flex-1"
              size="lg"
            >
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
            <Button 
              onClick={handleDownload} 
              variant="outline"
              className="flex-1"
              size="lg"
            >
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </div>
          
          <div className="text-center text-sm text-muted-foreground">
            Or share via (on mobile, PDF will attach automatically)
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            <Button 
              onClick={handleEmail} 
              variant="secondary"
              size="sm"
            >
              <Mail className="mr-2 h-4 w-4" />
              Email
            </Button>
            <Button 
              onClick={handleWhatsApp} 
              variant="secondary"
              size="sm"
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              WhatsApp
            </Button>
            <Button 
              onClick={() => window.open(currentBlobUrl, '_blank')} 
              variant="secondary"
              size="sm"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              New Tab
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}