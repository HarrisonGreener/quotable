import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PDFTemplateConfig, DEFAULT_TEMPLATE_CONFIG } from '@/types/pdfTemplate';
import { toast } from 'sonner';

export const usePdfTemplates = () => {
  const [templates, setTemplates] = useState<PDFTemplateConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadTemplates = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('pdf_templates')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        setTemplates(data as unknown as PDFTemplateConfig[]);
      } else {
        // No templates exist, we'll create a default one when user saves
        setTemplates([]);
      }
    } catch (error) {
      console.error('Error loading PDF templates:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const getDefaultTemplate = useCallback((): PDFTemplateConfig => {
    const defaultTemplate = templates.find(t => t.is_default);
    return defaultTemplate || { ...DEFAULT_TEMPLATE_CONFIG };
  }, [templates]);

  const saveTemplate = async (template: PDFTemplateConfig): Promise<PDFTemplateConfig | null> => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please log in to save templates');
        return null;
      }

      // If setting as default, first unset any existing default
      if (template.is_default) {
        await supabase
          .from('pdf_templates')
          .update({ is_default: false })
          .eq('user_id', user.id)
          .eq('is_default', true);
      }

      const templateData = {
        user_id: user.id,
        name: template.name,
        is_default: template.is_default,
        logo_position: template.logo_position,
        logo_size: template.logo_size,
        primary_colour: template.primary_colour,
        secondary_colour: template.secondary_colour,
        font_family: template.font_family,
        header_style: template.header_style,
        show_company_details: template.show_company_details,
        show_vat_number: template.show_vat_number,
        show_website: template.show_website,
        table_show_quantities: template.table_show_quantities,
        table_show_unit_prices: template.table_show_unit_prices,
        table_show_line_totals: template.table_show_line_totals,
        quote_show_scope: template.quote_show_scope,
        quote_show_expiry: template.quote_show_expiry,
        quote_show_materials: template.quote_show_materials,
        quote_show_labour: template.quote_show_labour,
        quote_show_overheads: template.quote_show_overheads,
        quote_show_summary: template.quote_show_summary,
        quote_condensed_materials: template.quote_condensed_materials,
        quote_condensed_labour: template.quote_condensed_labour,
        invoice_show_job_details: template.invoice_show_job_details,
        invoice_show_vat_breakdown: template.invoice_show_vat_breakdown,
        invoice_show_payment_terms: template.invoice_show_payment_terms,
        invoice_show_bank_details: template.invoice_show_bank_details,
        invoice_show_due_date_prominent: template.invoice_show_due_date_prominent,
      };

      if (template.id) {
        // Update existing template
        const { data, error } = await supabase
          .from('pdf_templates')
          .update(templateData)
          .eq('id', template.id)
          .select()
          .single();

        if (error) throw error;
        
        await loadTemplates();
        toast.success('Template updated successfully');
        return data as unknown as PDFTemplateConfig;
      } else {
        // Create new template
        const { data, error } = await supabase
          .from('pdf_templates')
          .insert(templateData)
          .select()
          .single();

        if (error) throw error;
        
        await loadTemplates();
        toast.success('Template created successfully');
        return data as unknown as PDFTemplateConfig;
      }
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Failed to save template');
      return null;
    } finally {
      setSaving(false);
    }
  };

  const deleteTemplate = async (templateId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('pdf_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;

      await loadTemplates();
      toast.success('Template deleted');
      return true;
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
      return false;
    }
  };

  const duplicateTemplate = async (template: PDFTemplateConfig): Promise<PDFTemplateConfig | null> => {
    const newTemplate: PDFTemplateConfig = {
      ...template,
      id: undefined,
      name: `${template.name} (Copy)`,
      is_default: false,
    };
    return saveTemplate(newTemplate);
  };

  const setAsDefault = async (templateId: string): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      // Unset current default
      await supabase
        .from('pdf_templates')
        .update({ is_default: false })
        .eq('user_id', user.id)
        .eq('is_default', true);

      // Set new default
      const { error } = await supabase
        .from('pdf_templates')
        .update({ is_default: true })
        .eq('id', templateId);

      if (error) throw error;

      await loadTemplates();
      toast.success('Default template updated');
      return true;
    } catch (error) {
      console.error('Error setting default template:', error);
      toast.error('Failed to set default template');
      return false;
    }
  };

  return {
    templates,
    loading,
    saving,
    getDefaultTemplate,
    saveTemplate,
    deleteTemplate,
    duplicateTemplate,
    setAsDefault,
    refetch: loadTemplates,
  };
};
