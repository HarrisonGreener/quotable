import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DesignControls } from './DesignControls';
import { LivePreview } from './LivePreview';
import { TemplateList } from './TemplateList';
import { PDFTemplateConfig, DEFAULT_TEMPLATE_CONFIG } from '@/types/pdfTemplate';
import { usePdfTemplates } from '@/hooks/usePdfTemplates';
import { useBrandSettings } from '@/hooks/useBrandSettings';
import { Save, Eye, FileText, Receipt, Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export function TemplateDesigner() {
  const { templates, loading, saving, saveTemplate, deleteTemplate, duplicateTemplate, setAsDefault } = usePdfTemplates();
  const { brandSettings, loading: brandLoading } = useBrandSettings();
  
  const [currentTemplate, setCurrentTemplate] = useState<PDFTemplateConfig>({ ...DEFAULT_TEMPLATE_CONFIG });
  const [previewType, setPreviewType] = useState<'quote' | 'invoice'>('quote');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Load first template or default when templates load
  useEffect(() => {
    if (!loading && templates.length > 0) {
      const defaultTemplate = templates.find(t => t.is_default) || templates[0];
      setCurrentTemplate(defaultTemplate);
    }
  }, [loading, templates]);

  const handleConfigChange = useCallback((newConfig: PDFTemplateConfig) => {
    setCurrentTemplate(newConfig);
    setHasUnsavedChanges(true);
  }, []);

  const handleSave = async () => {
    const result = await saveTemplate(currentTemplate);
    if (result) {
      setCurrentTemplate(result);
      setHasUnsavedChanges(false);
    }
  };

  const handleSelectTemplate = (template: PDFTemplateConfig) => {
    setCurrentTemplate(template);
    setHasUnsavedChanges(false);
  };

  const handleCreateNew = () => {
    setCurrentTemplate({
      ...DEFAULT_TEMPLATE_CONFIG,
      name: 'New Template',
      is_default: templates.length === 0,
    });
    setHasUnsavedChanges(true);
  };

  const handleDuplicate = async (template: PDFTemplateConfig) => {
    const result = await duplicateTemplate(template);
    if (result) {
      setCurrentTemplate(result);
      setHasUnsavedChanges(false);
    }
  };

  const handleDelete = async (templateId: string) => {
    const success = await deleteTemplate(templateId);
    if (success) {
      if (currentTemplate.id === templateId) {
        handleCreateNew();
      }
    }
  };

  const handleSetDefault = async (templateId: string) => {
    await setAsDefault(templateId);
  };

  if (loading || brandLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Template List */}
      <TemplateList
        templates={templates}
        selectedId={currentTemplate.id}
        onSelect={handleSelectTemplate}
        onDuplicate={handleDuplicate}
        onDelete={handleDelete}
        onSetDefault={handleSetDefault}
        onCreateNew={handleCreateNew}
      />

      {/* Designer */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Controls */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Design Controls</CardTitle>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="set-default" className="text-sm">Default</Label>
                  <Switch
                    id="set-default"
                    checked={currentTemplate.is_default}
                    onCheckedChange={(checked) => handleConfigChange({ ...currentTemplate, is_default: checked })}
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <DesignControls
              config={currentTemplate}
              onChange={handleConfigChange}
              hasVatNumber={!!brandSettings?.vat_number}
            />
            
            <div className="mt-6 pt-4 border-t flex gap-3">
              <Button 
                onClick={handleSave} 
                disabled={saving || !hasUnsavedChanges}
                className="flex-1"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {currentTemplate.id ? 'Update Template' : 'Save Template'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Live Preview
              </CardTitle>
              <Tabs value={previewType} onValueChange={(v) => setPreviewType(v as any)}>
                <TabsList className="h-8">
                  <TabsTrigger value="quote" className="text-xs px-3 h-6">
                    <FileText className="w-3 h-3 mr-1" />
                    Quote
                  </TabsTrigger>
                  <TabsTrigger value="invoice" className="text-xs px-3 h-6">
                    <Receipt className="w-3 h-3 mr-1" />
                    Invoice
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <div className="w-full max-w-[280px]">
                <LivePreview
                  config={currentTemplate}
                  brandSettings={brandSettings}
                  documentType={previewType}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-4">
              This is a scaled preview. Actual PDFs will be full A4 size.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
