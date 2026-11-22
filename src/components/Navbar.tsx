import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { Logo } from "./Logo";
import { EarlyAccessBadge } from "./EarlyAccessBadge";
import { OFFER } from "@/config/offer";

export const Navbar = () => (
  <nav className="print:hidden fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
    <div className="container mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <Logo size="md" />
        <EarlyAccessBadge className="hidden sm:inline-flex" />
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        <Link to="/trades" className="hidden md:inline-flex px-3 py-2 text-[0.95rem] text-foreground/80 hover:text-primary rounded-sm">
          Trades
        </Link>
        <Link to={{ pathname: "/", hash: "#pricing" }} className="hidden md:inline-flex px-3 py-2 text-[0.95rem] text-foreground/80 hover:text-primary rounded-sm">
          Pricing
        </Link>
        <Link to="/auth" className="px-3 py-2 text-[0.95rem] text-foreground/80 hover:text-primary rounded-sm">
          Log in
        </Link>
        <Button asChild variant="accent" size="sm" className="h-9 px-4 ml-1">
          <Link to="/auth">{OFFER.cta}</Link>
        </Button>
      </div>
    </div>
  </nav>
);
