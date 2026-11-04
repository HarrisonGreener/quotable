import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Cookie } from "lucide-react";

export const CookieConsent = () => {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookie-consent", "accepted");
    setShowBanner(false);
  };

  const handleDecline = () => {
    localStorage.setItem("cookie-consent", "declined");
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div role="region" aria-label="Cookie consent" className="fixed bottom-0 left-0 right-0 z-50 p-3 md:p-4 animate-in slide-in-from-bottom-5">
      <Card className="max-w-3xl mx-auto shadow-lg border">
        <CardContent className="p-3 md:p-4">
          <div className="flex items-start gap-4">
            <Cookie className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
            <div className="flex-1 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-sm mb-1">Cookies</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    We use essential cookies to keep you signed in. With your OK we also use analytics cookies
                    to see how the site is used.{" "}
                    <Link to="/privacy" className="text-primary hover:underline font-medium">
                      Privacy Policy
                    </Link>
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDecline}
                  className="flex-shrink-0"
                  aria-label="Close and use essential cookies only"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button onClick={handleAccept} className="w-full sm:w-auto">
                  Accept All
                </Button>
                <Button onClick={handleDecline} variant="outline" className="w-full sm:w-auto">
                  Essential Only
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
