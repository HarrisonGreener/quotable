import jsPDF from 'jspdf';
import { BrandSettings } from '@/hooks/useBrandSettings';
import { PDFTemplateConfig, DEFAULT_TEMPLATE_CONFIG, hexToRgb, getLogoDimensions } from '@/types/pdfTemplate';

export type PDFTemplate = 'minimalist' | 'modern' | 'classic';

interface PDFHeaderOptions {
  doc: jsPDF;
  brandSettings: BrandSettings | null;
  title: string;
  template: PDFTemplate;
  config?: PDFTemplateConfig;
}

// Resolve config with defaults and compliance enforcement
const resolveConfig = (config?: PDFTemplateConfig, brandSettings?: BrandSettings | null): PDFTemplateConfig => {
  const resolved = { ...DEFAULT_TEMPLATE_CONFIG, ...config };
  
  // UK Invoice Compliance: Force VAT breakdown if VAT registered
  if (brandSettings?.vat_number) {
    resolved.invoice_show_vat_breakdown = true;
  }
  
  return resolved;
};

// Get colors from config or template
const getConfigColors = (template: PDFTemplate, config?: PDFTemplateConfig) => {
  if (config?.primary_colour) {
    const primary = hexToRgb(config.primary_colour);
    const secondary = config.secondary_colour ? hexToRgb(config.secondary_colour) : [100, 100, 100] as [number, number, number];
    
    // Determine header style colors based on header_style
    switch (config.header_style) {
      case 'banner':
      case 'modern':
        return {
          primary,
          headerBg: primary,
          headerText: [255, 255, 255] as [number, number, number],
          lineBorder: primary,
        };
      case 'bold':
        return {
          primary,
          headerBg: primary,
          headerText: [255, 255, 255] as [number, number, number],
          lineBorder: [0, 0, 0] as [number, number, number],
        };
      case 'elegant':
        return {
          primary,
          headerBg: [255, 255, 255] as [number, number, number],
          headerText: primary,
          lineBorder: secondary,
        };
      case 'split':
        return {
          primary,
          headerBg: [250, 250, 250] as [number, number, number],
          headerText: primary,
          lineBorder: primary,
        };
      case 'boxed':
        return {
          primary,
          headerBg: [255, 255, 255] as [number, number, number],
          headerText: primary,
          lineBorder: primary,
        };
      case 'classic':
        return {
          primary,
          headerBg: [230, 230, 230] as [number, number, number],
          headerText: [0, 0, 0] as [number, number, number],
          lineBorder: secondary,
        };
      default:
        // minimal / minimalist
        return {
          primary: secondary,
          headerBg: [245, 245, 245] as [number, number, number],
          headerText: [60, 60, 60] as [number, number, number],
          lineBorder: [220, 220, 220] as [number, number, number],
        };
    }
  }
  
  // Fallback to built-in template colors
  if (template === 'minimalist') {
    return { primary: [120, 120, 120], headerBg: [245, 245, 245], headerText: [60, 60, 60], lineBorder: [220, 220, 220] };
  } else if (template === 'modern') {
    return { primary: [41, 98, 255], headerBg: [41, 98, 255], headerText: [255, 255, 255], lineBorder: [41, 98, 255] };
  } else {
    return { primary: [0, 0, 0], headerBg: [230, 230, 230], headerText: [0, 0, 0], lineBorder: [100, 100, 100] };
  }
};

// Get font name for jsPDF
// Note: jsPDF only has 4 built-in fonts: helvetica, times, courier, zapfdingbats
// We map user-friendly names to the closest available jsPDF font
const getFontName = (fontFamily?: string): string => {
  // Sans-serif fonts -> helvetica
  const sansSerif = ['helvetica', 'arial', 'verdana', 'tahoma', 'trebuchet', 'lucida-sans', 'calibri', 'segoe', 'open-sans', 'roboto', 'lato', 'montserrat', 'raleway', 'poppins', 'nunito', 'source-sans'];
  // Serif fonts -> times
  const serif = ['times', 'georgia', 'palatino', 'book-antiqua', 'cambria', 'garamond', 'didot', 'bodoni', 'baskerville', 'libre-baskerville', 'playfair', 'merriweather', 'crimson', 'lora'];
  // Monospace fonts -> courier
  const mono = ['courier', 'consolas', 'monaco', 'source-code', 'fira-code', 'jetbrains-mono'];

  if (fontFamily && serif.includes(fontFamily)) return 'times';
  if (fontFamily && mono.includes(fontFamily)) return 'courier';
  return 'helvetica';
};

