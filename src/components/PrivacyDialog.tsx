import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

interface PrivacyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccept?: () => void;
}

export const PrivacyDialog = ({ open, onOpenChange, onAccept }: PrivacyDialogProps) => {
  const handleAccept = () => {
    onAccept?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Privacy Policy</DialogTitle>
          <DialogDescription>
            Last Updated: {new Date().toLocaleDateString()} | Version 1.0
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-6 text-sm">
            <section>
              <h3 className="text-base font-semibold mb-2">1. Introduction</h3>
              <p className="text-muted-foreground leading-relaxed">
                We respect your privacy and are committed to protecting your personal data. This privacy policy will 
                inform you about how we look after your personal data when you use our services.
              </p>
            </section>

            <section>
              <h3 className="text-base font-semibold mb-2">3. Data We Collect</h3>
              <p className="text-muted-foreground leading-relaxed mb-2">We collect the following types of data:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>Identity Data: Name, business name</li>
                <li>Contact Data: Email address, phone numbers, business address</li>
                <li>Technical Data: IP address, browser type, device information</li>
                <li>Usage Data: How you use our website and services</li>
                <li>Business Data: Quotes, invoices, client information, schedules</li>
              </ul>
            </section>

            <section>
              <h3 className="text-base font-semibold mb-2">5. How We Use Your Data</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>To provide and manage the Service</li>
                <li>To process your orders and manage your account</li>
                <li>To communicate with you about the Service</li>
                <li>To improve our services and user experience</li>
                <li>To protect our business and comply with legal obligations</li>
              </ul>
            </section>

            <section>
              <h3 className="text-base font-semibold mb-2">6. Data Security</h3>
              <p className="text-muted-foreground leading-relaxed">
                All data is encrypted in transit using SSL/TLS and at rest using industry-standard encryption. We limit 
                access to your personal data to authorized personnel only.
              </p>
            </section>

            <section>
              <h3 className="text-base font-semibold mb-2">8. Your Legal Rights (GDPR)</h3>
              <p className="text-muted-foreground leading-relaxed mb-2">You have the right to:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>Access your personal data</li>
                <li>Request correction of your personal data</li>
                <li>Request erasure of your personal data</li>
                <li>Object to processing of your personal data</li>
                <li>Request data portability</li>
                <li>Withdraw consent at any time</li>
              </ul>
            </section>

            <section>
              <h3 className="text-base font-semibold mb-2">9. Cookies</h3>
              <p className="text-muted-foreground leading-relaxed">
                We use cookies for authentication, session management, and analytics. You can control cookies through 
                your browser settings, but some features may not work properly if you disable cookies.
              </p>
            </section>

            <section>
              <h3 className="text-base font-semibold mb-2">12. Data Breach Notification</h3>
              <p className="text-muted-foreground leading-relaxed">
                In the event of a data breach, we will notify you and relevant authorities within 72 hours, as required 
                by GDPR.
              </p>
            </section>

            <section>
              <h3 className="text-base font-semibold mb-2">15. Contact Us</h3>
              <p className="text-muted-foreground leading-relaxed">
                For questions about this Privacy Policy or to exercise your rights, contact us at support@quotable-it.co.uk.
              </p>
            </section>

            <div className="mt-6 p-4 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground italic">
                By using Quotable, you acknowledge that you have read and understood this Privacy Policy and consent to 
                the collection, use, and disclosure of your personal data as described herein.
              </p>
            </div>
          </div>
        </ScrollArea>
        {onAccept && (
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleAccept}>
              I Accept
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
