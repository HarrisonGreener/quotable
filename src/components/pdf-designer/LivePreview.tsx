import { PDFTemplateConfig, hexToRgb, getLogoDimensions } from '@/types/pdfTemplate';
import { BrandSettings } from '@/hooks/useBrandSettings';
import { cn } from '@/lib/utils';

interface LivePreviewProps {
  config: PDFTemplateConfig;
  brandSettings: BrandSettings | null;
  documentType: 'quote' | 'invoice';
}

// Sample data for preview
const sampleQuoteData = {
  client: 'John Smith',
  date: '7 Jan 2026',
  summary: 'Complete bathroom renovation including new fixtures and tiling.',
  materials: [
    { name: 'Ceramic Wall Tiles', qty: '24 m²', price: '£320.00' },
    { name: 'Bathroom Suite', qty: '1', price: '£450.00' },
  ],
  labour: [
    { name: 'Tiling Work', hours: '8h', price: '£320.00' },
    { name: 'Plumbing', hours: '4h', price: '£180.00' },
  ],
  subtotal: '£1,270.00',
  vat: '£254.00',
  total: '£1,524.00',
};

const sampleInvoiceData = {
  invoiceNumber: 'INV-2026-001',
  client: 'John Smith',
  date: '7 Jan 2026',
  dueDate: '7 Feb 2026',
  summary: 'Bathroom renovation as per quote QT-2026-001',
  subtotal: '£1,270.00',
  vat: '£254.00',
  total: '£1,524.00',
  bankDetails: {
    accountName: 'My Company Ltd',
    sortCode: '12-34-56',
    accountNumber: '12345678',
  },
};

