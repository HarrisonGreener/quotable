import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { Logo } from "./Logo";
import { useIsMobile } from "@/hooks/use-mobile";

export const Navbar = () => {
  const isMobile = useIsMobile();
  
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
        <Logo size={isMobile ? "sm" : "md"} />
        
        <div className="flex items-center gap-2 sm:gap-4 min-w-[167px] justify-end">
          <Link to="/auth" className="w-auto">
            <Button variant="ghost" size={isMobile ? "sm" : "default"} className={isMobile ? "px-3" : ""}>
              Login
            </Button>
          </Link>
          <Link to="/auth" className="w-auto">
            <Button variant="accent" size={isMobile ? "sm" : "default"}>
              Get Started
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
};
