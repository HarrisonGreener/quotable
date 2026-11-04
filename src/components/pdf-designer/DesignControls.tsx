import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PDFTemplateConfig, PRESET_TEMPLATES, isValidHexColor } from '@/types/pdfTemplate';
import { Palette, Type, Layout, Eye, Table, FileText, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DesignControlsProps {
  config: PDFTemplateConfig;
  onChange: (config: PDFTemplateConfig) => void;
  hasVatNumber: boolean;
}

export function DesignControls({ config, onChange, hasVatNumber }: DesignControlsProps) {
  const updateConfig = (updates: Partial<PDFTemplateConfig>) => {
    onChange({ ...config, ...updates });
  };

  const applyPreset = (preset: Partial<PDFTemplateConfig>) => {
    onChange({ ...config, ...preset });
  };

  return (
    <div className="space-y-6">
      {/* Template Name */}
      <div className="space-y-2">
        <Label htmlFor="template-name">Template Name</Label>
        <Input
          id="template-name"
          value={config.name}
          onChange={(e) => updateConfig({ name: e.target.value })}
          placeholder="My Template"
        />
      </div>

      {/* Quick Presets */}
      <div className="space-y-2">
        <Label>Quick Presets</Label>
        <div className="flex flex-wrap gap-2">
          {PRESET_TEMPLATES.map((preset, i) => (
            <Button
              key={i}
              variant="outline"
              size="sm"
              onClick={() => applyPreset(preset)}
              className="text-xs"
            >
              <div 
                className="w-3 h-3 rounded-full mr-1.5" 
                style={{ backgroundColor: preset.primary_colour }}
              />
              {preset.name}
            </Button>
          ))}
        </div>
      </div>

      <Tabs defaultValue="branding" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="branding" className="text-xs">
            <Palette className="w-3 h-3 mr-1" />
            Style
          </TabsTrigger>
          <TabsTrigger value="layout" className="text-xs">
            <Layout className="w-3 h-3 mr-1" />
            Layout
          </TabsTrigger>
          <TabsTrigger value="quote" className="text-xs">
            <FileText className="w-3 h-3 mr-1" />
            Quote
          </TabsTrigger>
          <TabsTrigger value="invoice" className="text-xs">
            <Receipt className="w-3 h-3 mr-1" />
            Invoice
          </TabsTrigger>
        </TabsList>

        {/* Branding Tab */}
        <TabsContent value="branding" className="space-y-4 mt-4">
          {/* Colours */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="primary-colour">Primary Colour</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={config.primary_colour}
                  onChange={(e) => updateConfig({ primary_colour: e.target.value })}
                  className="w-12 h-10 p-1 cursor-pointer"
                />
                <Input
                  id="primary-colour"
                  value={config.primary_colour}
                  onChange={(e) => {
                    if (isValidHexColor(e.target.value) || e.target.value.length < 7) {
                      updateConfig({ primary_colour: e.target.value });
                    }
                  }}
                  placeholder="#1E3A5F"
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="secondary-colour">Secondary Colour</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={config.secondary_colour}
                  onChange={(e) => updateConfig({ secondary_colour: e.target.value })}
                  className="w-12 h-10 p-1 cursor-pointer"
                />
                <Input
                  id="secondary-colour"
                  value={config.secondary_colour}
                  onChange={(e) => {
                    if (isValidHexColor(e.target.value) || e.target.value.length < 7) {
                      updateConfig({ secondary_colour: e.target.value });
                    }
                  }}
                  placeholder="#6B7280"
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          {/* Font */}
          <div className="space-y-2">
            <Label>Font Family</Label>
            <Select 
              value={config.font_family} 
              onValueChange={(v) => updateConfig({ font_family: v as any })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {/* Sans-Serif Fonts */}
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Sans-Serif</div>
                <SelectItem value="helvetica">Helvetica</SelectItem>
                <SelectItem value="arial">Arial</SelectItem>
                <SelectItem value="verdana">Verdana</SelectItem>
                <SelectItem value="tahoma">Tahoma</SelectItem>
                <SelectItem value="trebuchet">Trebuchet MS</SelectItem>
                <SelectItem value="lucida-sans">Lucida Sans</SelectItem>
                <SelectItem value="calibri">Calibri</SelectItem>
                <SelectItem value="segoe">Segoe UI</SelectItem>
                <SelectItem value="open-sans">Open Sans</SelectItem>
                <SelectItem value="roboto">Roboto</SelectItem>
                <SelectItem value="lato">Lato</SelectItem>
                <SelectItem value="montserrat">Montserrat</SelectItem>
                <SelectItem value="raleway">Raleway</SelectItem>
                <SelectItem value="poppins">Poppins</SelectItem>
                <SelectItem value="nunito">Nunito</SelectItem>
                <SelectItem value="source-sans">Source Sans Pro</SelectItem>
                
                {/* Serif Fonts */}
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground mt-2">Serif</div>
                <SelectItem value="times">Times New Roman</SelectItem>
                <SelectItem value="georgia">Georgia</SelectItem>
                <SelectItem value="palatino">Palatino</SelectItem>
                <SelectItem value="book-antiqua">Book Antiqua</SelectItem>
                <SelectItem value="cambria">Cambria</SelectItem>
                <SelectItem value="garamond">Garamond</SelectItem>
                <SelectItem value="didot">Didot</SelectItem>
                <SelectItem value="bodoni">Bodoni</SelectItem>
                <SelectItem value="baskerville">Baskerville</SelectItem>
                <SelectItem value="libre-baskerville">Libre Baskerville</SelectItem>
                <SelectItem value="playfair">Playfair Display</SelectItem>
                <SelectItem value="merriweather">Merriweather</SelectItem>
                <SelectItem value="crimson">Crimson Text</SelectItem>
                <SelectItem value="lora">Lora</SelectItem>
                
                {/* Monospace Fonts */}
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground mt-2">Monospace</div>
                <SelectItem value="courier">Courier New</SelectItem>
                <SelectItem value="consolas">Consolas</SelectItem>
                <SelectItem value="monaco">Monaco</SelectItem>
                <SelectItem value="source-code">Source Code Pro</SelectItem>
                <SelectItem value="fira-code">Fira Code</SelectItem>
                <SelectItem value="jetbrains-mono">JetBrains Mono</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Header Style */}
          <div className="space-y-2">
            <Label>Header Style</Label>
            <Select 
              value={config.header_style} 
              onValueChange={(v) => updateConfig({ header_style: v as any })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="minimal">Minimal — Clean thin line</SelectItem>
                <SelectItem value="banner">Banner — Full-width colour bar</SelectItem>
                <SelectItem value="classic">Classic — Bold underline</SelectItem>
                <SelectItem value="modern">Modern — Sleek colour block</SelectItem>
                <SelectItem value="elegant">Elegant — Double thin lines</SelectItem>
                <SelectItem value="bold">Bold — Strong uppercase</SelectItem>
                <SelectItem value="split">Split — Accent bar left</SelectItem>
                <SelectItem value="boxed">Boxed — Bordered frame</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </TabsContent>

        {/* Layout Tab */}
        <TabsContent value="layout" className="space-y-4 mt-4">
          {/* Logo */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Logo Position</Label>
              <Select 
                value={config.logo_position} 
                onValueChange={(v) => updateConfig({ logo_position: v as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Logo Size</Label>
              <Select 
                value={config.logo_size} 
                onValueChange={(v) => updateConfig({ logo_size: v as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Visibility Options */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Show/Hide Sections</Label>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Company Details</span>
                <Switch
                  checked={config.show_company_details}
                  onCheckedChange={(v) => updateConfig({ show_company_details: v })}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">VAT Number</span>
                <Switch
                  checked={config.show_vat_number}
                  onCheckedChange={(v) => updateConfig({ show_vat_number: v })}
                  disabled={!hasVatNumber}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Website</span>
                <Switch
                  checked={config.show_website}
                  onCheckedChange={(v) => updateConfig({ show_website: v })}
                />
              </div>
            </div>
          </div>

          {/* Table Columns */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Table Columns</Label>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Show Quantities</span>
                <Switch
                  checked={config.table_show_quantities}
                  onCheckedChange={(v) => updateConfig({ table_show_quantities: v })}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Show Unit Prices</span>
                <Switch
                  checked={config.table_show_unit_prices}
                  onCheckedChange={(v) => updateConfig({ table_show_unit_prices: v })}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Show Line Totals</span>
                <Switch
                  checked={config.table_show_line_totals}
                  onCheckedChange={(v) => updateConfig({ table_show_line_totals: v })}
                />
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Quote Options Tab */}
        <TabsContent value="quote" className="space-y-4 mt-4">
          <p className="text-sm text-muted-foreground mb-4">
            Configure which sections appear on quote PDFs.
          </p>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Show Summary</span>
              <Switch
                checked={config.quote_show_summary}
                onCheckedChange={(v) => updateConfig({ quote_show_summary: v })}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Show Expiry Notice</span>
              <Switch
                checked={config.quote_show_expiry}
                onCheckedChange={(v) => updateConfig({ quote_show_expiry: v })}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Show Materials</span>
              <Switch
                checked={config.quote_show_materials}
                onCheckedChange={(v) => updateConfig({ quote_show_materials: v })}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Show Labour</span>
              <Switch
                checked={config.quote_show_labour}
                onCheckedChange={(v) => updateConfig({ quote_show_labour: v })}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Show Overheads</span>
              <Switch
                checked={config.quote_show_overheads}
                onCheckedChange={(v) => updateConfig({ quote_show_overheads: v })}
              />
            </div>
          </div>
          
          <div className="pt-4 border-t">
            <Label className="text-sm font-medium">Condensed View</Label>
            <p className="text-xs text-muted-foreground mb-3">
              Show only totals instead of itemized lists.
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Condense Materials</span>
                <Switch
                  checked={config.quote_condensed_materials}
                  onCheckedChange={(v) => updateConfig({ quote_condensed_materials: v })}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Condense Labour</span>
                <Switch
                  checked={config.quote_condensed_labour}
                  onCheckedChange={(v) => updateConfig({ quote_condensed_labour: v })}
                />
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Invoice Options Tab */}
        <TabsContent value="invoice" className="space-y-4 mt-4">
          <p className="text-sm text-muted-foreground mb-4">
            Configure which sections appear on invoice PDFs.
          </p>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Show Job Details</span>
              <Switch
                checked={config.invoice_show_job_details}
                onCheckedChange={(v) => updateConfig({ invoice_show_job_details: v })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm">Show VAT Breakdown</span>
                {hasVatNumber && (
                  <p className="text-xs text-amber-600">Required for VAT-registered businesses</p>
                )}
              </div>
              <Switch
                checked={config.invoice_show_vat_breakdown}
                onCheckedChange={(v) => updateConfig({ invoice_show_vat_breakdown: v })}
                disabled={hasVatNumber} // Can't hide if VAT registered
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Show Payment Terms</span>
              <Switch
                checked={config.invoice_show_payment_terms}
                onCheckedChange={(v) => updateConfig({ invoice_show_payment_terms: v })}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Show Bank Details</span>
              <Switch
                checked={config.invoice_show_bank_details}
                onCheckedChange={(v) => updateConfig({ invoice_show_bank_details: v })}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Emphasise Due Date</span>
              <Switch
                checked={config.invoice_show_due_date_prominent}
                onCheckedChange={(v) => updateConfig({ invoice_show_due_date_prominent: v })}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
