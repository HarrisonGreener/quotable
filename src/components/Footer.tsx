import { Link } from "react-router-dom";
import { COMPANY } from "@/config/company";
import { Wordmark } from "./Logo";

export const Footer = ({ compact = false }: { compact?: boolean }) => {
  const legalLine = [
    COMPANY.legalName,
    COMPANY.companyNumber && `Registered in England & Wales no. ${COMPANY.companyNumber}`,
    COMPANY.registeredOffice && `Registered office: ${COMPANY.registeredOffice}`,
    COMPANY.vatNumber && `VAT ${COMPANY.vatNumber}`,
  ].filter(Boolean).join(". ");

  const linkClass = "text-muted-foreground hover:text-primary transition-colors";

  // Inside the app: one quiet line, no marketing
  if (compact) {
    return (
      <footer className="px-4 md:px-6 py-6 text-xs text-muted-foreground flex flex-wrap gap-x-5 gap-y-2">
        <span>© {new Date().getFullYear()} {COMPANY.legalName || COMPANY.tradingName}</span>
        <Link to="/help" className={linkClass}>Help</Link>
        <Link to="/terms" className={linkClass}>Terms</Link>
        <Link to="/privacy" className={linkClass}>Privacy</Link>
      </footer>
    );
  }

  return (
    <footer className="print:hidden border-t border-border bg-background">
      <div className="container mx-auto px-4 py-10 flex flex-col md:flex-row md:items-start md:justify-between gap-8">
        <div>
          <Wordmark size="md" />
          <p className="mt-3 text-sm text-muted-foreground max-w-xs">Quotes, jobs and invoices for UK tradespeople.</p>
        </div>

        <nav aria-label="Footer" className="grid grid-cols-2 sm:flex sm:gap-8 gap-3 text-sm">
          <Link to="/trades" className={linkClass}>Trades</Link>
          <Link to="/guides" className={linkClass}>Pricing guides</Link>
          <Link to="/quote-templates" className={linkClass}>Quote templates</Link>
          {COMPANY.supportEmail ? (
            <a href={`mailto:${COMPANY.supportEmail}`} className={linkClass}>Contact</a>
          ) : (
            <Link to="/help/contact" className={linkClass}>Contact</Link>
          )}
          <Link to="/terms" className={linkClass}>Terms</Link>
          <Link to="/privacy" className={linkClass}>Privacy</Link>
        </nav>
      </div>
      <div className="container mx-auto px-4 pb-8 text-xs text-muted-foreground">
        © {new Date().getFullYear()} {COMPANY.legalName || COMPANY.tradingName}.
        {legalLine && ` ${legalLine}.`}
        {COMPANY.supportEmail && (
          <> <a href={`mailto:${COMPANY.supportEmail}`} className="hover:text-primary">{COMPANY.supportEmail}</a></>
        )}
      </div>
    </footer>
  );
};