export function LivePreview({ config, brandSettings, documentType }: LivePreviewProps) {
  const primaryRgb = hexToRgb(config.primary_colour);
  const secondaryRgb = hexToRgb(config.secondary_colour);
  const logoDimensions = getLogoDimensions(config.logo_size);
  
  const primaryColor = `rgb(${primaryRgb.join(',')})`;
  const secondaryColor = `rgb(${secondaryRgb.join(',')})`;
  
  // Map all fonts to appropriate CSS font stacks
  const getFontStack = (font: string): string => {
    // Sans-serif fonts
    const sansSerif = ['helvetica', 'arial', 'verdana', 'tahoma', 'trebuchet', 'lucida-sans', 'calibri', 'segoe', 'open-sans', 'roboto', 'lato', 'montserrat', 'raleway', 'poppins', 'nunito', 'source-sans'];
    // Serif fonts
    const serif = ['times', 'georgia', 'palatino', 'book-antiqua', 'cambria', 'garamond', 'didot', 'bodoni', 'baskerville', 'libre-baskerville', 'playfair', 'merriweather', 'crimson', 'lora'];
    // Monospace fonts
    const mono = ['courier', 'consolas', 'monaco', 'source-code', 'fira-code', 'jetbrains-mono'];

    if (serif.includes(font)) return 'Georgia, "Times New Roman", Times, serif';
    if (mono.includes(font)) return '"Courier New", Courier, monospace';
    return 'Helvetica, Arial, sans-serif';
  };

  const fontFamily = getFontStack(config.font_family);
  const isQuote = documentType === 'quote';
  const data = isQuote ? sampleQuoteData : sampleInvoiceData;

  // Get header style specific classes and styles
  const getHeaderStyles = () => {
    const style = config.header_style;
    const isBannerStyle = style === 'banner' || style === 'modern' || style === 'bold';
    const isBoxedStyle = style === 'boxed';
    const isSplitStyle = style === 'split';
    const isElegantStyle = style === 'elegant';
    const isClassicStyle = style === 'classic';
    
    return { isBannerStyle, isBoxedStyle, isSplitStyle, isElegantStyle, isClassicStyle };
  };

  const headerStyles = getHeaderStyles();

  return (
    <div 
      className="bg-white shadow-lg border border-border rounded overflow-hidden"
      style={{ 
        aspectRatio: '210 / 297',
        fontFamily,
      }}
    >
      <div className="p-4 h-full overflow-auto text-[8px] leading-tight">
        {/* Header */}
        <div className={cn(
          "flex mb-3",
          config.logo_position === 'left' && "flex-row-reverse",
          config.logo_position === 'center' && "flex-col items-center"
        )}>
          {/* Company Info */}
          <div className={cn(
            "flex-1",
            config.logo_position === 'center' && "text-center mt-2"
          )}>
            {config.show_company_details && (
              <>
              <div 
                  className="font-bold text-[10px]"
                  style={{ color: (headerStyles.isBannerStyle || headerStyles.isSplitStyle || headerStyles.isBoxedStyle || headerStyles.isElegantStyle) ? primaryColor : 'black' }}
                >
                  {brandSettings?.company_name || 'Your Company Name'}
                </div>
                <div className="text-gray-500 text-[7px] mt-0.5">
                  {brandSettings?.email || 'email@example.com'}
                </div>
                <div className="text-gray-500 text-[7px]">
                  {brandSettings?.phone || '07700 000000'}
                </div>
                {brandSettings?.address && (
                  <div className="text-gray-500 text-[7px] max-w-[80px]">
                    {brandSettings.address.substring(0, 40)}...
                  </div>
                )}
              </>
            )}
          </div>
          
          {/* Logo */}
          {brandSettings?.logo_url && (
            <div 
              className="flex-shrink-0"
              style={{ 
                width: logoDimensions.width * 0.8,
                height: logoDimensions.height * 0.8,
              }}
            >
              <img 
                src={brandSettings.logo_url} 
                alt="Logo" 
                className="w-full h-full object-contain"
              />
            </div>
          )}
        </div>

        {/* Title - render based on header style */}
        {headerStyles.isBannerStyle ? (
          <div 
            className="py-2 px-2 -mx-4 mb-3"
            style={{ backgroundColor: primaryColor }}
          >
            <div 
              className="text-white font-bold"
              style={{ fontSize: config.header_style === 'bold' ? '16px' : '14px' }}
            >
              {config.header_style === 'bold' 
                ? (isQuote ? 'QUOTATION' : 'INVOICE')
                : (isQuote ? 'QUOTATION' : 'INVOICE')}
            </div>
          </div>
        ) : headerStyles.isSplitStyle ? (
          <div className="flex items-center mb-3">
            <div 
              className="w-1 h-5 mr-2"
              style={{ backgroundColor: primaryColor }}
            />
            <div 
              className="font-bold text-[14px]"
              style={{ color: primaryColor }}
            >
              {isQuote ? 'QUOTATION' : 'INVOICE'}
            </div>
          </div>
        ) : headerStyles.isBoxedStyle ? (
          <div 
            className="border-2 py-1.5 px-2 mb-3"
            style={{ borderColor: primaryColor }}
          >
            <div 
              className="font-bold text-[13px]"
              style={{ color: primaryColor }}
            >
              {isQuote ? 'QUOTATION' : 'INVOICE'}
            </div>
          </div>
        ) : headerStyles.isElegantStyle ? (
          <div className="mb-3">
            <div 
              className="font-normal text-[14px] mb-1"
              style={{ color: primaryColor }}
            >
              {isQuote ? 'QUOTATION' : 'INVOICE'}
            </div>
            <div 
              className="border-t mb-0.5"
              style={{ borderColor: secondaryColor, borderWidth: 0.5 }}
            />
            <div 
              className="border-t"
              style={{ borderColor: secondaryColor, borderWidth: 0.5 }}
            />
          </div>
        ) : (
          <>
            <div 
              className="font-bold text-[14px] mb-1"
              style={{ color: headerStyles.isClassicStyle ? 'black' : primaryColor }}
            >
              {isQuote ? 'QUOTATION' : 'INVOICE'}
            </div>
            <div 
              className="border-t mb-3"
              style={{ 
                borderColor: headerStyles.isClassicStyle ? primaryColor : '#e5e5e5',
                borderWidth: headerStyles.isClassicStyle ? 2 : 1,
              }}
            />
          </>
        )}

        {/* Summary Section */}
        {((isQuote && config.quote_show_summary) || (!isQuote && config.invoice_show_job_details)) && (
          <div className="mb-2">
            <div className="font-semibold text-gray-600 mb-0.5">
              {isQuote ? 'Summary' : 'Job Details'}
            </div>
            <div className="text-[7px] text-gray-700">
              {data.summary}
            </div>
          </div>
        )}

        {/* Details */}
        <div className="mb-2">
          <div className="font-semibold text-gray-600 mb-0.5">Details</div>
          <div className="text-[7px]">
            <div>Client: {data.client}</div>
            <div>Date: {data.date}</div>
            {!isQuote && 'invoiceNumber' in data && (
              <>
                <div>Invoice: {data.invoiceNumber}</div>
                <div>Due: {data.dueDate}</div>
              </>
            )}
            {config.show_vat_number && brandSettings?.vat_number && (
              <div>VAT: {brandSettings.vat_number}</div>
            )}
          </div>
        </div>

        {/* Materials Table (Quote only) */}
        {isQuote && config.quote_show_materials && !config.quote_condensed_materials && (
          <div className="mb-2">
            <div className="font-semibold mb-0.5" style={{ color: secondaryColor }}>
              Materials
            </div>
            <div 
              className="text-[6px] py-0.5 px-1 flex justify-between font-medium"
              style={{ 
                backgroundColor: headerStyles.isBannerStyle ? primaryColor : '#f0f0f0',
                color: headerStyles.isBannerStyle ? 'white' : 'black',
              }}
            >
              <span>Item</span>
              {config.table_show_quantities && <span>Qty</span>}
              {config.table_show_line_totals && <span>Total</span>}
            </div>
            {sampleQuoteData.materials.map((m, i) => (
              <div key={i} className="text-[6px] py-0.5 px-1 flex justify-between border-b border-gray-100">
                <span className="flex-1">{m.name}</span>
                {config.table_show_quantities && <span className="w-8 text-center">{m.qty}</span>}
                {config.table_show_line_totals && <span className="w-12 text-right">{m.price}</span>}
              </div>
            ))}
          </div>
        )}

        {/* Labour Table (Quote only) */}
        {isQuote && config.quote_show_labour && !config.quote_condensed_labour && (
          <div className="mb-2">
            <div className="font-semibold mb-0.5" style={{ color: secondaryColor }}>
              Labour
            </div>
            <div 
              className="text-[6px] py-0.5 px-1 flex justify-between font-medium"
              style={{ 
                backgroundColor: headerStyles.isBannerStyle ? primaryColor : '#f0f0f0',
                color: headerStyles.isBannerStyle ? 'white' : 'black',
              }}
            >
              <span>Task</span>
              {config.table_show_quantities && <span>Hours</span>}
              {config.table_show_line_totals && <span>Total</span>}
            </div>
            {sampleQuoteData.labour.map((l, i) => (
              <div key={i} className="text-[6px] py-0.5 px-1 flex justify-between border-b border-gray-100">
                <span className="flex-1">{l.name}</span>
                {config.table_show_quantities && <span className="w-8 text-center">{l.hours}</span>}
                {config.table_show_line_totals && <span className="w-12 text-right">{l.price}</span>}
              </div>
            ))}
          </div>
        )}

        {/* Totals */}
        <div className="border-t pt-1 mt-2">
          <div className="flex justify-between text-[7px]">
            <span>Subtotal:</span>
            <span>{data.subtotal}</span>
          </div>
          {(isQuote || config.invoice_show_vat_breakdown) && (
            <div className="flex justify-between text-[7px]">
              <span>VAT (20%):</span>
              <span>{data.vat}</span>
            </div>
          )}
          <div 
            className="flex justify-between text-[9px] font-bold mt-1"
            style={{ color: primaryColor }}
          >
            <span>TOTAL:</span>
            <span>{data.total}</span>
          </div>
        </div>

        {/* Bank Details (Invoice only) */}
        {!isQuote && config.invoice_show_bank_details && (
          <div className="mt-3 pt-2 border-t">
            <div className="font-semibold text-gray-600 text-[7px] mb-0.5">
              Payment Information
            </div>
            <div className="text-[6px] text-gray-600">
              <div>Account: {sampleInvoiceData.bankDetails.accountName}</div>
              <div>Sort Code: {sampleInvoiceData.bankDetails.sortCode}</div>
              <div>Account No: {sampleInvoiceData.bankDetails.accountNumber}</div>
            </div>
          </div>
        )}

        {/* Expiry (Quote only) */}
        {isQuote && config.quote_show_expiry && (
          <div className="mt-3 text-[6px] text-gray-400 italic">
            This quotation is valid for 30 days from the date of issue.
          </div>
        )}

        {/* Website */}
        {config.show_website && brandSettings?.website && (
          <div className="mt-1 text-[6px] text-gray-400">
            {brandSettings.website}
          </div>
        )}
      </div>
    </div>
  );
}
