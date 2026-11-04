import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

interface TermsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccept?: () => void;
}

export const TermsDialog = ({ open, onOpenChange, onAccept }: TermsDialogProps) => {
  const handleAccept = () => {
    onAccept?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Terms and Conditions</DialogTitle>
          <DialogDescription>
            Last Updated: {new Date().toLocaleDateString()} | Version 1.0
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-6 text-sm">
            <section>
              <h3 className="text-base font-semibold mb-2">1. Acceptance of Terms</h3>
              <p className="text-muted-foreground leading-relaxed">
                By accessing and using Quotable ("the Service"), you accept and agree to be bound by the terms 
                and provision of this agreement. If you do not agree to these Terms and Conditions, please do 
                not use the Service.
              </p>
            </section>

            <section>
              <h3 className="text-base font-semibold mb-2">2. Description of Service</h3>
              <p className="text-muted-foreground leading-relaxed">
                Quotable provides a web-based platform for creating quotes, invoices, managing schedules, and 
                generating tax reports for tradespeople and small businesses. The Service includes tools for 
                client management, document generation, and financial tracking.
              </p>
            </section>

            <section>
              <h3 className="text-base font-semibold mb-2">3. User Account and Registration</h3>
              <p className="text-muted-foreground leading-relaxed mb-2">
                To access certain features of the Service, you must register for an account. You agree to:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>Provide accurate, current, and complete information during registration</li>
                <li>Maintain and promptly update your account information</li>
                <li>Maintain the security of your password and account</li>
                <li>Accept responsibility for all activities that occur under your account</li>
                <li>Notify us immediately of any unauthorized use of your account</li>
              </ul>
            </section>

            <section>
              <h3 className="text-base font-semibold mb-2">4. User Responsibilities</h3>
              <p className="text-muted-foreground leading-relaxed mb-2">You agree not to:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>Use the Service for any illegal purposes or in violation of any laws</li>
                <li>Upload or transmit viruses, malware, or any harmful code</li>
                <li>Attempt to gain unauthorized access to any portion of the Service</li>
                <li>Interfere with or disrupt the Service or servers</li>
                <li>Impersonate any person or entity or falsely state your affiliation</li>
                <li>Collect or store personal data about other users without permission</li>
              </ul>
            </section>

            <section>
              <h3 className="text-base font-semibold mb-2">5. Data Privacy and Storage</h3>
              <p className="text-muted-foreground leading-relaxed">
                We take data privacy seriously. All data you enter into the Service (including client information, 
                quotes, invoices, and financial records) is stored securely and encrypted. We will not share your 
                data with third parties except as required by law or with your explicit consent. You retain all 
                ownership rights to your data and may export or delete it at any time.
              </p>
            </section>

            <section>
              <h3 className="text-base font-semibold mb-2">6. Intellectual Property Rights</h3>
              <p className="text-muted-foreground leading-relaxed">
                The Service and its original content, features, and functionality are owned by Quotable and are 
                protected by international copyright, trademark, patent, trade secret, and other intellectual 
                property laws. You may not copy, modify, distribute, sell, or lease any part of the Service 
                without our prior written permission.
              </p>
            </section>

            <section>
              <h3 className="text-base font-semibold mb-2">7. Limitation of Liability</h3>
              <p className="text-muted-foreground leading-relaxed">
                The Service is provided "as is" without warranties of any kind, either express or implied. To the 
                maximum extent permitted by law, we shall not be liable for any indirect, incidental, special, 
                consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly 
                or indirectly, or any loss of data, use, goodwill, or other intangible losses resulting from your 
                use of the Service.
              </p>
            </section>

            <section>
              <h3 className="text-base font-semibold mb-2">8. Payment Terms</h3>
              <p className="text-muted-foreground leading-relaxed">
                If you subscribe to a paid plan, you agree to pay all fees associated with your subscription. 
                Fees are non-refundable except as required by law. We reserve the right to modify pricing with 
                30 days' notice to existing subscribers.
              </p>
            </section>

            <section>
              <h3 className="text-base font-semibold mb-2">9. Service Modifications and Termination</h3>
              <p className="text-muted-foreground leading-relaxed">
                We reserve the right to modify, suspend, or discontinue the Service at any time with or without 
                notice. We may also terminate or suspend your account if you violate these Terms and Conditions. 
                Upon termination, your right to use the Service will immediately cease.
              </p>
            </section>

            <section>
              <h3 className="text-base font-semibold mb-2">10. Accuracy of Information</h3>
              <p className="text-muted-foreground leading-relaxed">
                While we strive to provide accurate tools for financial calculations and tax reporting, you are 
                responsible for verifying the accuracy of all generated documents and reports. We recommend 
                consulting with qualified professionals for tax and accounting advice.
              </p>
            </section>

            <section>
              <h3 className="text-base font-semibold mb-2">11. Governing Law</h3>
              <p className="text-muted-foreground leading-relaxed">
                These Terms shall be governed by and construed in accordance with the laws of the United Kingdom, 
                without regard to its conflict of law provisions. Any disputes arising from these Terms or the 
                Service shall be subject to the exclusive jurisdiction of the courts of the United Kingdom.
              </p>
            </section>

            <div className="mt-6 p-4 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground italic">
                By creating an account and using Quotable, you acknowledge that you have read, understood, and 
                agree to be bound by these Terms and Conditions.
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
