import { Link } from "react-router-dom";
import { COMPANY } from "@/config/company";
import { Wordmark } from "./Logo";

export const Footer = ({ compact = false }: { compact?: boolean }) => {
  const legalLine = [
    COMPANY.legalName,
    COMPANY.companyNumber && `Registered in England & Wales no. ${COMPANY.companyNumber}`,
    COMPANY.vatNumber && `VAT ${COMPANY.vatNumber}`,
  ].filter(Boolean).join(". ");

  const linkClass = "inline-flex items-center min-h-[2.75rem] sm:min-h-0 text-muted-foreground hover:text-primary transition-colors";

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

        <nav aria-label="Footer" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-0 text-sm">
          <Link to="/quoting-software" className={linkClass}>Quoting software</Link>
          <Link to="/invoicing-software" className={linkClass}>Invoicing app</Link>
          <Link to="/job-management-software" className={linkClass}>Job management</Link>
          <Link to="/estimating-software" className={linkClass}>Estimating</Link>
          <Link to="/tools" className={linkClass}>Free tools</Link>
          <Link to="/tools/invoice-generator" className={linkClass}>Invoice generator</Link>
          <Link to="/compare" className={linkClass}>Compare</Link>
          <Link to="/trades" className={linkClass}>Trades</Link>
          <Link to="/guides" className={linkClass}>Guides</Link>
          <Link to="/quote-templates" className={linkClass}>Quote templates</Link>
          <Link to="/invoice-templates" className={linkClass}>Invoice templates</Link>
          <Link to="/price-lists" className={linkClass}>Price lists</Link>
          <Link to="/guides/how-to-register-as-self-employed-tradesperson" className={linkClass}>Going self-employed</Link>
          <Link to="/day-rates" className={linkClass}>Day rates</Link>
          <Link to="/app" className={linkClass}>Get the app</Link>
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
