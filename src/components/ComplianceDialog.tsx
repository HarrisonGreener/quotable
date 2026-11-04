import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { TermsDialog } from "@/components/TermsDialog";
import { PrivacyDialog } from "@/components/PrivacyDialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface ComplianceDialogProps {
  open: boolean;
  onCompliance: () => void;
}

export const ComplianceDialog = ({ open, onCompliance }: ComplianceDialogProps) => {
  const { user, signOut } = useAuth();
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [showTermsDialog, setShowTermsDialog] = useState(false);
  const [showPrivacyDialog, setShowPrivacyDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleAccept = async () => {
    if (!termsAccepted || !privacyAccepted) {
      toast.error("Please accept both Terms and Privacy Policy to continue");
      return;
    }

    if (!user) return;

    setIsLoading(true);
    try {
      // Use upsert to handle both insert and update in one operation
      await supabase.from('user_terms_acceptance').upsert({
        user_id: user.id,
        terms_version: '1.0',
        privacy_accepted: true,
        privacy_version: '1.0',
        privacy_accepted_at: new Date().toISOString(),
        accepted_at: new Date().toISOString(),
        user_agent: navigator.userAgent,
      }, {
        onConflict: 'user_id'
      });

      toast.success("Thank you for accepting our updated policies");
      onCompliance();
    } catch (error) {
      toast.error("Failed to record acceptance. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDecline = async () => {
    toast.info("You must accept our Terms and Privacy Policy to use Quotable");
    await signOut();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={() => {}}>
        <DialogContent className="max-w-md" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="text-2xl">Updated Terms & Privacy Policy</DialogTitle>
            <DialogDescription>
              We've updated our Terms and Privacy Policy. Please review and accept them to continue using Quotable.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="compliance-terms"
                  checked={termsAccepted}
                  onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
                />
                <Label
                  htmlFor="compliance-terms"
                  className="text-sm leading-tight cursor-pointer"
                >
                  I have read and agree to the{" "}
                  <button
                    type="button"
                    onClick={() => setShowTermsDialog(true)}
                    className="text-primary hover:underline font-medium"
                  >
                    Terms and Conditions
                  </button>
                </Label>
              </div>
              
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="compliance-privacy"
                  checked={privacyAccepted}
                  onCheckedChange={(checked) => setPrivacyAccepted(checked as boolean)}
                />
                <Label
                  htmlFor="compliance-privacy"
                  className="text-sm leading-tight cursor-pointer"
                >
                  I have read and agree to the{" "}
                  <button
                    type="button"
                    onClick={() => setShowPrivacyDialog(true)}
                    className="text-primary hover:underline font-medium"
                  >
                    Privacy Policy
                  </button>
                </Label>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Button 
                onClick={handleAccept} 
                disabled={isLoading || !termsAccepted || !privacyAccepted}
                className="w-full"
              >
                {isLoading ? "Processing..." : "Accept & Continue"}
              </Button>
              <Button 
                onClick={handleDecline} 
                variant="outline"
                className="w-full"
              >
                Decline & Sign Out
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Declining will sign you out and you won't be able to use Quotable until you accept.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <TermsDialog
        open={showTermsDialog}
        onOpenChange={setShowTermsDialog}
        onAccept={() => setTermsAccepted(true)}
      />
      
      <PrivacyDialog
        open={showPrivacyDialog}
        onOpenChange={setShowPrivacyDialog}
        onAccept={() => setPrivacyAccepted(true)}
      />
    </>
  );
};
