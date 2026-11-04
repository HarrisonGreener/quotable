-- Create pdf_templates table for custom document styling
CREATE TABLE public.pdf_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL DEFAULT 'My Template',
  is_default BOOLEAN NOT NULL DEFAULT false,
  
  -- Base styling (shared between quotes & invoices)
  logo_position TEXT NOT NULL DEFAULT 'right',
  logo_size TEXT NOT NULL DEFAULT 'medium',
  primary_colour TEXT NOT NULL DEFAULT '#1E3A5F',
  secondary_colour TEXT NOT NULL DEFAULT '#6B7280',
  font_family TEXT NOT NULL DEFAULT 'helvetica',
  header_style TEXT NOT NULL DEFAULT 'minimal',
  show_company_details BOOLEAN NOT NULL DEFAULT true,
  show_vat_number BOOLEAN NOT NULL DEFAULT true,
  show_website BOOLEAN NOT NULL DEFAULT false,
  
  -- Table column visibility
  table_show_quantities BOOLEAN NOT NULL DEFAULT true,
  table_show_unit_prices BOOLEAN NOT NULL DEFAULT true,
  table_show_line_totals BOOLEAN NOT NULL DEFAULT true,
  
  -- Quote-specific options
  quote_show_scope BOOLEAN NOT NULL DEFAULT true,
  quote_show_expiry BOOLEAN NOT NULL DEFAULT true,
  quote_show_materials BOOLEAN NOT NULL DEFAULT true,
  quote_show_labour BOOLEAN NOT NULL DEFAULT true,
  quote_show_overheads BOOLEAN NOT NULL DEFAULT true,
  quote_show_summary BOOLEAN NOT NULL DEFAULT true,
  quote_condensed_materials BOOLEAN NOT NULL DEFAULT false,
  quote_condensed_labour BOOLEAN NOT NULL DEFAULT false,
  
  -- Invoice-specific options
  invoice_show_job_details BOOLEAN NOT NULL DEFAULT true,
  invoice_show_vat_breakdown BOOLEAN NOT NULL DEFAULT true,
  invoice_show_payment_terms BOOLEAN NOT NULL DEFAULT true,
  invoice_show_bank_details BOOLEAN NOT NULL DEFAULT true,
  invoice_show_due_date_prominent BOOLEAN NOT NULL DEFAULT true,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pdf_templates ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own templates"
  ON public.pdf_templates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own templates"
  ON public.pdf_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates"
  ON public.pdf_templates FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates"
  ON public.pdf_templates FOR DELETE
  USING (auth.uid() = user_id);

-- Ensure only one default template per user
CREATE UNIQUE INDEX idx_pdf_templates_single_default
  ON public.pdf_templates(user_id) WHERE is_default = true;

-- Add trigger for updated_at
CREATE TRIGGER update_pdf_templates_updated_at
  BEFORE UPDATE ON public.pdf_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add default_pdf_template_id to app_settings
ALTER TABLE public.app_settings 
  ADD COLUMN default_pdf_template_id UUID REFERENCES public.pdf_templates(id) ON DELETE SET NULL;