interface QuoteData {
  projectTitle: string;
  client: string;
  address: string;
  date: string;
  paymentType: string;
  summary?: string;
  materials: Array<{ name: string; quantity: number; unit: string; unitPrice: number; cost: number }>;
  labour: Array<{ name: string; hours?: number; rate?: number; cost: number; workers?: number }>;
  overheads: Array<{ name: string; cost: number }>;
  totals: {
    subtotal: number;
    vat: number;
    total: number;
  };
}

interface InvoiceData {
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
  };
}

const BRAND_INCOMPLETE_MESSAGE = 'Complete your brand details in Account settings';

export const isBrandComplete = (brandSettings: BrandSettings | null): boolean => {
  if (!brandSettings) return false;
  return !!(
    brandSettings.company_name &&
    brandSettings.email &&
    brandSettings.phone &&
    brandSettings.address
  );
};

// Config-driven header renderer
const renderConfigDrivenHeader = (options: PDFHeaderOptions): number => {
  const { doc, brandSettings, title, config } = options;
  const resolvedConfig = resolveConfig(config, brandSettings);
  const font = getFontName(resolvedConfig.font_family);
  const colors = getConfigColors(options.template, config);
  const margin = 20;
  let yPos = margin;

  const logoSize = getLogoDimensions(resolvedConfig.logo_size);
  const leftColWidth = 120;
  
  // Determine logo position
  let logoX = margin;
  let companyX = margin;
  
  if (resolvedConfig.logo_position === 'right') {
    logoX = 210 - margin - logoSize.width;
    companyX = margin;
  } else if (resolvedConfig.logo_position === 'center') {
    logoX = (210 - logoSize.width) / 2;
    companyX = margin;
  } else {
    // left
    logoX = margin;
    companyX = margin + logoSize.width + 10;
  }

  // Logo
  if (brandSettings?.logo_url) {
    try {
      doc.addImage(brandSettings.logo_url, 'PNG', logoX, yPos, logoSize.width, logoSize.height);
    } catch (e) {
      console.log('Could not load logo');
    }
  }

  // Company info
  if (resolvedConfig.show_company_details) {
    const infoX = resolvedConfig.logo_position === 'left' ? companyX : margin;
    doc.setFontSize(14);
    doc.setFont(font, 'bold');
    doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.text(brandSettings?.company_name || 'Complete your brand details in Account settings', infoX, yPos + 5);
    
    doc.setFontSize(9);
    doc.setFont(font, 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(brandSettings?.email || '', infoX, yPos + 11);
    doc.text(brandSettings?.phone || '', infoX, yPos + 16);
    if (brandSettings?.address) {
      const addressLines = doc.splitTextToSize(brandSettings.address, leftColWidth);
      doc.text(addressLines, infoX, yPos + 21);
    }
    if (resolvedConfig.show_website && brandSettings?.website) {
      doc.text(brandSettings.website, infoX, yPos + 31);
    }
  }
  
  yPos += Math.max(logoSize.height, 35) + 10;

  // Header style-specific title rendering
  switch (resolvedConfig.header_style) {
    case 'banner':
    case 'modern':
      // Banner style - full width colored bar
      doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
      doc.rect(0, yPos, 210, 20, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont(font, 'bold');
      doc.text(title, margin, yPos + 14);
      yPos += 30;
      break;
      
    case 'classic':
      // Classic with thick underline
      doc.setFontSize(28);
      doc.setFont(font, 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text(title, margin, yPos);
      yPos += 10;
      doc.setLineWidth(2);
      doc.setDrawColor(colors.primary[0], colors.primary[1], colors.primary[2]);
      doc.line(margin, yPos, 190, yPos);
      yPos += 10;
      break;
      
    case 'elegant':
      // Elegant - thin double lines with refined typography
      doc.setFontSize(26);
      doc.setFont(font, 'normal');
      doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
      doc.text(title, margin, yPos);
      yPos += 6;
      doc.setLineWidth(0.3);
      doc.setDrawColor(colors.lineBorder[0], colors.lineBorder[1], colors.lineBorder[2]);
      doc.line(margin, yPos, 190, yPos);
      yPos += 2;
      doc.line(margin, yPos, 190, yPos);
      yPos += 12;
      break;
      
    case 'bold':
      // Bold - strong presence with thick border
      doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
      doc.rect(0, yPos, 210, 24, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(28);
      doc.setFont(font, 'bold');
      doc.text(title.toUpperCase(), margin, yPos + 17);
      yPos += 34;
      break;
      
    case 'split':
      // Split - accent bar on left side
      doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
      doc.rect(margin, yPos, 4, 20, 'F');
      doc.setFontSize(24);
      doc.setFont(font, 'bold');
      doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
      doc.text(title, margin + 10, yPos + 14);
      yPos += 30;
      break;
      
    case 'boxed':
      // Boxed - bordered header section
      doc.setDrawColor(colors.primary[0], colors.primary[1], colors.primary[2]);
      doc.setLineWidth(1.5);
      doc.rect(margin, yPos, 170, 22);
      doc.setFontSize(22);
      doc.setFont(font, 'bold');
      doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
      doc.text(title, margin + 8, yPos + 15);
      yPos += 32;
      break;
      
    default:
      // Minimal
      doc.setFontSize(32);
      doc.setFont(font, 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text(title, margin, yPos);
      yPos += 10;
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.3);
      doc.line(margin, yPos, 190, yPos);
      yPos += 10;
  }

  return yPos;
};

// Template A: Clean Minimalist (legacy - used when no config provided)
const renderMinimalistHeader = (options: PDFHeaderOptions): number => {
  if (options.config) {
    return renderConfigDrivenHeader(options);
  }
  
  const { doc, brandSettings, title } = options;
  const margin = 20;
  let yPos = margin;

  const leftColWidth = 120;
  const logoX = margin + leftColWidth + 10;
  const logoWidth = 40;
  const logoHeight = 30;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(brandSettings?.company_name || 'Complete your brand details in Account settings', margin, yPos + 5);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(brandSettings?.email || '', margin, yPos + 11);
  doc.text(brandSettings?.phone || '', margin, yPos + 16);
  if (brandSettings?.address) {
    const addressLines = doc.splitTextToSize(brandSettings.address, leftColWidth);
    doc.text(addressLines, margin, yPos + 21);
  }

  if (brandSettings?.logo_url) {
    try {
      doc.addImage(brandSettings.logo_url, 'PNG', logoX, yPos, logoWidth, logoHeight);
    } catch (e) {
      console.log('Could not load logo');
    }
  }
  
  yPos += 40;

  doc.setFontSize(32);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(title, margin, yPos);
  yPos += 15;

  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);
  doc.line(margin, yPos, 190, yPos);
  yPos += 10;

  return yPos;
};

// Template B: Modern Professional (legacy)
const renderModernHeader = (options: PDFHeaderOptions): number => {
  if (options.config) {
    return renderConfigDrivenHeader(options);
  }
  
  const { doc, brandSettings, title } = options;
  const margin = 20;
  let yPos = margin;

  const leftColWidth = 120;
  const logoX = margin + leftColWidth + 10;
  const logoWidth = 40;
  const logoHeight = 30;

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(41, 98, 255);
  doc.text(brandSettings?.company_name || 'Complete your brand details in Account settings', margin, yPos + 8);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  doc.text(brandSettings?.email || '', margin, yPos + 16);
  doc.text(brandSettings?.phone || '', margin, yPos + 22);
  if (brandSettings?.address) {
    const addressLines = doc.splitTextToSize(brandSettings.address, leftColWidth);
    doc.text(addressLines, margin, yPos + 28);
  }

  if (brandSettings?.logo_url) {
    try {
      doc.addImage(brandSettings.logo_url, 'PNG', logoX, yPos, logoWidth, logoHeight);
    } catch (e) {
      console.log('Could not load logo');
    }
  }
  
  yPos += 45;

  doc.setFillColor(41, 98, 255);
  doc.rect(0, yPos, 210, 20, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(title, margin, yPos + 14);
  
  yPos += 30;

  return yPos;
};

// Template C: Tradesperson Classic (legacy)
const renderClassicHeader = (options: PDFHeaderOptions): number => {
  if (options.config) {
    return renderConfigDrivenHeader(options);
  }
  
  const { doc, brandSettings, title } = options;
  const margin = 20;
  let yPos = margin;

  const leftColWidth = 120;
  const logoX = margin + leftColWidth + 10;
  const logoWidth = 40;
  const logoHeight = 30;

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(brandSettings?.company_name || 'Complete your brand details in Account settings', margin, yPos + 8);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  doc.text(brandSettings?.phone || '', margin, yPos + 16);
  doc.text(brandSettings?.email || '', margin, yPos + 22);
  if (brandSettings?.address) {
    const addressLines = doc.splitTextToSize(brandSettings.address, leftColWidth);
    doc.text(addressLines, margin, yPos + 28);
  }

  if (brandSettings?.logo_url) {
    try {
      doc.addImage(brandSettings.logo_url, 'PNG', logoX, yPos, logoWidth, logoHeight);
    } catch (e) {
      console.log('Could not load logo');
    }
  }

  yPos += 45;

  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(title, margin, yPos);
  yPos += 15;

  doc.setLineWidth(2);
  doc.setDrawColor(0, 0, 0);
  doc.line(margin, yPos, 190, yPos);
  yPos += 10;

  return yPos;
};

export const renderPDFHeader = (options: PDFHeaderOptions): number => {
  switch (options.template) {
    case 'minimalist':
      return renderMinimalistHeader(options);
    case 'modern':
      return renderModernHeader(options);
    case 'classic':
      return renderClassicHeader(options);
    default:
      return renderMinimalistHeader(options);
  }
};

interface CondensedOptions {
  materials?: boolean;
  labour?: boolean;
}

export const generateQuotePDF = (
  quoteData: QuoteData,
  brandSettings: BrandSettings | null,
  template: PDFTemplate = 'minimalist',
  includeVat: boolean = true,
  condensedOptions: CondensedOptions | boolean = false,
  config?: PDFTemplateConfig
) => {
  const resolvedConfig = resolveConfig(config, brandSettings);
  const font = getFontName(resolvedConfig.font_family);
  
  // Handle backward compatibility with boolean, but prefer config values
  const condensedMaterials = config 
    ? resolvedConfig.quote_condensed_materials 
    : (typeof condensedOptions === 'boolean' ? condensedOptions : (condensedOptions.materials ?? false));
  const condensedLabour = config 
    ? resolvedConfig.quote_condensed_labour 
    : (typeof condensedOptions === 'boolean' ? condensedOptions : (condensedOptions.labour ?? false));
  
  const doc = new jsPDF();
  const pageWidth = 210;
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  const pageHeight = 297;

  let yPos = renderPDFHeader({
    doc,
    brandSettings,
    title: 'QUOTATION',
    template,
    config
  });

  // Professional Summary (controlled by config)
  if (quoteData.summary && resolvedConfig.quote_show_summary) {
    doc.setFontSize(11);
    doc.setFont(font, 'bold');
    doc.setTextColor(60, 60, 60);
    doc.text('Summary', margin, yPos);
    yPos += 6;
    
    doc.setFont(font, 'normal');
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    const summaryLines = doc.splitTextToSize(quoteData.summary, contentWidth);
    doc.text(summaryLines, margin, yPos);
    yPos += (summaryLines.length * 5) + 10;
  }

  // Scope / Project Title (controlled by config)
  if (resolvedConfig.quote_show_scope && quoteData.projectTitle) {
    doc.setFontSize(11);
    doc.setFont(font, 'bold');
    doc.setTextColor(60, 60, 60);
    doc.text('Project', margin, yPos);
    yPos += 6;
    
    doc.setFont(font, 'normal');
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(quoteData.projectTitle, margin, yPos);
    yPos += 10;
  }

  // Essential details only
  doc.setFontSize(11);
  doc.setFont(font, 'bold');
  doc.setTextColor(60, 60, 60);
  doc.text('Details', margin, yPos);
  yPos += 6;
  
  doc.setFont(font, 'normal');
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  
  const details = [
    `Client: ${quoteData.client}`,
    `Date: ${quoteData.date}`,
  ];
  
  if (resolvedConfig.show_vat_number && brandSettings?.vat_number) {
    details.push(`VAT Number: ${brandSettings.vat_number}`);
  }
  
  details.forEach(detail => {
    doc.text(detail, margin, yPos);
    yPos += 5;
  });
  yPos += 8;

  // Get colors from config or template
  const colors = getConfigColors(template, config);

  // Materials (controlled by config)
  if (quoteData.materials.length > 0 && resolvedConfig.quote_show_materials) {
    if (yPos > pageHeight - 60) {
      doc.addPage();
      yPos = margin;
    }
    
    doc.setFontSize(12);
    doc.setFont(font, 'bold');
    doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.text('Materials & Products', margin, yPos);
    yPos += 8;
    
    let totalMaterials = 0;
    quoteData.materials.forEach((m) => totalMaterials += m.cost);

    if (condensedMaterials) {
      // Condensed mode: show only total
      doc.setFontSize(10);
      doc.setFont(font, 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text('Materials Total:', margin + 2, yPos);
      doc.text(`£${totalMaterials.toFixed(2)}`, pageWidth - margin - 2, yPos, { align: 'right' });
      yPos += 10;
    } else {
      // Full mode: show itemized list with config-controlled columns
      doc.setFontSize(9);
      doc.setTextColor(colors.headerText[0], colors.headerText[1], colors.headerText[2]);
      doc.setFillColor(colors.headerBg[0], colors.headerBg[1], colors.headerBg[2]);
      doc.rect(margin, yPos - 5, contentWidth, 6, 'F');
      if (template === 'classic' || resolvedConfig.header_style === 'classic') {
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.5);
        doc.rect(margin, yPos - 5, contentWidth, 6);
      }
      
      // Dynamic column headers based on config
      doc.text('Description', margin + 2, yPos);
      if (resolvedConfig.table_show_quantities) doc.text('Qty', margin + 100, yPos);
      if (resolvedConfig.table_show_unit_prices) doc.text('Unit Price', margin + 125, yPos);
      if (resolvedConfig.table_show_line_totals) doc.text('Total', pageWidth - margin - 2, yPos, { align: 'right' });
      yPos += 8;
      
      doc.setFont(font, 'normal');
      doc.setTextColor(0, 0, 0);
      
      quoteData.materials.forEach((m) => {
        if (yPos > pageHeight - 30) {
          doc.addPage();
          yPos = margin;
        }
        doc.text(m.name.substring(0, 50), margin + 2, yPos);
        if (resolvedConfig.table_show_quantities) doc.text(`${m.quantity} ${m.unit}`, margin + 100, yPos);
        if (resolvedConfig.table_show_unit_prices) doc.text(`£${m.unitPrice.toFixed(2)}`, margin + 125, yPos);
        if (resolvedConfig.table_show_line_totals) doc.text(`£${m.cost.toFixed(2)}`, pageWidth - margin - 2, yPos, { align: 'right' });
        yPos += 5;
      });
      
      yPos += 2;
      doc.setFont(font, 'bold');
      doc.text('Materials Subtotal:', margin + 100, yPos);
      doc.text(`£${totalMaterials.toFixed(2)}`, pageWidth - margin - 2, yPos, { align: 'right' });
      yPos += 10;
    }
  }

  // Labour (controlled by config)
  if (quoteData.labour.length > 0 && resolvedConfig.quote_show_labour) {
    if (yPos > pageHeight - 60) {
      doc.addPage();
      yPos = margin;
    }
    
    doc.setFontSize(12);
    doc.setFont(font, 'bold');
    doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.text('Labour', margin, yPos);
    yPos += 8;
    
    let totalLabour = 0;
    quoteData.labour.forEach((l) => totalLabour += l.cost);

    if (condensedLabour) {
      // Condensed mode: show only total
      doc.setFontSize(10);
      doc.setFont(font, 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text('Labour Total:', margin + 2, yPos);
      doc.text(`£${totalLabour.toFixed(2)}`, pageWidth - margin - 2, yPos, { align: 'right' });
      yPos += 10;
    } else {
      // Full mode: show itemized list
      doc.setFontSize(9);
      doc.setTextColor(colors.headerText[0], colors.headerText[1], colors.headerText[2]);
      doc.setFillColor(colors.headerBg[0], colors.headerBg[1], colors.headerBg[2]);
      doc.rect(margin, yPos - 5, contentWidth, 6, 'F');
      if (template === 'classic' || resolvedConfig.header_style === 'classic') {
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.5);
        doc.rect(margin, yPos - 5, contentWidth, 6);
      }
      
      // Conditional headers based on payment type
      if (quoteData.paymentType === 'hourly') {
        doc.text('Description', margin + 2, yPos);
        doc.text('Hours', margin + 100, yPos);
        doc.text('Rate', margin + 125, yPos);
        doc.text('Total', pageWidth - margin - 2, yPos, { align: 'right' });
      } else {
        doc.text('Description', margin + 2, yPos);
        doc.text('Cost', pageWidth - margin - 2, yPos, { align: 'right' });
      }
      yPos += 8;
      
      doc.setFont(font, 'normal');
      doc.setTextColor(0, 0, 0);
      
      quoteData.labour.forEach((l) => {
        if (yPos > pageHeight - 30) {
          doc.addPage();
          yPos = margin;
        }
        doc.text(l.name.substring(0, 50), margin + 2, yPos);
        
        // Customers see a labour cost; hours × rate only when that alone explains it
        if (quoteData.paymentType === 'hourly' && l.hours && l.rate && (l.workers ?? 1) <= 1) {
          doc.text(`${l.hours}h`, margin + 100, yPos);
          doc.text(`£${l.rate}/h`, margin + 125, yPos);
        }
        
        doc.text(`£${l.cost.toFixed(2)}`, pageWidth - margin - 2, yPos, { align: 'right' });
        yPos += 5;
      });
      
      yPos += 2;
      doc.setFont(font, 'bold');
      doc.text('Labour Subtotal:', margin + 100, yPos);
      doc.text(`£${totalLabour.toFixed(2)}`, pageWidth - margin - 2, yPos, { align: 'right' });
      yPos += 10;
    }
  }

  // Overheads (controlled by config)
  if (quoteData.overheads.length > 0 && resolvedConfig.quote_show_overheads) {
    if (yPos > pageHeight - 60) {
      doc.addPage();
      yPos = margin;
    }
    
    doc.setFontSize(12);
    doc.setFont(font, 'bold');
    doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.text('Overheads & Additional Costs', margin, yPos);
    yPos += 8;
    
    let totalOverheads = 0;
    quoteData.overheads.forEach((o) => totalOverheads += o.cost);

    if (condensedMaterials) {
      // Condensed mode: show only total
      doc.setFontSize(10);
      doc.setFont(font, 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text('Overheads Total:', margin + 2, yPos);
      doc.text(`£${totalOverheads.toFixed(2)}`, pageWidth - margin - 2, yPos, { align: 'right' });
      yPos += 10;
    } else {
      // Full mode: show itemized list
      doc.setFontSize(9);
      doc.setFont(font, 'normal');
      doc.setTextColor(0, 0, 0);
      
      quoteData.overheads.forEach((o) => {
        if (yPos > pageHeight - 30) {
          doc.addPage();
          yPos = margin;
        }
        doc.text(o.name.substring(0, 60), margin + 2, yPos);
        doc.text(`£${o.cost.toFixed(2)}`, pageWidth - margin - 2, yPos, { align: 'right' });
        yPos += 5;
      });
      
      yPos += 2;
      doc.setFont(font, 'bold');
      doc.text('Overheads Subtotal:', margin + 100, yPos);
      doc.text(`£${totalOverheads.toFixed(2)}`, pageWidth - margin - 2, yPos, { align: 'right' });
      yPos += 10;
    }
  }

  // Totals
  if (yPos > pageHeight - 50) {
    doc.addPage();
    yPos = margin;
  }
  
  yPos += 5;
  const summaryBoxY = yPos;
  
  // Template-specific totals styling
  if (template === 'minimalist') {
    doc.setFillColor(250, 250, 250);
    doc.rect(margin + 90, summaryBoxY, contentWidth - 90, includeVat ? 32 : 24, 'F');
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.3);
    doc.rect(margin + 90, summaryBoxY, contentWidth - 90, includeVat ? 32 : 24);
  } else if (template === 'modern') {
    doc.setFillColor(245, 247, 252);
    doc.rect(margin + 90, summaryBoxY, contentWidth - 90, includeVat ? 32 : 24, 'F');
    doc.setDrawColor(41, 98, 255);
    doc.setLineWidth(0.5);
    doc.rect(margin + 90, summaryBoxY, contentWidth - 90, includeVat ? 32 : 24);
  } else {
    doc.setFillColor(240, 240, 240);
    doc.rect(margin + 90, summaryBoxY, contentWidth - 90, includeVat ? 32 : 24, 'F');
    doc.setDrawColor(100, 100, 100);
    doc.setLineWidth(1);
    doc.rect(margin + 90, summaryBoxY, contentWidth - 90, includeVat ? 32 : 24);
  }
  
  yPos += 7;
  doc.setFontSize(10);
  doc.setFont(font, 'normal');
  doc.setTextColor(0, 0, 0);
  doc.text('Subtotal:', margin + 95, yPos);
  doc.text(`£${quoteData.totals.subtotal.toFixed(2)}`, pageWidth - margin - 5, yPos, { align: 'right' });
  
  if (includeVat) {
    yPos += 7;
    doc.text('VAT (20%):', margin + 95, yPos);
    doc.text(`£${quoteData.totals.vat.toFixed(2)}`, pageWidth - margin - 5, yPos, { align: 'right' });
    yPos += 9;
  } else {
    yPos += 9;
  }
  
  doc.setFontSize(14);
  doc.setFont(font, 'bold');
  doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.text('TOTAL:', margin + 95, yPos);
  doc.text(`£${quoteData.totals.total.toFixed(2)}`, pageWidth - margin - 5, yPos, { align: 'right' });

  yPos += 15;

  // Footer with brand details (controlled by config)
  if (yPos > pageHeight - 40) {
    doc.addPage();
    yPos = margin;
  } else {
    yPos += 8;
  }

  doc.setFontSize(8);
  doc.setFont(font, 'italic');
  doc.setTextColor(100, 100, 100);
  
  if (resolvedConfig.quote_show_expiry) {
    doc.text('This quotation is valid for 30 days from the date of issue.', margin, yPos);
    yPos += 4;
  }
  doc.text('Payment terms: As agreed. Prices may include VAT where applicable.', margin, yPos);
  
  if (resolvedConfig.show_website && brandSettings?.website) {
    yPos += 4;
    const websiteLines = doc.splitTextToSize(`Website: ${brandSettings.website}`, pageWidth - (margin * 2));
    doc.text(websiteLines, margin, yPos);
  }

  return doc;
};

// Helper function to generate Quote PDF as Blob for preview/sharing
export const generateQuotePDFBlob = (
  quoteData: QuoteData,
  brandSettings: BrandSettings | null,
  template: PDFTemplate = 'minimalist',
  includeVat: boolean = true,
  condensedOptions: CondensedOptions | boolean = false,
  config?: PDFTemplateConfig
): { blob: Blob; doc: jsPDF } => {
  const doc = generateQuotePDF(quoteData, brandSettings, template, includeVat, condensedOptions, config);
  const blob = doc.output('blob');
  return { blob, doc };
};

export const generateInvoicePDF = (
  invoiceData: InvoiceData,
  brandSettings: BrandSettings | null,
  template: PDFTemplate = 'minimalist',
  config?: PDFTemplateConfig
) => {
  const resolvedConfig = resolveConfig(config, brandSettings);
  const font = getFontName(resolvedConfig.font_family);
  const colors = getConfigColors(template, config);
  
  const doc = new jsPDF();
  const pageWidth = 210;
  const margin = 20;
  const pageHeight = 297;

  let yPos = renderPDFHeader({
    doc,
    brandSettings,
    title: 'INVOICE',
    template,
    config
  });

  // Check if we have quote details
  const hasQuoteDetails = invoiceData.quoteDetails && (
    invoiceData.quoteDetails.job_description || 
    invoiceData.quoteDetails.category || 
    invoiceData.quoteDetails.location
  );

  // Professional Summary or Quote Details (controlled by config)
  if (hasQuoteDetails && resolvedConfig.invoice_show_job_details) {
    doc.setFontSize(11);
    doc.setFont(font, 'bold');
    doc.setTextColor(60, 60, 60);
    doc.text('Job Details', margin, yPos);
    yPos += 6;
    
    doc.setFont(font, 'normal');
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    
    if (invoiceData.quoteDetails?.category) {
      doc.text(`Category: ${invoiceData.quoteDetails.category}`, margin, yPos);
      yPos += 5;
    }
    if (invoiceData.quoteDetails?.location) {
      doc.text(`Location: ${invoiceData.quoteDetails.location}`, margin, yPos);
      yPos += 5;
    }
    if (invoiceData.quoteDetails?.job_description) {
      const descLines = doc.splitTextToSize(`Description: ${invoiceData.quoteDetails.job_description}`, pageWidth - (margin * 2));
      doc.text(descLines, margin, yPos);
      yPos += (descLines.length * 5);
    }
    yPos += 10;
  } else if (invoiceData.summary && resolvedConfig.invoice_show_job_details) {
    doc.setFontSize(11);
    doc.setFont(font, 'bold');
    doc.setTextColor(60, 60, 60);
    doc.text('Summary', margin, yPos);
    yPos += 6;
    
    doc.setFont(font, 'normal');
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    const summaryLines = doc.splitTextToSize(invoiceData.summary, pageWidth - (margin * 2));
    doc.text(summaryLines, margin, yPos);
    yPos += (summaryLines.length * 5) + 10;
  }

  // Essential invoice details
  doc.setFontSize(11);
  doc.setFont(font, 'bold');
  doc.setTextColor(60, 60, 60);
  doc.text('Invoice Details', margin, yPos);
  yPos += 6;
  
  doc.setFontSize(10);
  doc.setFont(font, 'normal');
  doc.setTextColor(0, 0, 0);
  doc.text(`Invoice Number: ${invoiceData.invoiceNumber}`, margin, yPos);
  yPos += 5;
  doc.text(`Date: ${invoiceData.date}`, margin, yPos);
  yPos += 5;
  
  // Prominent due date if config says so
  if (resolvedConfig.invoice_show_due_date_prominent) {
    doc.setFont(font, 'bold');
    doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  }
  doc.text(`Due Date: ${invoiceData.dueDate}`, margin, yPos);
  doc.setFont(font, 'normal');
  doc.setTextColor(0, 0, 0);
  yPos += 5;
  
  doc.text(`Client: ${invoiceData.client}`, margin, yPos);
  yPos += 5;
  
  // Payment Terms display (controlled by config)
  if (resolvedConfig.invoice_show_payment_terms && invoiceData.paymentTerms !== undefined) {
    const termsText = invoiceData.paymentTerms === 0 
      ? 'Payment Due: Same Day'
      : invoiceData.paymentTerms === 7 
      ? 'Payment Terms: Within 7 Days'
      : invoiceData.paymentTerms === 15 
      ? 'Payment Terms: Net 15 Days'
      : 'Payment Terms: Net 30 Days';
    doc.text(termsText, margin, yPos);
    yPos += 5;
  }
  
  if (resolvedConfig.show_vat_number && brandSettings?.vat_number) {
    doc.text(`VAT Number: ${brandSettings.vat_number}`, margin, yPos);
    yPos += 5;
  }
  yPos += 10;

  // Amount breakdown with template styling
  doc.setFillColor(colors.headerBg[0], colors.headerBg[1], colors.headerBg[2]);
  doc.rect(margin, yPos, pageWidth - (margin * 2), 8, 'F');
  if (template === 'classic') {
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.rect(margin, yPos, pageWidth - (margin * 2), 8);
  }
  doc.setTextColor(colors.headerText[0], colors.headerText[1], colors.headerText[2]);
  doc.setFont('helvetica', 'bold');
  doc.text('AMOUNT BREAKDOWN', margin + 2, yPos + 6);
  yPos += 12;

  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  
  const breakdown = [
    ['Subtotal:', `£${invoiceData.amount.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`],
    ['VAT (20%):', `£${invoiceData.tax.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`],
  ];

  breakdown.forEach(([label, value]) => {
    doc.text(label, margin + 2, yPos);
    doc.text(value, pageWidth - margin - 2, yPos, { align: 'right' });
    yPos += 6;
  });

  yPos += 4;
  doc.setDrawColor(colors.lineBorder[0], colors.lineBorder[1], colors.lineBorder[2]);
  doc.setLineWidth(template === 'classic' ? 1 : 0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 8;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.text('TOTAL DUE:', margin + 2, yPos);
  doc.text(`£${invoiceData.total.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`, pageWidth - margin - 2, yPos, { align: 'right' });

  // Status badge
  if (invoiceData.status === 'Paid') {
    yPos += 10;
    doc.setFillColor(34, 197, 94);
    doc.roundedRect(margin, yPos, 30, 8, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text('PAID', margin + 15, yPos + 5.5, { align: 'center' });
  }

  // Payment Information (Bank Details)
  const hasBankDetails = brandSettings && (
    brandSettings.account_name || 
    brandSettings.bank_name || 
    brandSettings.sort_code || 
    brandSettings.account_number || 
    brandSettings.iban || 
    brandSettings.swift_bic || 
    brandSettings.payment_notes
  );

  if (hasBankDetails) {
    if (yPos > pageHeight - 60) {
      doc.addPage();
      yPos = margin;
    }

    yPos += 20;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(60, 60, 60);
    doc.text('Payment Information', margin, yPos);
    yPos += 7;
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    
    if (brandSettings.account_name) {
      doc.text(`Account Name: ${brandSettings.account_name}`, margin, yPos);
      yPos += 4;
    }
    if (brandSettings.bank_name) {
      doc.text(`Bank Name: ${brandSettings.bank_name}`, margin, yPos);
      yPos += 4;
    }
    if (brandSettings.sort_code) {
      const formattedSortCode = brandSettings.sort_code.replace(/(\d{2})(\d{2})(\d{2})/, '$1-$2-$3');
      doc.text(`Sort Code: ${formattedSortCode}`, margin, yPos);
      yPos += 4;
    }
    if (brandSettings.account_number) {
      doc.text(`Account Number: ${brandSettings.account_number}`, margin, yPos);
      yPos += 4;
    }
    if (brandSettings.iban) {
      doc.text(`IBAN: ${brandSettings.iban}`, margin, yPos);
      yPos += 4;
    }
    if (brandSettings.swift_bic) {
      doc.text(`SWIFT/BIC: ${brandSettings.swift_bic}`, margin, yPos);
      yPos += 4;
    }
    if (brandSettings.payment_notes) {
      yPos += 2;
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(60, 60, 60);
      const notesLines = doc.splitTextToSize(brandSettings.payment_notes, pageWidth - (margin * 2));
      doc.text(notesLines, margin, yPos);
      yPos += notesLines.length * 4;
    }
  }

  // Footer
  if (yPos > pageHeight - 40) {
    doc.addPage();
    yPos = margin;
  } else {
    yPos += 8;
  }

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  
  if (brandSettings?.address) {
    const addressLines = doc.splitTextToSize(brandSettings.address, pageWidth - (margin * 2));
    doc.text(addressLines, margin, yPos);
    yPos += addressLines.length * 4;
  }
  if (brandSettings?.vat_number) {
    doc.text(`VAT Number: ${brandSettings.vat_number}`, margin, yPos);
    yPos += 4;
  }
  if (brandSettings?.website) {
    const websiteLines = doc.splitTextToSize(brandSettings.website, pageWidth - (margin * 2));
    doc.text(websiteLines, margin, yPos);
  }

  return doc;
};

// Helper function to generate Invoice PDF as Blob for preview/sharing
export const generateInvoicePDFBlob = (
  invoiceData: InvoiceData,
  brandSettings: BrandSettings | null,
  template: PDFTemplate = 'minimalist',
  config?: PDFTemplateConfig
): { blob: Blob; doc: jsPDF } => {
  const doc = generateInvoicePDF(invoiceData, brandSettings, template, config);
  const blob = doc.output('blob');
  return { blob, doc };
};
