// PDF Template configuration types

export interface PDFTemplateConfig {
  id?: string;
  user_id?: string;
  name: string;
  is_default: boolean;
  
  // Base styling (shared between quotes & invoices)
  logo_position: 'left' | 'right' | 'center';
  logo_size: 'small' | 'medium' | 'large';
  primary_colour: string;
  secondary_colour: string;
  font_family: 
    | 'helvetica' | 'arial' | 'verdana' | 'tahoma' | 'trebuchet' | 'lucida-sans' | 'calibri' | 'segoe' | 'open-sans' | 'roboto' | 'lato' | 'montserrat' | 'raleway' | 'poppins' | 'nunito' | 'source-sans'
    | 'times' | 'georgia' | 'palatino' | 'book-antiqua' | 'cambria' | 'garamond' | 'didot' | 'bodoni' | 'baskerville' | 'libre-baskerville' | 'playfair' | 'merriweather' | 'crimson' | 'lora'
    | 'courier' | 'consolas' | 'monaco' | 'source-code' | 'fira-code' | 'jetbrains-mono';
  header_style: 'minimal' | 'banner' | 'classic' | 'modern' | 'elegant' | 'bold' | 'split' | 'boxed';
  show_company_details: boolean;
  show_vat_number: boolean;
  show_website: boolean;
  
  // Table column visibility
  table_show_quantities: boolean;
  table_show_unit_prices: boolean;
  table_show_line_totals: boolean;
  
  // Quote-specific options
  quote_show_scope: boolean;
  quote_show_expiry: boolean;
  quote_show_materials: boolean;
  quote_show_labour: boolean;
  quote_show_overheads: boolean;
  quote_show_summary: boolean;
  quote_condensed_materials: boolean;
  quote_condensed_labour: boolean;
  
  // Invoice-specific options
  invoice_show_job_details: boolean;
  invoice_show_vat_breakdown: boolean;
  invoice_show_payment_terms: boolean;
  invoice_show_bank_details: boolean;
  invoice_show_due_date_prominent: boolean;
  
  created_at?: string;
  updated_at?: string;
}

export const DEFAULT_TEMPLATE_CONFIG: PDFTemplateConfig = {
  name: 'Default Template',
  is_default: true,
  
  logo_position: 'right',
  logo_size: 'medium',
  primary_colour: '#1E3A5F',
  secondary_colour: '#6B7280',
  font_family: 'helvetica',
  header_style: 'minimal',
  show_company_details: true,
  show_vat_number: true,
  show_website: false,
  
  table_show_quantities: true,
  table_show_unit_prices: true,
  table_show_line_totals: true,
  
  quote_show_scope: true,
  quote_show_expiry: true,
  quote_show_materials: true,
  quote_show_labour: true,
  quote_show_overheads: true,
  quote_show_summary: true,
  quote_condensed_materials: false,
  quote_condensed_labour: false,
  
  invoice_show_job_details: true,
  invoice_show_vat_breakdown: true,
  invoice_show_payment_terms: true,
  invoice_show_bank_details: true,
  invoice_show_due_date_prominent: true,
};

// UK Invoice Compliance: fields that cannot be hidden
export const INVOICE_REQUIRED_FIELDS = [
  'invoice_show_vat_breakdown', // Required if VAT registered
] as const;

// Preset templates for quick selection
export const PRESET_TEMPLATES: Partial<PDFTemplateConfig>[] = [
  {
    name: 'Professional Blue',
    primary_colour: '#1E3A5F',
    secondary_colour: '#6B7280',
    header_style: 'minimal',
    font_family: 'helvetica',
  },
  {
    name: 'Modern Bold',
    primary_colour: '#2962FF',
    secondary_colour: '#5C6BC0',
    header_style: 'banner',
    font_family: 'helvetica',
  },
  {
    name: 'Classic Black',
    primary_colour: '#000000',
    secondary_colour: '#4A4A4A',
    header_style: 'classic',
    font_family: 'times',
  },
];

// Convert hex to RGB for jsPDF
export function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    return [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ];
  }
  return [0, 0, 0]; // Default to black
}

// Validate hex color
export function isValidHexColor(color: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
}

// Get logo dimensions based on size setting
export function getLogoDimensions(size: 'small' | 'medium' | 'large'): { width: number; height: number } {
  switch (size) {
    case 'small': return { width: 25, height: 20 };
    case 'medium': return { width: 40, height: 30 };
    case 'large': return { width: 50, height: 38 };
    default: return { width: 40, height: 30 };
  }
}
