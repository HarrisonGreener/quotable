import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Eye } from "lucide-react";
import { BrandSettings } from "@/hooks/useBrandSettings";
import { PDFTemplate } from "@/utils/pdfTemplates";

interface PDFTemplatePreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brandSettings: BrandSettings | null;
  currentTemplate: PDFTemplate;
  onSelectTemplate: (template: PDFTemplate) => void;
}

export const PDFTemplatePreview = ({
  open,
  onOpenChange,
  brandSettings,
  currentTemplate,
  onSelectTemplate,
}: PDFTemplatePreviewProps) => {
  const [activeTab, setActiveTab] = useState<PDFTemplate>(currentTemplate);

  const templates: Array<{ value: PDFTemplate; label: string; description: string; features: string[] }> = [
    {
      value: "minimalist",
      label: "Clean Minimalist",
      description: "Simple, spacious layout with subtle design elements",
      features: [
        "Thin, elegant borders",
        "Large, clear headlines",
        "Plenty of white space",
        "Soft gray accents",
        "Professional simplicity"
      ]
    },
    {
      value: "modern",
      label: "Modern Professional",
      description: "Bold, contemporary design with strong visual hierarchy",
      features: [
        "Strong blue header banner",
        "Two-column layout",
        "Vibrant accent colors",
        "Clear section separation",
        "Corporate aesthetic"
      ]
    },
    {
      value: "classic",
      label: "Tradesperson Classic",
      description: "Traditional, easy-to-read format perfect for trades",
      features: [
        "Blocky, structured layout",
        "Bold, prominent totals",
        "Thick borders and dividers",
        "High readability",
        "Timeless design"
      ]
    }
  ];

  const handleSelect = (template: PDFTemplate) => {
    onSelectTemplate(template);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden flex flex-col p-6">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            PDF Template Preview
          </DialogTitle>
          <DialogDescription>
            Preview how your quotes and invoices will look with each template style
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as PDFTemplate)} className="w-full flex-1 flex flex-col overflow-hidden mt-4">
          <TabsList className="grid w-full grid-cols-3 shrink-0 mb-4">
            <TabsTrigger value="minimalist">Minimalist</TabsTrigger>
            <TabsTrigger value="modern">Modern</TabsTrigger>
            <TabsTrigger value="classic">Classic</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto pr-2">
            {templates.map((template) => (
              <TabsContent key={template.value} value={template.value} className="m-0 h-full">
                <div className="grid lg:grid-cols-[320px_1fr] gap-6 h-full">
                  {/* Left sidebar with info */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold">{template.label}</h3>
                      {currentTemplate === template.value && (
                        <Badge variant="default">Current</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{template.description}</p>
                    
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Key Features:</p>
                      <ul className="text-sm text-muted-foreground space-y-1.5">
                        {template.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-primary mt-1">•</span>
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <Button
                      onClick={() => handleSelect(template.value)}
                      variant={currentTemplate === template.value ? "outline" : "default"}
                      className="w-full"
                    >
                      {currentTemplate === template.value ? "Current Template" : "Select Template"}
                    </Button>
                  </div>

                  {/* Right side with preview */}
                  <div className="flex flex-col min-h-0">
                    <Card className="p-6 bg-muted/30 flex-1 overflow-y-auto">
                      <div className="space-y-6">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <FileText className="h-4 w-4" />
                          <span>Preview representation of {template.label}</span>
                        </div>

                        {/* Header Preview */}
                        {template.value === "minimalist" && (
                          <div className="bg-background border border-border/50 rounded p-6 space-y-4">
                            <div className="flex items-start justify-between gap-4 pb-3">
                              <div className="flex-1">
                                <p className="text-lg font-bold mb-2">{brandSettings?.company_name || "Your Company"}</p>
                                <p className="text-sm text-muted-foreground">{brandSettings?.email || "email@company.com"}</p>
                                <p className="text-sm text-muted-foreground">{brandSettings?.phone || "+44 1234 567890"}</p>
                                <p className="text-sm text-muted-foreground mt-1">{brandSettings?.address || "123 Business St, City"}</p>
                              </div>
                              {brandSettings?.logo_url ? (
                                <img src={brandSettings.logo_url} alt="Logo" className="w-20 h-16 object-contain" />
                              ) : (
                                <div className="w-20 h-16 bg-muted rounded border border-border/50 flex items-center justify-center text-sm text-muted-foreground">
                                  Logo
                                </div>
                              )}
                            </div>
                            <h2 className="text-4xl font-bold pt-2">QUOTATION</h2>
                            <div className="border-t border-border/30 pt-3"></div>
                            <div className="space-y-3 text-sm">
                              <p className="text-muted-foreground">Clean, spacious layout with minimal styling</p>
                              <div className="grid grid-cols-2 gap-3 text-sm bg-muted/50 p-4 rounded">
                                <div><span className="font-medium">Client:</span> Sample Client</div>
                                <div><span className="font-medium">Date:</span> {new Date().toLocaleDateString()}</div>
                              </div>
                            </div>
                            <div className="space-y-3 pt-3">
                              <h3 className="font-semibold text-base">Sample Items</h3>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between py-2 border-b border-border/30">
                                  <span>Labour (8 hours)</span>
                                  <span className="font-medium">£400.00</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-border/30">
                                  <span>Materials</span>
                                  <span className="font-medium">£250.00</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-border/30">
                                  <span>Equipment Hire</span>
                                  <span className="font-medium">£150.00</span>
                                </div>
                              </div>
                              <div className="flex justify-between pt-3 text-lg font-bold border-t-2 border-border">
                                <span>Total</span>
                                <span>£800.00</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {template.value === "modern" && (
                          <div className="bg-background border border-border rounded overflow-hidden">
                            <div className="p-6 space-y-4">
                              <div className="flex items-start justify-between gap-4 pb-3">
                                <div className="flex-1">
                                  <p className="text-lg font-bold text-primary mb-2">{brandSettings?.company_name || "Your Company"}</p>
                                  <p className="text-sm text-muted-foreground">{brandSettings?.email || "email@company.com"}</p>
                                  <p className="text-sm text-muted-foreground">{brandSettings?.phone || "+44 1234 567890"}</p>
                                  <p className="text-sm text-muted-foreground mt-1">{brandSettings?.address || "123 Business St, City"}</p>
                                </div>
                                {brandSettings?.logo_url ? (
                                  <img src={brandSettings.logo_url} alt="Logo" className="w-20 h-16 object-contain" />
                                ) : (
                                  <div className="w-20 h-16 bg-muted rounded border border-border/50 flex items-center justify-center text-sm text-muted-foreground">
                                    Logo
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="bg-primary text-primary-foreground px-6 py-4">
                              <p className="text-2xl font-bold">QUOTATION</p>
                            </div>
                            <div className="p-6 space-y-4">
                              <p className="text-sm text-muted-foreground">Strong visual hierarchy with bold colors</p>
                              <div className="grid grid-cols-2 gap-3 text-sm bg-primary/5 p-4 rounded">
                                <div><span className="font-medium">Client:</span> Sample Client</div>
                                <div><span className="font-medium">Date:</span> {new Date().toLocaleDateString()}</div>
                              </div>
                              <div className="space-y-3 pt-3">
                                <h3 className="font-semibold text-base text-primary">Sample Items</h3>
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between py-2 border-b border-border">
                                    <span>Labour (8 hours)</span>
                                    <span className="font-medium">£400.00</span>
                                  </div>
                                  <div className="flex justify-between py-2 border-b border-border">
                                    <span>Materials</span>
                                    <span className="font-medium">£250.00</span>
                                  </div>
                                  <div className="flex justify-between py-2 border-b border-border">
                                    <span>Equipment Hire</span>
                                    <span className="font-medium">£150.00</span>
                                  </div>
                                </div>
                                <div className="flex justify-between pt-3 text-lg font-bold bg-primary/10 p-3 rounded">
                                  <span>Total</span>
                                  <span>£800.00</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {template.value === "classic" && (
                          <div className="bg-background border-2 border-border rounded">
                            <div className="border-b-2 border-border p-6 space-y-3">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <p className="text-lg font-bold mb-2">{brandSettings?.company_name || "Your Company"}</p>
                                  <p className="text-sm text-muted-foreground">{brandSettings?.email || "email@company.com"}</p>
                                  <p className="text-sm text-muted-foreground">{brandSettings?.phone || "+44 1234 567890"}</p>
                                  <p className="text-sm text-muted-foreground mt-1">{brandSettings?.address || "123 Business St, City"}</p>
                                </div>
                                {brandSettings?.logo_url ? (
                                  <img src={brandSettings.logo_url} alt="Logo" className="w-20 h-16 object-contain" />
                                ) : (
                                  <div className="w-20 h-16 bg-muted rounded border-2 border-border flex items-center justify-center text-sm text-muted-foreground">
                                    Logo
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="bg-foreground text-background px-6 py-4">
                              <p className="text-2xl font-bold">QUOTATION</p>
                            </div>
                            <div className="p-6 space-y-4">
                              <p className="text-sm text-muted-foreground">Traditional format with bold, clear structure</p>
                              <div className="border-2 border-border p-4 rounded space-y-2 text-sm">
                                <div className="grid grid-cols-2 gap-3">
                                  <div><span className="font-bold">Client:</span> Sample Client</div>
                                  <div><span className="font-bold">Date:</span> {new Date().toLocaleDateString()}</div>
                                </div>
                              </div>
                              <div className="space-y-3 pt-3">
                                <h3 className="font-bold text-base">Sample Items</h3>
                                <div className="border-2 border-border rounded overflow-hidden">
                                  <div className="flex justify-between py-3 px-4 border-b-2 border-border bg-muted/30">
                                    <span className="font-bold">Labour (8 hours)</span>
                                    <span className="font-bold">£400.00</span>
                                  </div>
                                  <div className="flex justify-between py-3 px-4 border-b-2 border-border">
                                    <span className="font-bold">Materials</span>
                                    <span className="font-bold">£250.00</span>
                                  </div>
                                  <div className="flex justify-between py-3 px-4">
                                    <span className="font-bold">Equipment Hire</span>
                                    <span className="font-bold">£150.00</span>
                                  </div>
                                </div>
                                <div className="flex justify-between p-4 text-xl font-bold bg-foreground text-background rounded">
                                  <span>TOTAL</span>
                                  <span>£800.00</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>
                  </div>
                </div>
              </TabsContent>
            ))}
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
