import { Link } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import { COMPANY } from "@/config/company";

export const Footer = () => {
  const legalLine = [
    COMPANY.legalName,
    COMPANY.companyNumber && `Registered in England & Wales no. ${COMPANY.companyNumber}`,
    COMPANY.registeredOffice && `Registered office: ${COMPANY.registeredOffice}`,
    COMPANY.vatNumber && `VAT ${COMPANY.vatNumber}`,
  ].filter(Boolean).join(" · ");

  return (
    <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-6 space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} {COMPANY.legalName || COMPANY.tradingName}. All rights reserved.
          </div>

          <nav aria-label="Footer" className="flex flex-wrap items-center justify-center gap-4 text-sm">
            <Link to="/trades" className="text-muted-foreground hover:text-primary transition-colors">
              Trades
            </Link>
            <Separator orientation="vertical" className="h-4" />
            {COMPANY.supportEmail ? (
              <a href={`mailto:${COMPANY.supportEmail}`} className="text-muted-foreground hover:text-primary transition-colors">Contact</a>
            ) : (
              <Link to="/help/contact" className="text-muted-foreground hover:text-primary transition-colors">Contact</Link>
            )}
            <Separator orientation="vertical" className="h-4" />
            <Link to="/terms" className="text-muted-foreground hover:text-primary transition-colors">
              Terms & Conditions
            </Link>
            <Separator orientation="vertical" className="h-4" />
            <Link to="/privacy" className="text-muted-foreground hover:text-primary transition-colors">
              Privacy Policy
            </Link>
          </nav>
        </div>
        {(legalLine || COMPANY.supportEmail) && (
          <p className="text-xs text-muted-foreground text-center sm:text-left">
            {legalLine}
            {legalLine && COMPANY.supportEmail && " · "}
            {COMPANY.supportEmail && (
              <a href={`mailto:${COMPANY.supportEmail}`} className="hover:text-primary">{COMPANY.supportEmail}</a>
            )}
          </p>
        )}
      </div>
    </footer>
  );
};
